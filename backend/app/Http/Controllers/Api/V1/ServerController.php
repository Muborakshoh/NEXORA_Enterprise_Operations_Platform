<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Server;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ServerController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Server::where('organization_id', $request->user()->organization_id)
            ->withCount(['services', 'dockerContainers']);

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('provider')) {
            $query->where('provider', $request->provider);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('hostname', 'like', "%{$search}%")
                    ->orWhere('ip_address', 'like', "%{$search}%");
            });
        }

        $servers = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        $summary = [
            'total' => Server::where('organization_id', $request->user()->organization_id)->count(),
            'online' => Server::where('organization_id', $request->user()->organization_id)->where('status', 'online')->count(),
            'offline' => Server::where('organization_id', $request->user()->organization_id)->where('status', 'offline')->count(),
            'warning' => Server::where('organization_id', $request->user()->organization_id)->where('status', 'warning')->count(),
            'maintenance' => Server::where('organization_id', $request->user()->organization_id)->where('status', 'maintenance')->count(),
        ];

        return response()->json([
            'success' => true,
            'data' => $servers,
            'meta' => [
                'summary' => $summary,
            ],
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'hostname' => 'required|string|max:255',
            'ip_address' => 'required|ip',
            'os' => 'required|string|max:100',
            'os_version' => 'required|string|max:100',
            'provider' => 'required|string|in:aws,gcp,azure,digitalocean,hetzner,on_premise,other',
            'region' => 'nullable|string|max:100',
            'specs' => 'required|array',
            'specs.cpu_cores' => 'required|integer|min:1',
            'specs.ram_gb' => 'required|numeric|min:0.5',
            'specs.disk_gb' => 'required|numeric|min:1',
            'tags' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $validated['organization_id'] = $request->user()->organization_id;

        $server = Server::create($validated);

        return response()->json([
            'success' => true,
            'data' => $server,
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $server = Server::where('organization_id', $request->user()->organization_id)
            ->with(['services', 'dockerContainers'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $server,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $server = Server::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'hostname' => 'sometimes|string|max:255',
            'ip_address' => 'sometimes|ip',
            'status' => 'sometimes|string|in:online,offline,warning,maintenance',
            'tags' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $server->update($validated);

        return response()->json([
            'success' => true,
            'data' => $server,
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $server = Server::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $server->delete();

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Server deleted successfully'],
        ]);
    }
}
