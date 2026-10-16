<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Organization;
use App\Models\Transaction;
use App\Models\TransactionCategory;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class TransactionTest extends TestCase
{
    use RefreshDatabase;

    /** @return array{0: User, 1: Account} */
    private function tenant(string $name, string $balance = '100.00'): array
    {
        $organization = Organization::create([
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(6)),
        ]);

        $user = User::create([
            'name' => 'User ' . $name,
            'email' => Str::lower(Str::random(8)) . '@example.test',
            'password' => Hash::make('Password123'),
            'organization_id' => $organization->id,
        ]);

        $account = Account::create([
            'organization_id' => $organization->id,
            'name' => 'Main',
            'type' => 'bank',
            'currency' => 'USD',
            'balance' => $balance,
            'created_by' => $user->id,
        ]);

        return [$user, $account];
    }

    private function category(User $user, string $type): TransactionCategory
    {
        $category = new TransactionCategory();
        $category->forceFill([
            'organization_id' => $user->organization_id,
            'name' => 'Cat ' . $type,
            'type' => $type,
        ])->save();

        return $category;
    }

    private function payload(Account $account, array $overrides = []): array
    {
        return array_merge([
            'account_id' => $account->id,
            'type' => 'income',
            'amount' => 50,
            'description' => 'Test payment',
            'date' => '2026-10-14',
        ], $overrides);
    }

    public function test_income_and_expense_change_the_balance(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/transactions', $this->payload($account))->assertCreated();
        $this->assertSame('150.00', $account->refresh()->balance);

        $this->postJson('/api/v1/transactions', $this->payload($account, ['type' => 'expense', 'amount' => 20.5]))->assertCreated();
        $this->assertSame('129.50', $account->refresh()->balance);
    }

    public function test_account_of_another_organization_is_rejected(): void
    {
        [$userA] = $this->tenant('Alpha');
        [, $accountB] = $this->tenant('Bravo');
        Sanctum::actingAs($userA);

        $this->postJson('/api/v1/transactions', $this->payload($accountB))
            ->assertStatus(422)
            ->assertJsonValidationErrors('account_id');

        $this->assertSame('100.00', $accountB->refresh()->balance);
        $this->assertSame(0, Transaction::count());
    }

    public function test_category_of_another_organization_is_rejected(): void
    {
        [$userA, $accountA] = $this->tenant('Alpha');
        [$userB] = $this->tenant('Bravo');
        $foreign = $this->category($userB, 'income');
        Sanctum::actingAs($userA);

        $this->postJson('/api/v1/transactions', $this->payload($accountA, ['category_id' => $foreign->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('category_id');
    }

    public function test_category_type_must_match_transaction_type(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        $expenseCategory = $this->category($user, 'expense');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/transactions', $this->payload($account, ['category_id' => $expenseCategory->id]))
            ->assertStatus(422)
            ->assertJsonValidationErrors('category_id');
    }

    public function test_only_income_and_expense_are_supported(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/transactions', $this->payload($account, ['type' => 'transfer']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('type');
    }

    public function test_currency_must_match_the_account(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/transactions', $this->payload($account, ['currency' => 'EUR']))
            ->assertStatus(422)
            ->assertJsonValidationErrors('currency');
    }

    public function test_amount_must_be_positive_with_at_most_two_decimals(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/transactions', $this->payload($account, ['amount' => 0]))
            ->assertStatus(422)->assertJsonValidationErrors('amount');
        $this->postJson('/api/v1/transactions', $this->payload($account, ['amount' => 10.999]))
            ->assertStatus(422)->assertJsonValidationErrors('amount');
    }

    public function test_idempotency_key_prevents_duplicates(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);
        $headers = ['Idempotency-Key' => 'order-1001-payment'];

        $this->postJson('/api/v1/transactions', $this->payload($account), $headers)->assertCreated();
        $this->postJson('/api/v1/transactions', $this->payload($account), $headers)
            ->assertOk()
            ->assertHeader('Idempotent-Replayed', 'true');

        $this->assertSame(1, Transaction::count());
        $this->assertSame('150.00', $account->refresh()->balance);
    }

    public function test_idempotency_key_reused_with_different_payload_conflicts(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);
        $headers = ['Idempotency-Key' => 'order-1001-payment'];

        $this->postJson('/api/v1/transactions', $this->payload($account), $headers)->assertCreated();
        $this->postJson('/api/v1/transactions', $this->payload($account, ['amount' => 60]), $headers)->assertStatus(409);

        $this->assertSame(1, Transaction::count());
    }

    public function test_transaction_of_another_organization_is_not_accessible(): void
    {
        [$userA, $accountA] = $this->tenant('Alpha');
        [$userB] = $this->tenant('Bravo');

        Sanctum::actingAs($userA);
        $id = $this->postJson('/api/v1/transactions', $this->payload($accountA))->json('data.id');

        Sanctum::actingAs($userB);
        $this->getJson("/api/v1/transactions/{$id}")->assertNotFound();
        $this->deleteJson("/api/v1/transactions/{$id}")->assertNotFound();
        $this->assertSame('150.00', $accountA->refresh()->balance);
    }

    public function test_delete_books_a_reversal_instead_of_removing_the_record(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/v1/transactions', $this->payload($account))->json('data.id');
        $this->deleteJson("/api/v1/transactions/{$id}")->assertOk();

        $this->assertSame('100.00', $account->refresh()->balance);
        $this->assertSame('reversed', Transaction::find($id)->status);
        $this->assertSame(2, Transaction::count());
        $this->assertSame(1, Transaction::where('status', 'reversal')->count());

        $this->deleteJson("/api/v1/transactions/{$id}")->assertStatus(409);
        $this->assertSame('100.00', $account->refresh()->balance);
    }

    public function test_per_page_is_limited(): void
    {
        [$user] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $this->getJson('/api/v1/transactions?per_page=1000')
            ->assertStatus(422)
            ->assertJsonValidationErrors('per_page');
    }

    public function test_summary_is_grouped_by_currency_and_ignores_reversed_entries(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $this->postJson('/api/v1/transactions', $this->payload($account, ['amount' => 50]))->assertCreated();
        $id = $this->postJson('/api/v1/transactions', $this->payload($account, ['amount' => 30]))->json('data.id');
        $this->deleteJson("/api/v1/transactions/{$id}")->assertOk();

        $this->getJson('/api/v1/transactions')
            ->assertOk()
            ->assertJsonPath('meta.summary.USD.total_income', '50.00')
            ->assertJsonPath('meta.summary.USD.total_expense', '0.00')
            ->assertJsonPath('meta.summary.USD.net_amount', '50.00');
    }

    public function test_an_audit_record_is_written(): void
    {
        [$user, $account] = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $id = $this->postJson('/api/v1/transactions', $this->payload($account))->json('data.id');

        $this->assertDatabaseHas('audit_logs', [
            'organization_id' => $user->organization_id,
            'resource_type' => 'transaction',
            'resource_id' => $id,
            'action' => 'create',
        ]);
    }
}
