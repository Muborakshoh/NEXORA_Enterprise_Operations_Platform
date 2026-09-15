<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Security events
        Schema::create('security_events', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('type'); // login_success, login_failed, logout, password_changed, 2fa_enabled, suspicious_login, brute_force_attempt, unauthorized_access, etc.
            $table->string('severity'); // critical, high, medium, low, info
            $table->string('title');
            $table->text('description');
            $table->string('source'); // authentication, authorization, api, admin, system, user, external
            $table->uuid('user_id')->nullable();
            $table->string('ip_address');
            $table->string('user_agent')->nullable();
            $table->string('resource_type')->nullable();
            $table->uuid('resource_id')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status')->default('active'); // active, acknowledged, resolved, false_positive
            $table->boolean('acknowledged')->default(false);
            $table->uuid('acknowledged_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'severity']);
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'created_at']);
            $table->index(['organization_id', 'type']);
        });

        // Audit logs
        Schema::create('audit_logs', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->string('action'); // create, update, delete, read, login, logout, export, import, approve, reject
            $table->string('resource_type');
            $table->uuid('resource_id')->nullable();
            $table->string('resource_name')->nullable();
            $table->json('old_values')->nullable();
            $table->json('new_values')->nullable();
            $table->string('ip_address');
            $table->string('user_agent')->nullable();
            $table->string('request_id')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['organization_id', 'action']);
            $table->index(['organization_id', 'resource_type']);
            $table->index(['organization_id', 'created_at']);
            $table->index(['organization_id', 'user_id']);
        });

        // User sessions
        Schema::create('user_sessions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('user_id');
            $table->string('ip_address');
            $table->string('user_agent');
            $table->string('device_type'); // desktop, mobile, tablet, unknown
            $table->string('browser');
            $table->string('os');
            $table->json('location')->nullable(); // {city, country, region}
            $table->boolean('is_current')->default(false);
            $table->boolean('is_active')->default(true);
            $table->timestamp('last_active_at');
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['organization_id', 'user_id']);
            $table->index(['organization_id', 'is_active']);
            $table->index(['organization_id', 'last_active_at']);
        });

        // Suspicious activities
        Schema::create('suspicious_activities', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('type'); // brute_force, unusual_location, unusual_time, rapid_requests, failed_logins, privilege_escalation, data_exfiltration, account_takeover
            $table->integer('confidence'); // 0-100
            $table->string('title');
            $table->text('description');
            $table->uuid('user_id')->nullable();
            $table->string('ip_address');
            $table->json('indicators'); // [{type, value, description, severity}]
            $table->string('status')->default('detected'); // detected, investigating, confirmed, resolved, false_positive
            $table->boolean('reviewed')->default(false);
            $table->uuid('reviewed_by')->nullable();
            $table->timestamp('reviewed_at')->nullable();
            $table->text('resolution')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'type']);
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'confidence']);
            $table->index(['organization_id', 'created_at']);
        });

        // Security rules
        Schema::create('security_rules', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type'); // detection, prevention, notification
            $table->json('conditions'); // [{field, operator, value}]
            $table->json('actions'); // [{type, config}]
            $table->integer('priority')->default(0);
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'enabled']);
            $table->index(['organization_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('security_rules');
        Schema::dropIfExists('suspicious_activities');
        Schema::dropIfExists('user_sessions');
        Schema::dropIfExists('audit_logs');
        Schema::dropIfExists('security_events');
    }
};
