<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    /**
     * Display a listing of customers
     */
    public function index(Request $request): JsonResponse
    {
        $query = Customer::where('organization_id', $request->user()->organization_id)
            ->with(['assignedUser', 'createdBy']);

        // Apply filters
        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('company', 'like', "%{$search}%");
            });
        }

        $customers = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $customers,
        ]);
    }

    /**
     * Store a newly created customer
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive,prospect,churned',
            'tags' => 'nullable|array',
            'metadata' => 'nullable|array',
            'assigned_to' => 'nullable|uuid|exists:users,id',
        ]);

        $validated['organization_id'] = $request->user()->organization_id;
        $validated['created_by'] = $request->user()->id;

        $customer = Customer::create($validated);

        return response()->json([
            'success' => true,
            'data' => $customer->load(['assignedUser', 'createdBy']),
        ], 201);
    }

    /**
     * Display the specified customer
     */
    public function show(Request $request, string $id): JsonResponse
    {
        $customer = Customer::where('organization_id', $request->user()->organization_id)
            ->with(['assignedUser', 'createdBy', 'leads', 'deals', 'invoices'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $customer,
        ]);
    }

    /**
     * Update the specified customer
     */
    public function update(Request $request, string $id): JsonResponse
    {
        $customer = Customer::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|max:255',
            'phone' => 'nullable|string|max:50',
            'company' => 'nullable|string|max:255',
            'position' => 'nullable|string|max:255',
            'status' => 'nullable|string|in:active,inactive,prospect,churned',
            'tags' => 'nullable|array',
            'metadata' => 'nullable|array',
            'assigned_to' => 'nullable|uuid|exists:users,id',
        ]);

        $customer->update($validated);

        return response()->json([
            'success' => true,
            'data' => $customer->load(['assignedUser', 'createdBy']),
        ]);
    }

    /**
     * Remove the specified customer
     */
    public function destroy(Request $request, string $id): JsonResponse
    {
        $customer = Customer::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $customer->delete();

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Customer deleted successfully'],
        ]);
    }
}
