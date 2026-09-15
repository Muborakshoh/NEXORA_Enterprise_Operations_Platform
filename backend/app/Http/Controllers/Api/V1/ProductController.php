<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Product;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ProductController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = Product::where('organization_id', $request->user()->organization_id)
            ->with(['category', 'createdBy']);

        if ($request->has('is_active')) {
            $query->where('is_active', $request->boolean('is_active'));
        }

        if ($request->has('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('sku', 'like', "%{$search}%");
            });
        }

        $products = $query->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        return response()->json([
            'success' => true,
            'data' => $products,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'sku' => 'required|string|max:100|unique:products,sku',
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|uuid|exists:product_categories,id',
            'unit' => 'nullable|string|max:50',
            'cost_price' => 'required|numeric|min:0',
            'selling_price' => 'required|numeric|min:0',
            'barcode' => 'nullable|string|max:100',
            'images' => 'nullable|array',
            'metadata' => 'nullable|array',
        ]);

        $validated['organization_id'] = $request->user()->organization_id;
        $validated['created_by'] = $request->user()->id;

        $product = Product::create($validated);

        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'createdBy']),
        ], 201);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        $product = Product::where('organization_id', $request->user()->organization_id)
            ->with(['category', 'createdBy', 'stock'])
            ->findOrFail($id);

        return response()->json([
            'success' => true,
            'data' => $product,
        ]);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $product = Product::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'category_id' => 'nullable|uuid|exists:product_categories,id',
            'unit' => 'nullable|string|max:50',
            'cost_price' => 'sometimes|numeric|min:0',
            'selling_price' => 'sometimes|numeric|min:0',
            'barcode' => 'nullable|string|max:100',
            'images' => 'nullable|array',
            'is_active' => 'sometimes|boolean',
            'metadata' => 'nullable|array',
        ]);

        $product->update($validated);

        return response()->json([
            'success' => true,
            'data' => $product->load(['category', 'createdBy']),
        ]);
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $product = Product::where('organization_id', $request->user()->organization_id)
            ->findOrFail($id);

        $product->delete();

        return response()->json([
            'success' => true,
            'data' => ['message' => 'Product deleted successfully'],
        ]);
    }
}
