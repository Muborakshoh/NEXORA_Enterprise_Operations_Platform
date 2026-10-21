<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Services\Analytics\DataSourceRegistry;
use Illuminate\Http\JsonResponse;

class DataSourceController extends Controller
{
    use ParsesFilters;

    public function __construct(private readonly DataSourceRegistry $registry)
    {
    }

    public function index(): JsonResponse
    {
        $sources = array_map(fn (string $id) => $this->registry->describe($id), $this->registry->ids());

        return $this->ok(['data_sources' => array_values($sources), 'total' => count($sources)]);
    }

    public function show(string $id): JsonResponse
    {
        abort_unless($this->registry->has($id), 404);

        return $this->ok($this->registry->describe($id));
    }

    public function schema(string $id): JsonResponse
    {
        abort_unless($this->registry->has($id), 404);

        return $this->ok($this->registry->describe($id)['schema']);
    }
}
