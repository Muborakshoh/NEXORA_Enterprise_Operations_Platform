<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Analytics dashboards
        Schema::create('analytics_dashboards', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->json('widgets')->nullable();   // DashboardWidget[]
            $table->json('layout')->nullable();    // DashboardLayout {columns,row_height,margin}
            $table->boolean('is_default')->default(false);
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'is_default']);
        });

        // Analytics reports
        Schema::create('analytics_reports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('type');            // custom, scheduled, on_demand, template
            $table->string('data_source');
            $table->json('query');             // ReportQuery {metrics,dimensions,filters,time_range,...}
            $table->json('schedule')->nullable();    // ReportSchedule {frequency,day_of_week,...}
            $table->json('format')->nullable();      // ReportFormat[] pdf|csv|excel|json
            $table->json('recipients')->nullable();  // string[]
            $table->uuid('created_by')->nullable();
            $table->timestamp('last_generated_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'type']);
        });

        // Report executions (history of runs)
        Schema::create('analytics_report_executions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('report_id');
            $table->string('status')->default('pending'); // pending, running, completed, failed
            $table->timestamp('started_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->text('error')->nullable();
            $table->string('result_url')->nullable();
            $table->string('format'); // pdf, csv, excel, json
            $table->bigInteger('file_size')->nullable();
            $table->timestamps();

            $table->foreign('report_id')->references('id')->on('analytics_reports')->onDelete('cascade');
            $table->index(['report_id', 'status']);
        });

        // Analytics exports
        Schema::create('analytics_exports', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->string('type');                          // data, report, dashboard, custom
            $table->string('format');                        // csv, excel, pdf, json, xml
            $table->string('status')->default('pending');    // pending, processing, completed, failed, expired
            $table->string('data_source');
            $table->json('filters')->nullable();
            $table->json('columns')->nullable();             // string[]
            $table->uuid('created_by')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->string('download_url')->nullable();
            $table->bigInteger('file_size')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'status']);
        });

        // Analytics aggregations
        Schema::create('analytics_aggregations', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->text('description')->nullable();
            $table->string('data_source');
            $table->string('metric');
            $table->string('aggregation_type'); // sum, avg, count, min, max, group_by
            $table->json('dimensions')->nullable(); // string[]
            $table->json('filters')->nullable();
            $table->string('time_granularity')->nullable(); // minute..year
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'aggregation_type']);
        });

        // Analytics data sources (catalog)
        Schema::create('analytics_data_sources', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->string('type'); // database, api, file, custom
            $table->text('description')->nullable();
            $table->json('schema')->nullable(); // DataSourceSchema {fields:[],primary_key}
            $table->uuid('created_by')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('created_by')->references('id')->on('users')->onDelete('set null');
            $table->index(['organization_id', 'type']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('analytics_data_sources');
        Schema::dropIfExists('analytics_aggregations');
        Schema::dropIfExists('analytics_exports');
        Schema::dropIfExists('analytics_report_executions');
        Schema::dropIfExists('analytics_reports');
        Schema::dropIfExists('analytics_dashboards');
    }
};
