<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Transaction;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TransactionController extends Controller
{
    /**
     * Display a listing of transactions
     */
    public function index(Request $request): JsonResponse
    {
        $query = Transaction::where('organization_id', $request->user()->organization_id)
            ->with(['account', 'category', 'createdBy']);

        // Apply filters
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('date_from')) {
            $query->where('date', '>=', $request->date_from);
        }

        if ($request->has('date_to')) {
            $query->where('date', '<=', $request->date_to);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('description', 'like', "%{$search}%")
                    ->orWhere('reference', 'like', "%{$search}%");
            });
        }

        $transactions = $query->orderBy('date', 'desc')
            ->paginate($request->get('per_page', 20));

        // Calculate summary
        $summary = [
            'total_income' => Transaction::where('organization_id', $request->user()->organization_id)
                ->where('type', 'income')
                ->where('status', 'completed')
                ->sum('amount'),
            'total_expense' => Transaction::where('organization_id', $request->user()->organization_id)
                ->where('type', 'expense')
                ->where('status', 'completed')
                ->sum('amount'),
        ];
        $summary['net_amount'] = $summary['total_income'] - $summary['total_expense'];

        return response()->json([
            'success' => true,
            'data' => $transactions,
            'meta' => [
                'summary' => $summary,
            ],
        ]);
    }

    /**
     * Store a newly created transaction
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'account_id' => 'required|uuid|exists:accounts,id',
            'type' => 'required|string|in:income,expense,transfer,refund,payment',
            'amount' => 'required|numeric|min:0',
            'currency' => 'nullable|string|max:3',
            'description' => 'required|string|max:500',
            'category_id' => 'nullable|uuid|exists:transaction_categories,id',
            'reference' => 'nullable|string|max:255',
            'date' => 'required|date',
            'tags' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $validated['organization_id'] = $request->user()->organization_id;
        $validated['created_by'] = $request->user()->id;
        $validated['currency'] = $validated['currency'] ?? 'USD';

        $transaction = Transaction::create($validated);

        // Update account balance
        $account = $transaction->account;
        if ($transaction->type === 'income') {
            $account->increment('balance', $transaction->amount);
        } elseif ($transaction->type === 'expense') {
            $account->decrement('balance', $transaction->amount);
        }

        return response()->json([
            'success' => true,
            'data' => $transaction->load(['account', 'category', 'createdBy']),
        ], 201);
    }

    /**
     * Display the specified transaction
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::where('organization_id', $request->user()->organization_id)
            ->with(['account', 'category', 'createdBy'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $transaction,
        ]);
    }

    /**
     * Update the specified transaction
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'description' => 'sometimes|string|max:500',
            'category_id' => 'nullable|uuid|exists:transaction_categories,id',
            'reference' => 'nullable|string|max:255',
            'date' => 'sometimes|date',
            'tags' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $transaction->update($validated);

        return response()->json([
            'success' => true,
            'data' => $transaction->load(['account', 'category', 'createdBy']),
        ]);
    }

    /**
     * Remove the specified transaction
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $transaction = Transaction::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        // Reverse account balance update
        $account = $transaction->account;
        if ($transaction->type === 'income') {
            $account->decrement('balance', $transaction->amount);
        } elseif ($transaction->type === 'expense') {
            $account->increment('balance', $transaction->amount);
        }

        $transaction->delete();

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Transaction deleted successfully'],
        ]);
    }
}
