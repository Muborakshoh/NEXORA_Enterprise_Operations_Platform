<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // AI assistants
        Schema::create('ai_assistants', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('model'); // gpt-4, gpt-3.5-turbo, claude-3, gemini-pro, custom
            $table->json('capabilities')->nullable(); // AICapability[]
            $table->json('config')->nullable(); // temperature, max_tokens, system_prompt, context_window, tools_enabled, allowed_tools, api_key
            $table->string('api_key')->nullable(); // encrypted API key for LLM
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'is_active']);
        });

        // AI conversations
        Schema::create('ai_conversations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('assistant_id');
            $table->uuid('user_id');
            $table->string('title');
            $table->json('context')->nullable();
            $table->timestamps();

            $table->foreign('assistant_id')->references('id')->on('ai_assistants')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            $table->index(['assistant_id', 'user_id']);
        });

        // AI messages
        Schema::create('ai_messages', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('conversation_id');
            $table->string('role'); // user, assistant, system, tool
            $table->text('content');
            $table->json('tool_calls')->nullable();
            $table->json('tool_results')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('created_at');

            $table->foreign('conversation_id')->references('id')->on('ai_conversations')->onDelete('cascade');
            $table->index(['conversation_id', 'created_at']);
        });

        // AI tools
        Schema::create('ai_tools', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description');
            $table->string('category'); // data_analysis, automation, integration, etc.
            $table->json('parameters')->nullable(); // ToolParameter[]
            $table->string('return_type');
            $table->boolean('enabled')->default(true);
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'enabled']);
        });

        // AI tool executions
        Schema::create('ai_tool_executions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('tool_id');
            $table->string('tool_name');
            $table->json('arguments')->nullable();
            $table->json('result')->nullable();
            $table->text('error')->nullable();
            $table->bigInteger('execution_time_ms');
            $table->timestamp('created_at');

            $table->foreign('tool_id')->references('id')->on('ai_tools')->onDelete('cascade');
            $table->index(['tool_id', 'created_at']);
        });

        // AI analytics
        Schema::create('ai_analytics', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type'); // trend, pattern, anomaly, correlation, outlier
            $table->string('data_source');
            $table->json('query')->nullable(); // metrics, dimensions, filters, time_range, parameters
            $table->json('schedule')->nullable(); // frequency, enabled, last_run_at, next_run_at
            $table->uuid('created_by')->nullable();
            $table->timestamp('last_run_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'type']);
        });

        // AI analytics results
        Schema::create('ai_analytics_results', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('analytics_id');
            $table->string('status')->default('pending'); // pending, running, completed, failed
            $table->json('result')->nullable(); // summary, insights, visualizations, recommendations
            $table->text('error')->nullable();
            $table->timestamp('started_at');
            $table->timestamp('completed_at')->nullable();

            $table->foreign('analytics_id')->references('id')->on('ai_analytics')->onDelete('cascade');
            $table->index(['analytics_id', 'status']);
        });

        // AI anomaly detectors
        Schema::create('ai_anomaly_detectors', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('data_source');
            $table->string('metric');
            $table->string('algorithm'); // statistical, ml, isolation_forest, lstm, etc.
            $table->json('config')->nullable(); // sensitivity, window_size, threshold, seasonality, parameters
            $table->boolean('enabled')->default(true);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'enabled']);
        });

        // AI anomalies
        Schema::create('ai_anomalies', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('detector_id');
            $table->timestamp('timestamp');
            $table->decimal('value', 20, 6);
            $table->decimal('expected_value', 20, 6);
            $table->decimal('deviation', 20, 6);
            $table->string('severity'); // low, medium, high, critical
            $table->string('status')->default('detected'); // detected, investigating, confirmed, resolved, false_positive
            $table->json('context')->nullable();
            $table->timestamp('created_at');
            $table->timestamp('resolved_at')->nullable();

            $table->foreign('detector_id')->references('id')->on('ai_anomaly_detectors')->onDelete('cascade');
            $table->index(['detector_id', 'status']);
            $table->index(['detector_id', 'created_at']);
        });

        // AI recommendations
        Schema::create('ai_recommendations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('type'); // cost_optimization, security, performance, operational
            $table->string('category'); // infrastructure, security, finance, etc.
            $table->string('title');
            $table->text('description');
            $table->string('impact'); // low, medium, high, critical
            $table->decimal('confidence', 5, 4)->default(0);
            $table->string('source');
            $table->string('action_url')->nullable();
            $table->json('metadata')->nullable();
            $table->string('status')->default('new'); // new, accepted, rejected, implemented
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'impact']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ai_recommendations');
        Schema::dropIfExists('ai_anomalies');
        Schema::dropIfExists('ai_anomaly_detectors');
        Schema::dropIfExists('ai_analytics_results');
        Schema::dropIfExists('ai_analytics');
        Schema::dropIfExists('ai_tool_executions');
        Schema::dropIfExists('ai_tools');
        Schema::dropIfExists('ai_messages');
        Schema::dropIfExists('ai_conversations');
        Schema::dropIfExists('ai_assistants');
    }
};
