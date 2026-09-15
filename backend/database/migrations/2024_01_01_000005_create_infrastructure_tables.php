<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Servers
        Schema::create('servers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->string('hostname');
            $table->string('ip_address');
            $table->string('os');
            $table->string('os_version');
            $table->string('status')->default('online'); // online, offline, warning, maintenance
            $table->string('provider'); // aws, gcp, azure, digitalocean, hetzner, on_premise, other
            $table->string('region')->nullable();
            $table->json('specs'); // cpu_cores, ram_gb, disk_gb, cpu_model
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'provider']);
        });

        // Services
        Schema::create('services', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('server_id');
            $table->string('name');
            $table->string('type'); // web, database, cache, queue, storage, monitoring, custom
            $table->string('status')->default('running'); // running, stopped, error, unknown
            $table->integer('port')->nullable();
            $table->string('version')->nullable();
            $table->text('description')->nullable();
            $table->string('health_check_url')->nullable();
            $table->timestamp('last_checked_at')->nullable();
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'type']);
        });

        // Docker containers
        Schema::create('docker_containers', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('server_id');
            $table->string('container_id');
            $table->string('name');
            $table->string('image');
            $table->string('status'); // created, running, paused, restarting, removing, exited, dead
            $table->string('state'); // running, stopped, paused
            $table->json('ports'); // [{private_port, public_port, type}]
            $table->timestamp('started_at')->nullable();
            $table->timestamp('finished_at')->nullable();
            $table->decimal('cpu_usage', 5, 2)->nullable();
            $table->decimal('memory_usage', 15, 2)->nullable();
            $table->decimal('memory_limit', 15, 2)->nullable();
            $table->decimal('network_rx', 15, 2)->nullable();
            $table->decimal('network_tx', 15, 2)->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('server_id')->references('id')->on('servers')->onDelete('cascade');
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'state']);
        });

        // Infrastructure alerts
        Schema::create('infrastructure_alerts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('type'); // cpu_high, ram_high, disk_high, service_down, container_stopped, network_error, health_check_failed, custom
            $table->string('severity'); // critical, warning, info
            $table->string('title');
            $table->text('description');
            $table->string('resource_type'); // server, service, container
            $table->uuid('resource_id');
            $table->string('resource_name')->nullable();
            $table->string('metric_name')->nullable();
            $table->decimal('metric_value', 15, 2)->nullable();
            $table->decimal('threshold', 15, 2)->nullable();
            $table->string('status')->default('active'); // active, acknowledged, resolved
            $table->boolean('acknowledged')->default(false);
            $table->uuid('acknowledged_by')->nullable();
            $table->timestamp('acknowledged_at')->nullable();
            $table->timestamp('resolved_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'severity']);
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'created_at']);
        });

        // Alert rules
        Schema::create('alert_rules', function (Blueprint $table) {
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
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('alert_rules');
        Schema::dropIfExists('infrastructure_alerts');
        Schema::dropIfExists('docker_containers');
        Schema::dropIfExists('services');
        Schema::dropIfExists('servers');
    }
};
