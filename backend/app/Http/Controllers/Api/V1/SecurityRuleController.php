<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Api\V1\Concerns\ParsesFilters;
use App\Http\Controllers\Controller;
use App\Models\SecurityRule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SecurityRuleController extends Controller
{
    use ParsesFilters;

    private function validationRules(bool $partial): array
    {
        $req = $partial ? 'sometimes|required' : 'required';

        return [
            'name' => "{$req}|string|max:255",
            'description' => 'nullable|string',
            'type' => "{$req}|in:detection,prevention,notification",
            'enabled' => 'sometimes|boolean',
            'priority' => 'sometimes|integer|min:0|max:1000',
            'conditions' => "{$req}|array",
            'conditions.*.field' => 'required|string|max:100',
            'conditions.*.operator' => 'required|in:eq,neq,gt,lt,contains,not_contains',
            'conditions.*.value' => 'required',
            'actions' => "{$req}|array",
            'actions.*.type' => 'required|in:alert,block,notify,log',
            'actions.*.config' => 'nullable|array',
        ];
    }

    public function index(Request $request): JsonResponse
    {
        $rules = SecurityRule::where('organization_id', $request->user()->organization_id)
            ->orderByDesc('priority')
            ->orderBy('created_at')
            ->get();

        return $this->ok(['rules' => $rules, 'total' => $rules->count()]);
    }

    public function show(Request $request, string $id): JsonResponse
    {
        return $this->ok($this->orgModel($request, SecurityRule::class, $id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $request->validate($this->validationRules(false));

        $rule = SecurityRule::create($data + ['organization_id' => $request->user()->organization_id]);

        return $this->ok($rule->refresh(), 201);
    }

    public function update(Request $request, string $id): JsonResponse
    {
        $rule = $this->orgModel($request, SecurityRule::class, $id);
        $rule->update($request->validate($this->validationRules(true)));

        return $this->ok($rule->refresh());
    }

    public function destroy(Request $request, string $id): JsonResponse
    {
        $this->orgModel($request, SecurityRule::class, $id)->delete();

        return $this->ok(null);
    }

    public function toggle(Request $request, string $id): JsonResponse
    {
        $data = $request->validate(['enabled' => 'required|boolean']);

        $rule = $this->orgModel($request, SecurityRule::class, $id);
        $rule->update(['enabled' => $data['enabled']]);

        return $this->ok($rule->refresh());
    }
}
