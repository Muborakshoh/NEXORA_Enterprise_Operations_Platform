<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SecurityEventController;
use App\Http\Controllers\Api\V1\AuditLogController;
use App\Http\Controllers\Api\V1\SecurityRuleController;
use App\Http\Controllers\Api\V1\SecurityStatsController;
use App\Http\Controllers\Api\V1\SessionController;
use App\Http\Controllers\Api\V1\SuspiciousActivityController;
use App\Http\Controllers\Api\V1\ServerController;
use App\Http\Controllers\Api\V1\TransactionController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes
Route::prefix('v1')->group(function () {
    // Authentication
    Route::post('/auth/register', [AuthController::class, 'register']);
    Route::post('/auth/login', [AuthController::class, 'login']);
});

// Protected routes
Route::prefix('v1')->middleware('auth:sanctum')->group(function () {
    // Authentication
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // CRM
    Route::apiResource('customers', CustomerController::class);

    // Finance
    Route::apiResource('transactions', TransactionController::class);

    // Inventory
    Route::apiResource('products', ProductController::class);

    // Infrastructure
    Route::apiResource('servers', ServerController::class);

    // Security
    Route::get('security/events', [SecurityEventController::class, 'index']);
    Route::get('security/events/{id}', [SecurityEventController::class, 'show']);
    Route::post('security/events/{id}/acknowledge', [SecurityEventController::class, 'acknowledge']);
    Route::post('security/events/{id}/resolve', [SecurityEventController::class, 'resolve']);
    Route::post('security/events/{id}/false-positive', [SecurityEventController::class, 'markFalsePositive']);

    // Security: audit log
    Route::get('security/audit', [AuditLogController::class, 'index']);
    Route::get('security/audit/export', [AuditLogController::class, 'export']);
    Route::get('security/audit/{id}', [AuditLogController::class, 'show']);

    // Security: sessions
    Route::get('security/sessions', [SessionController::class, 'index']);
    Route::get('security/sessions/current', [SessionController::class, 'current']);
    Route::post('security/sessions/revoke-others', [SessionController::class, 'revokeOthers']);
    Route::get('security/sessions/{id}', [SessionController::class, 'show']);
    Route::post('security/sessions/{id}/revoke', [SessionController::class, 'revoke']);

    // Security: suspicious activity
    Route::get('security/suspicious', [SuspiciousActivityController::class, 'index']);
    Route::get('security/suspicious/{id}', [SuspiciousActivityController::class, 'show']);
    Route::post('security/suspicious/{id}/investigate', [SuspiciousActivityController::class, 'investigate']);
    Route::post('security/suspicious/{id}/confirm', [SuspiciousActivityController::class, 'confirm']);
    Route::post('security/suspicious/{id}/false-positive', [SuspiciousActivityController::class, 'markFalsePositive']);
    Route::post('security/suspicious/{id}/resolve', [SuspiciousActivityController::class, 'resolve']);

    // Security: statistics and rules
    Route::get('security/stats', [SecurityStatsController::class, 'show']);
    Route::get('security/rules', [SecurityRuleController::class, 'index']);
    Route::post('security/rules', [SecurityRuleController::class, 'store']);
    Route::get('security/rules/{id}', [SecurityRuleController::class, 'show']);
    Route::put('security/rules/{id}', [SecurityRuleController::class, 'update']);
    Route::delete('security/rules/{id}', [SecurityRuleController::class, 'destroy']);
    Route::post('security/rules/{id}/toggle', [SecurityRuleController::class, 'toggle']);
});
