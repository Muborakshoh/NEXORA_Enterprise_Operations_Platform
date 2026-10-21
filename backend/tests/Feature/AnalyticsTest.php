<?php

namespace Tests\Feature;

use App\Models\Account;
use App\Models\Organization;
use App\Models\Transaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class AnalyticsTest extends TestCase
{
    use RefreshDatabase;

    private function tenant(string $name): User
    {
        $organization = Organization::create([
            'name' => $name,
            'slug' => Str::slug($name) . '-' . Str::lower(Str::random(6)),
        ]);

        return User::create([
            'name' => 'User ' . $name,
            'email' => Str::lower(Str::random(8)) . '@example.test',
            'password' => Hash::make('Password123'),
            'organization_id' => $organization->id,
        ]);
    }

    private function account(User $user, string $currency = 'USD'): Account
    {
        return Account::create([
            'organization_id' => $user->organization_id,
            'name' => 'Account ' . $currency,
            'type' => 'bank',
            'currency' => $currency,
            'balance' => '0.00',
            'created_by' => $user->id,
        ]);
    }

    private function tx(User $user, Account $account, string $type, string $amount, ?string $date = null, string $status = 'completed'): Transaction
    {
        return Transaction::create([
            'organization_id' => $user->organization_id,
            'account_id' => $account->id,
            'type' => $type,
            'amount' => $amount,
            'currency' => $account->currency,
            'description' => 'Fixture',
            'date' => $date ?? now()->toDateString(),
            'status' => $status,
            'created_by' => $user->id,
        ]);
    }

    private function aggregation(array $overrides = []): array
    {
        return array_merge([
            'name' => 'Revenue',
            'data_source' => 'transactions',
            'metric' => 'amount',
            'aggregation_type' => 'sum',
            'dimensions' => ['type'],
        ], $overrides);
    }

    private function widget(array $config = []): array
    {
        return [
            'id' => 'w1',
            'type' => 'kpi_card',
            'title' => 'Revenue',
            'config' => array_merge(['data_source' => 'transactions', 'metric' => 'amount', 'aggregation' => 'sum'], $config),
            'position' => ['x' => 0, 'y' => 0, 'w' => 4, 'h' => 2],
        ];
    }

    private function execute(string $id, array $body = [])
    {
        return $this->postJson("/api/v1/analytics/aggregations/{$id}/execute", $body);
    }

    public function test_requires_authentication(): void
    {
        $this->getJson('/api/v1/analytics/data-sources')->assertUnauthorized();
    }

    public function test_data_sources_are_listed_with_schema(): void
    {
        Sanctum::actingAs($this->tenant('Alpha'));

        $this->getJson('/api/v1/analytics/data-sources')
            ->assertOk()
            ->assertJsonPath('data.total', 4)
            ->assertJsonPath('data.data_sources.0.id', 'transactions')
            ->assertJsonPath('data.data_sources.0.schema.fields.0.name', 'id');

        $this->getJson('/api/v1/analytics/data-sources/transactions/schema')->assertOk()->assertJsonStructure(['data' => ['fields']]);
        $this->getJson('/api/v1/analytics/data-sources/users')->assertNotFound();
    }

    public function test_money_is_grouped_by_currency_and_unusable_entries_are_excluded(): void
    {
        $user = $this->tenant('Alpha');
        $other = $this->tenant('Bravo');
        $usd = $this->account($user, 'USD');
        $eur = $this->account($user, 'EUR');

        $this->tx($user, $usd, 'income', '100.00');
        $this->tx($user, $usd, 'expense', '30.00');
        $this->tx($user, $eur, 'income', '50.00');
        $this->tx($user, $usd, 'income', '999.00', null, 'reversed');
        $this->tx($other, $this->account($other, 'USD'), 'income', '777.00');

        Sanctum::actingAs($user);
        $id = $this->postJson('/api/v1/analytics/aggregations', $this->aggregation())->assertCreated()->json('data.id');

        $points = collect($this->execute($id)->assertOk()->json('data.data'))
            ->mapWithKeys(fn ($p) => [$p['dimensions']['currency'] . ':' . $p['dimensions']['type'] => $p['value_exact']]);

        $this->assertEquals(['USD:income' => '100.00', 'USD:expense' => '30.00', 'EUR:income' => '50.00'], $points->all());
    }

    public function test_count_by_dimension(): void
    {
        $user = $this->tenant('Alpha');
        $usd = $this->account($user);
        $this->tx($user, $usd, 'income', '10.00');
        $this->tx($user, $usd, 'income', '20.00');
        $this->tx($user, $usd, 'expense', '5.00');

        Sanctum::actingAs($user);
        $id = $this->postJson('/api/v1/analytics/aggregations', $this->aggregation(['aggregation_type' => 'count']))->json('data.id');

        $points = collect($this->execute($id)->json('data.data'))->mapWithKeys(fn ($p) => [$p['dimensions']['type'] => $p['value']]);
        $this->assertEquals(['income' => 2, 'expense' => 1], $points->all());
    }

    public function test_relative_time_range_excludes_old_records(): void
    {
        $user = $this->tenant('Alpha');
        $usd = $this->account($user);
        $this->tx($user, $usd, 'income', '40.00');
        $this->tx($user, $usd, 'income', '1000.00', now()->subDays(60)->toDateString());

        Sanctum::actingAs($user);
        $id = $this->postJson('/api/v1/analytics/aggregations', $this->aggregation(['dimensions' => []]))->json('data.id');

        $response = $this->execute($id, ['timeRange' => ['type' => 'relative', 'relative' => ['amount' => 30, 'unit' => 'days']]])->assertOk();
        $this->assertSame('40.00', $response->json('data.data.0.value_exact'));

        $this->getJson("/api/v1/analytics/aggregations/{$id}/results?type=relative&amount=30&unit=days")
            ->assertOk()
            ->assertJsonPath('data.data.0.value_exact', '40.00');
    }

    public function test_time_granularity_buckets_points(): void
    {
        $user = $this->tenant('Alpha');
        $usd = $this->account($user);
        $this->tx($user, $usd, 'income', '10.00', now()->subDays(2)->toDateString());
        $this->tx($user, $usd, 'income', '20.00', now()->subDay()->toDateString());

        Sanctum::actingAs($user);
        $id = $this->postJson('/api/v1/analytics/aggregations', $this->aggregation(['dimensions' => [], 'time_granularity' => 'day']))->json('data.id');

        $data = $this->execute($id)->assertOk()->json('data.data');
        $this->assertCount(2, $data);
        $this->assertArrayHasKey('timestamp', $data[0]);
    }

    public function test_invalid_specifications_are_rejected(): void
    {
        Sanctum::actingAs($this->tenant('Alpha'));
        $url = '/api/v1/analytics/aggregations';

        $this->postJson($url, $this->aggregation(['data_source' => 'users']))->assertStatus(422)->assertJsonValidationErrors('data_source');
        $this->postJson($url, $this->aggregation(['metric' => 'type']))->assertStatus(422)->assertJsonValidationErrors('metric');
        $this->postJson($url, $this->aggregation(['data_source' => 'security_events', 'metric' => 'severity']))->assertStatus(422)->assertJsonValidationErrors('metric');
        $this->postJson($url, $this->aggregation(['dimensions' => ['type; DROP TABLE transactions']]))->assertStatus(422)->assertJsonValidationErrors('dimensions');
        $this->postJson($url, $this->aggregation(['dimensions' => ['type', 'account_id', 'category_id', 'currency']]))->assertStatus(422)->assertJsonValidationErrors('dimensions');
        $this->postJson($url, $this->aggregation(['time_granularity' => 'decade']))->assertStatus(422)->assertJsonValidationErrors('time_granularity');
    }

    public function test_filters_are_whitelisted_and_typed(): void
    {
        Sanctum::actingAs($this->tenant('Alpha'));
        $url = '/api/v1/analytics/aggregations';

        $bad = [
            [['field' => 'password', 'operator' => 'eq', 'value' => 'x']],
            [['field' => 'type', 'operator' => 'like', 'value' => 'x']],
            [['field' => 'account_id', 'operator' => 'eq', 'value' => 'not-a-uuid']],
            [['field' => 'amount', 'operator' => 'gt', 'value' => 'abc']],
            [['field' => 'type', 'operator' => 'contains', 'value' => 'inc']],
        ];
        foreach ($bad as $filters) {
            $this->postJson($url, $this->aggregation(['filters' => $filters]))->assertStatus(422)->assertJsonValidationErrors('filters');
        }

        $this->postJson($url, $this->aggregation(['filters' => [['field' => 'type', 'operator' => 'in', 'value' => ['income']]]]))->assertCreated();
        $this->postJson($url, $this->aggregation(['filters' => ['type' => 'income']]))->assertCreated();
    }

    public function test_invalid_time_range_is_rejected(): void
    {
        $user = $this->tenant('Alpha');
        Sanctum::actingAs($user);
        $id = $this->postJson('/api/v1/analytics/aggregations', $this->aggregation())->json('data.id');

        $this->execute($id, ['timeRange' => ['type' => 'relative', 'relative' => ['amount' => 0, 'unit' => 'days']]])->assertStatus(422);
        $this->execute($id, ['timeRange' => ['type' => 'absolute', 'absolute' => ['start' => '', 'end' => '2026-01-01']]])->assertStatus(422);
    }

    public function test_aggregations_are_isolated_between_organizations(): void
    {
        $userA = $this->tenant('Alpha');
        $userB = $this->tenant('Bravo');

        Sanctum::actingAs($userA);
        $id = $this->postJson('/api/v1/analytics/aggregations', $this->aggregation())->json('data.id');

        Sanctum::actingAs($userB);
        $this->getJson('/api/v1/analytics/aggregations')->assertOk()->assertJsonPath('data.total', 0);
        $this->getJson("/api/v1/analytics/aggregations/{$id}")->assertNotFound();
        $this->execute($id)->assertNotFound();
        $this->deleteJson("/api/v1/analytics/aggregations/{$id}")->assertNotFound();
    }

    public function test_aggregation_update_is_revalidated(): void
    {
        Sanctum::actingAs($this->tenant('Alpha'));
        $id = $this->postJson('/api/v1/analytics/aggregations', $this->aggregation())->json('data.id');

        $this->putJson("/api/v1/analytics/aggregations/{$id}", ['metric' => 'type'])->assertStatus(422)->assertJsonValidationErrors('metric');
        $this->putJson("/api/v1/analytics/aggregations/{$id}", ['name' => 'Renamed'])->assertOk()->assertJsonPath('data.name', 'Renamed');
    }

    public function test_first_dashboard_becomes_default_and_default_stays_unique(): void
    {
        $user = $this->tenant('Alpha');
        Sanctum::actingAs($user);

        $first = $this->postJson('/api/v1/analytics/dashboards', ['name' => 'One'])->assertCreated()->json('data.id');
        $second = $this->postJson('/api/v1/analytics/dashboards', ['name' => 'Two', 'is_default' => true])->assertCreated()->json('data.id');

        $this->assertDatabaseHas('analytics_dashboards', ['id' => $first, 'is_default' => false]);
        $this->assertDatabaseHas('analytics_dashboards', ['id' => $second, 'is_default' => true]);

        $this->postJson("/api/v1/analytics/dashboards/{$first}/set-default")->assertOk()->assertJsonPath('data.is_default', true);
        $this->assertSame(1, DB::table('analytics_dashboards')->where('organization_id', $user->organization_id)->where('is_default', true)->count());

        $this->getJson('/api/v1/analytics/dashboards')->assertOk()->assertJsonPath('data.total', 2);
    }

    public function test_dashboard_widgets_must_be_runnable(): void
    {
        Sanctum::actingAs($this->tenant('Alpha'));
        $url = '/api/v1/analytics/dashboards';

        $this->postJson($url, ['name' => 'Ok', 'widgets' => [$this->widget()]])->assertCreated();

        $this->postJson($url, ['name' => 'Bad', 'widgets' => [$this->widget(['data_source' => 'users'])]])
            ->assertStatus(422)->assertJsonValidationErrors('widgets.0.config.data_source');
        $this->postJson($url, ['name' => 'Bad', 'widgets' => [$this->widget(['metric' => 'type'])]])
            ->assertStatus(422)->assertJsonValidationErrors('widgets.0.config');
    }

    public function test_dashboards_are_isolated_between_organizations(): void
    {
        $userA = $this->tenant('Alpha');
        $userB = $this->tenant('Bravo');

        Sanctum::actingAs($userA);
        $id = $this->postJson('/api/v1/analytics/dashboards', ['name' => 'Private'])->json('data.id');

        Sanctum::actingAs($userB);
        $this->getJson("/api/v1/analytics/dashboards/{$id}")->assertNotFound();
        $this->putJson("/api/v1/analytics/dashboards/{$id}", ['name' => 'Hacked'])->assertNotFound();
        $this->postJson("/api/v1/analytics/dashboards/{$id}/set-default")->assertNotFound();
        $this->deleteJson("/api/v1/analytics/dashboards/{$id}")->assertNotFound();
        $this->getJson('/api/v1/analytics/dashboards')->assertOk()->assertJsonPath('data.total', 0);
    }

    public function test_stats_count_real_records(): void
    {
        Sanctum::actingAs($this->tenant('Alpha'));

        $this->postJson('/api/v1/analytics/dashboards', ['name' => 'D', 'widgets' => [$this->widget()]])->assertCreated();
        $this->postJson('/api/v1/analytics/aggregations', $this->aggregation())->assertCreated();

        $this->getJson('/api/v1/analytics/stats')
            ->assertOk()
            ->assertJsonPath('data.total_dashboards', 1)
            ->assertJsonPath('data.active_dashboards', 1)
            ->assertJsonPath('data.total_aggregations', 1)
            ->assertJsonPath('data.total_reports', 0)
            ->assertJsonPath('data.scheduled_reports', 0)
            ->assertJsonPath('data.data_sources_count', 4);
    }
}
