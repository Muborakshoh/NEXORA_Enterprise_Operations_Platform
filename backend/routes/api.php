<?php

use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\CustomerController;
use App\Http\Controllers\Api\V1\ProductController;
use App\Http\Controllers\Api\V1\SecurityEventController;
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
});
