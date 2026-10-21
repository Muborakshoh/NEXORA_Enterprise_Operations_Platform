<?php

namespace App\Services\Analytics;

use Illuminate\Validation\ValidationException;

/**
 * Whitelist of the tables and columns analytics is allowed to read.
 *
 * Nothing that reaches SQL (table, column, function) ever comes from the client:
 * the client only picks keys that exist in this registry.
 *
 * Field roles: dimension (group/filter), measure (aggregate), time (time axis), attribute (filter only).
 */
final class DataSourceRegistry
{
    private const SOURCES = [
        'transactions' => [
            'name' => 'Transactions',
            'description' => 'Completed income and expense transactions. Reversed entries are excluded; money is always grouped by currency.',
            'table' => 'transactions',
            'org_column' => 'organization_id',
            'soft_deletes' => true,
            'base_conditions' => ['status' => 'completed'],
            'time_column' => 'date',
            'currency_column' => 'currency',
            'fields' => [
                'id' => ['type' => 'uuid', 'role' => 'attribute'],
                'account_id' => ['type' => 'uuid', 'role' => 'dimension'],
                'category_id' => ['type' => 'uuid', 'role' => 'dimension', 'nullable' => true],
                'type' => ['type' => 'string', 'role' => 'dimension', 'description' => 'Dimension: income or expense'],
                'currency' => ['type' => 'string', 'role' => 'dimension'],
                'amount' => ['type' => 'number', 'role' => 'measure', 'money' => true],
                'description' => ['type' => 'string', 'role' => 'attribute', 'searchable' => true],
                'reference' => ['type' => 'string', 'role' => 'attribute', 'nullable' => true, 'searchable' => true],
                'date' => ['type' => 'date', 'role' => 'time'],
                'created_at' => ['type' => 'datetime', 'role' => 'attribute'],
            ],
        ],
        'security_events' => [
            'name' => 'Security events',
            'description' => 'Security events of the organization.',
            'table' => 'security_events',
            'org_column' => 'organization_id',
            'soft_deletes' => false,
            'base_conditions' => [],
            'time_column' => 'created_at',
            'currency_column' => null,
            'fields' => [
                'id' => ['type' => 'uuid', 'role' => 'attribute'],
                'type' => ['type' => 'string', 'role' => 'dimension'],
                'severity' => ['type' => 'string', 'role' => 'dimension'],
                'source' => ['type' => 'string', 'role' => 'dimension'],
                'status' => ['type' => 'string', 'role' => 'dimension'],
                'acknowledged' => ['type' => 'boolean', 'role' => 'dimension'],
                'user_id' => ['type' => 'uuid', 'role' => 'dimension', 'nullable' => true],
                'ip_address' => ['type' => 'string', 'role' => 'dimension'],
                'title' => ['type' => 'string', 'role' => 'attribute', 'searchable' => true],
                'created_at' => ['type' => 'datetime', 'role' => 'time'],
            ],
        ],
        'audit_logs' => [
            'name' => 'Audit logs',
            'description' => 'Audit trail of sensitive operations.',
            'table' => 'audit_logs',
            'org_column' => 'organization_id',
            'soft_deletes' => false,
            'base_conditions' => [],
            'time_column' => 'created_at',
            'currency_column' => null,
            'fields' => [
                'id' => ['type' => 'uuid', 'role' => 'attribute'],
                'action' => ['type' => 'string', 'role' => 'dimension'],
                'resource_type' => ['type' => 'string', 'role' => 'dimension'],
                'resource_name' => ['type' => 'string', 'role' => 'attribute', 'nullable' => true, 'searchable' => true],
                'user_id' => ['type' => 'uuid', 'role' => 'dimension'],
                'ip_address' => ['type' => 'string', 'role' => 'dimension'],
                'created_at' => ['type' => 'datetime', 'role' => 'time'],
            ],
        ],
        'suspicious_activities' => [
            'name' => 'Suspicious activities',
            'description' => 'Potentially suspicious activity detected by the security module.',
            'table' => 'suspicious_activities',
            'org_column' => 'organization_id',
            'soft_deletes' => false,
            'base_conditions' => [],
            'time_column' => 'created_at',
            'currency_column' => null,
            'fields' => [
                'id' => ['type' => 'uuid', 'role' => 'attribute'],
                'type' => ['type' => 'string', 'role' => 'dimension'],
                'status' => ['type' => 'string', 'role' => 'dimension'],
                'confidence' => ['type' => 'number', 'role' => 'measure', 'description' => 'Measure: detection confidence, 0-100'],
                'user_id' => ['type' => 'uuid', 'role' => 'dimension', 'nullable' => true],
                'ip_address' => ['type' => 'string', 'role' => 'dimension'],
                'title' => ['type' => 'string', 'role' => 'attribute', 'searchable' => true],
                'created_at' => ['type' => 'datetime', 'role' => 'time'],
            ],
        ],
    ];

    /** @return list<string> */
    public function ids(): array
    {
        return array_keys(self::SOURCES);
    }

    public function has(string $id): bool
    {
        return isset(self::SOURCES[$id]);
    }

    public function get(string $id): array
    {
        if (! $this->has($id)) {
            throw ValidationException::withMessages(['data_source' => ['Unknown data source.']]);
        }

        return self::SOURCES[$id];
    }

    /** Public description in the shape the frontend expects (DataSource). */
    public function describe(string $id): array
    {
        $source = $this->get($id);

        $fields = [];
        foreach ($source['fields'] as $name => $field) {
            $fields[] = [
                'name' => $name,
                'type' => $field['type'] === 'uuid' ? 'string' : $field['type'],
                'description' => $field['description']
                    ?? (ucfirst($field['role']) . (! empty($field['money']) ? ' (money)' : '')),
                'nullable' => $field['nullable'] ?? false,
            ];
        }

        return [
            'id' => $id,
            'name' => $source['name'],
            'type' => 'database',
            'description' => $source['description'],
            'schema' => ['fields' => $fields, 'primary_key' => 'id'],
            'created_at' => date('c', (int) filemtime(__FILE__)),
        ];
    }
}
