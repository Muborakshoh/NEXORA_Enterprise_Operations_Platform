<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Account;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use App\Services\SecurityLogger;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\UniqueConstraintViolationException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

/**
 * Financial transactions.
 *
 * Guarantees (until Finance moves to the layered structure):
 *  - every referenced record belongs to the caller's organization;
 *  - a transaction and its balance change are one atomic DB transaction;
 *  - only income/expense are supported, other types are rejected explicitly;
 *  - a transaction is never deleted: DELETE creates a reversal entry;
 *  - POST honours an optional Idempotency-Key header.
 */
class TransactionController extends Controller
{
    private const SUPPORTED_TYPES = ['income', 'expense'];
    private const FILTER_TYPES = ['income', 'expense', 'transfer', 'refund', 'payment'];

    private const STATUS_COMPLETED = 'completed';
    private const STATUS_REVERSED = 'reversed';
    private const STATUS_REVERSAL = 'reversal';

    private const RELATIONS = ['account', 'category', 'createdBy'];

    public function index(Request $request): JsonResponse
    {
        $filters = $request->validate([
            'type' => ['nullable', Rule::in(self::FILTER_TYPES)],
            'status' => ['nullable', Rule::in([self::STATUS_COMPLETED, self::STATUS_REVERSED, self::STATUS_REVERSAL])],
            'account_id' => ['nullable', 'uuid'],
            'date_from' => ['nullable', 'date'],
            'date_to' => ['nullable', 'date'],
            'search' => ['nullable', 'string', 'max:100'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:100'],
        ]);

        $filtered = $this->filtered($request->user()->organization_id, $filters);

        $transactions = (clone $filtered)
            ->with(self::RELATIONS)
            ->orderByDesc('date')
            ->orderByDesc('created_at')
            ->paginate($filters['per_page'] ?? 20);

        $summary = (clone $filtered)
            ->where('status', self::STATUS_COMPLETED)
            ->whereIn('type', self::SUPPORTED_TYPES)
            ->selectRaw("
                currency,
                ROUND(COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0), 2) AS total_income,
                ROUND(COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0), 2) AS total_expense,
                ROUND(
                    COALESCE(SUM(amount) FILTER (WHERE type = 'income'), 0)
                    - COALESCE(SUM(amount) FILTER (WHERE type = 'expense'), 0), 2
                ) AS net_amount
            ")
            ->groupBy('currency')
            ->get()
            ->mapWithKeys(fn ($row) => [$row->currency => [
                'total_income' => (string) $row->total_income,
                'total_expense' => (string) $row->total_expense,
                'net_amount' => (string) $row->net_amount,
            ]]);

        return response()->json([
            'success' => true,
            'data' => $transactions,
            'meta' => ['summary' => $summary],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;
        $key = $this->idempotencyKey($request);

        $data = $request->validate([
            'account_id' => [
                'required', 'uuid',
                Rule::exists('accounts', 'id')->where('organization_id', $organizationId)->whereNull('deleted_at'),
            ],
            'type' => ['required', 'string', Rule::in(self::SUPPORTED_TYPES)],
            'amount' => ['required', 'decimal:0,2', 'gt:0', 'max:999999999999.99'],
            'currency' => ['nullable', 'string', 'size:3'],
            'description' => ['required', 'string', 'max:255'],
            'category_id' => [
                'nullable', 'uuid',
                Rule::exists('transaction_categories', 'id')->where('organization_id', $organizationId),
            ],
            'reference' => ['nullable', 'string', 'max:255'],
            'date' => ['required', 'date'],
            'tags' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
        ], [
            'type.in' => 'Only income and expense transactions are supported at the moment.',
        ]);

        $amount = number_format((float) $data['amount'], 2, '.', '');

        $existing = $key !== null ? $this->findByKey($organizationId, $key) : null;
        if ($existing !== null) {
            return $this->replay($existing, $data['account_id'], $data['type'], $amount);
        }

        try {
            $transaction = DB::transaction(function () use ($request, $user, $organizationId, $data, $amount, $key) {
                $account = Account::query()
                    ->where('organization_id', $organizationId)
                    ->whereKey($data['account_id'])
                    ->lockForUpdate()
                    ->firstOrFail();

                $this->assertAccountUsable($account, $data['currency'] ?? null);
                $this->assertCategoryMatches($organizationId, $data['category_id'] ?? null, $data['type']);

                $transaction = Transaction::create([
                    'organization_id' => $organizationId,
                    'account_id' => $account->id,
                    'type' => $data['type'],
                    'amount' => $amount,
                    'currency' => $account->currency,
                    'description' => $data['description'],
                    'category_id' => $data['category_id'] ?? null,
                    'reference' => $data['reference'] ?? null,
                    'date' => $data['date'],
                    'status' => self::STATUS_COMPLETED,
                    'tags' => $data['tags'] ?? null,
                    'metadata' => $data['metadata'] ?? null,
                    'created_by' => $user->id,
                    'idempotency_key' => $key,
                ]);

                $this->moveBalance($account, $transaction->type, $amount);

                SecurityLogger::audit($user, 'create', 'transaction', $transaction->id, $transaction->description, $request, [
                    'type' => $transaction->type,
                    'amount' => $amount,
                    'currency' => $account->currency,
                    'account_id' => $account->id,
                ]);

                return $transaction;
            });
        } catch (UniqueConstraintViolationException $e) {
            // A concurrent request with the same Idempotency-Key won the race.
            $existing = $key !== null ? $this->findByKey($organizationId, $key) : null;
            if ($existing === null) {
                throw $e;
            }

            return $this->replay($existing, $data['account_id'], $data['type'], $amount);
        }

        return response()->json([
            'success' => true,
            'data' => $transaction->load(self::RELATIONS),
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::query()
            ->where('organization_id', $request->user()->organization_id)
            ->with(self::RELATIONS)
            ->findOrFail($this->uuid($id));

        return response()->json(['success' => true, 'data' => $transaction]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;
        $id = $this->uuid($id);

        $validated = $request->validate([
            'description' => ['sometimes', 'string', 'max:255'],
            'category_id' => [
                'nullable', 'uuid',
                Rule::exists('transaction_categories', 'id')->where('organization_id', $organizationId),
            ],
            'reference' => ['nullable', 'string', 'max:255'],
            'date' => ['sometimes', 'date'],
            'tags' => ['nullable', 'array'],
            'metadata' => ['nullable', 'array'],
        ]);

        $transaction = DB::transaction(function () use ($request, $user, $organizationId, $id, $validated) {
            $transaction = Transaction::query()
                ->where('organization_id', $organizationId)
                ->whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($transaction->status !== self::STATUS_COMPLETED) {
                abort(409, 'Only completed transactions can be edited.');
            }

            if (array_key_exists('category_id', $validated)) {
                $this->assertCategoryMatches($organizationId, $validated['category_id'], $transaction->type);
            }

            // Amount, type, account and currency are immutable: money changes go through a reversal.
            $transaction->fill($validated);
            $dirty = $transaction->getDirty();
            $old = array_intersect_key($transaction->getOriginal(), $dirty);
            $transaction->save();

            if ($dirty !== []) {
                SecurityLogger::audit($user, 'update', 'transaction', $transaction->id, $transaction->description, $request, [
                    'old' => $old,
                    'new' => $dirty,
                ]);
            }

            return $transaction;
        });

        return response()->json([
            'success' => true,
            'data' => $transaction->load(self::RELATIONS),
        ]);
    }

    /**
     * DELETE never removes a financial record: it books a reversal entry and marks the original as reversed.
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $user = $request->user();
        $organizationId = $user->organization_id;
        $id = $this->uuid($id);

        $reversal = DB::transaction(function () use ($request, $user, $organizationId, $id) {
            $original = Transaction::query()
                ->where('organization_id', $organizationId)
                ->whereKey($id)
                ->lockForUpdate()
                ->firstOrFail();

            if ($original->status !== self::STATUS_COMPLETED) {
                abort(409, 'The transaction has already been reversed.');
            }
            if (! in_array($original->type, self::SUPPORTED_TYPES, true)) {
                abort(409, 'Reversal is not supported for this transaction type yet.');
            }

            $account = Account::withTrashed()
                ->where('organization_id', $organizationId)
                ->whereKey($original->account_id)
                ->lockForUpdate()
                ->firstOrFail();

            $amount = (string) $original->amount;
            $oppositeType = $original->type === 'income' ? 'expense' : 'income';

            $reversal = Transaction::create([
                'organization_id' => $organizationId,
                'account_id' => $account->id,
                'type' => $oppositeType,
                'amount' => $amount,
                'currency' => $original->currency,
                'description' => 'Reversal: ' . Str::limit($original->description, 240, ''),
                'reference' => $original->reference,
                'date' => now()->toDateString(),
                'status' => self::STATUS_REVERSAL,
                'metadata' => ['reversal_of' => $original->id],
                'created_by' => $user->id,
            ]);

            $this->moveBalance($account, $oppositeType, $amount);

            $original->update([
                'status' => self::STATUS_REVERSED,
                'metadata' => array_merge($original->metadata ?? [], ['reversed_by' => $reversal->id]),
            ]);

            SecurityLogger::audit($user, 'custom', 'transaction', $original->id, $original->description, $request, [
                'operation' => 'reverse',
                'reversal_id' => $reversal->id,
                'amount' => $amount,
                'currency' => $original->currency,
                'account_id' => $account->id,
            ]);

            return $reversal;
        });

        return response()->json([
            'success' => true,
            'data' => [
                'message' => 'Transaction reversed',
                'reversal' => $reversal->load(self::RELATIONS),
            ],
        ]);
    }

    private function filtered(string $organizationId, array $filters): Builder
    {
        $query = Transaction::query()->where('organization_id', $organizationId);

        foreach (['type', 'status', 'account_id'] as $column) {
            if (! empty($filters[$column])) {
                $query->where($column, $filters[$column]);
            }
        }
        if (! empty($filters['date_from'])) {
            $query->whereDate('date', '>=', $filters['date_from']);
        }
        if (! empty($filters['date_to'])) {
            $query->whereDate('date', '<=', $filters['date_to']);
        }
        if (! empty($filters['search'])) {
            $like = '%' . addcslashes($filters['search'], '%_\\') . '%';
            $query->where(fn ($q) => $q->where('description', 'ilike', $like)->orWhere('reference', 'ilike', $like));
        }

        return $query;
    }

    private function uuid(string $id): string
    {
        abort_unless(Str::isUuid($id), 404);

        return $id;
    }

    private function idempotencyKey(Request $request): ?string
    {
        $key = $request->header('Idempotency-Key');
        if ($key === null || $key === '') {
            return null;
        }
        if (! preg_match('/^[A-Za-z0-9._:-]{8,100}$/', $key)) {
            throw ValidationException::withMessages([
                'idempotency_key' => ['Idempotency-Key must be 8-100 characters: letters, digits, . _ : -'],
            ]);
        }

        return $key;
    }

    private function findByKey(string $organizationId, string $key): ?Transaction
    {
        return Transaction::query()
            ->where('organization_id', $organizationId)
            ->where('idempotency_key', $key)
            ->first();
    }

    private function replay(Transaction $existing, string $accountId, string $type, string $amount): JsonResponse
    {
        $sameRequest = $existing->account_id === $accountId
            && $existing->type === $type
            && (string) $existing->amount === $amount;

        abort_unless($sameRequest, 409, 'Idempotency-Key was already used with a different request.');

        return response()
            ->json(['success' => true, 'data' => $existing->load(self::RELATIONS)])
            ->header('Idempotent-Replayed', 'true');
    }

    private function assertAccountUsable(Account $account, ?string $currency): void
    {
        if (! $account->is_active) {
            throw ValidationException::withMessages(['account_id' => ['The account is inactive.']]);
        }
        if ($currency !== null && strtoupper($currency) !== strtoupper($account->currency)) {
            throw ValidationException::withMessages([
                'currency' => ["The transaction currency must match the account currency ({$account->currency})."],
            ]);
        }
    }

    private function assertCategoryMatches(string $organizationId, ?string $categoryId, string $type): void
    {
        if ($categoryId === null) {
            return;
        }

        $category = TransactionCategory::query()
            ->where('organization_id', $organizationId)
            ->find($categoryId);

        if ($category === null || $category->type !== $type) {
            throw ValidationException::withMessages([
                'category_id' => ['The category type does not match the transaction type.'],
            ]);
        }
    }

    /** Must be called inside a DB transaction with the account row locked. */
    private function moveBalance(Account $account, string $type, string $amount): void
    {
        $type === 'income'
            ? $account->increment('balance', $amount)
            : $account->decrement('balance', $amount);
    }
}
