<?php

namespace Database\Migrations;

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Accounts
        Schema::create('accounts', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->string('type');
            $table->string('currency')->default('USD');
            $table->decimal('balance', 15, 2)->default(0);
            $table->text('description')->nullable();
            $table->boolean('is_default')->default(false);
            $table->boolean('is_active')->default(true);
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->index(['organization_id', 'type']);
        });

        // Transaction categories
        Schema::create('transaction_categories', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('name');
            $table->string('type'); // income, expense
            $table->string('color')->nullable();
            $table->string('icon')->nullable();
            $table->uuid('parent_id')->nullable();
            $table->timestamps();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('parent_id')->references('id')->on('transaction_categories')->onDelete('cascade');
        });

        // Transactions
        Schema::create('transactions', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('account_id');
            $table->string('type'); // income, expense, transfer, refund, payment
            $table->decimal('amount', 15, 2);
            $table->string('currency')->default('USD');
            $table->string('description');
            $table->uuid('category_id')->nullable();
            $table->string('reference')->nullable();
            $table->date('date');
            $table->string('status')->default('completed');
            $table->json('tags')->nullable();
            $table->json('metadata')->nullable();
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('account_id')->references('id')->on('accounts')->onDelete('cascade');
            $table->foreign('category_id')->references('id')->on('transaction_categories')->onDelete('set null');
            $table->index(['organization_id', 'type']);
            $table->index(['organization_id', 'date']);
            $table->index(['organization_id', 'status']);
        });

        // Invoices
        Schema::create('invoices', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->string('invoice_number')->unique();
            $table->uuid('customer_id');
            $table->string('status')->default('draft');
            $table->json('items');
            $table->decimal('subtotal', 15, 2);
            $table->decimal('tax_amount', 15, 2)->default(0);
            $table->decimal('tax_rate', 5, 2)->default(0);
            $table->decimal('discount_amount', 15, 2)->default(0);
            $table->decimal('discount_rate', 5, 2)->default(0);
            $table->decimal('total', 15, 2);
            $table->string('currency')->default('USD');
            $table->date('issue_date');
            $table->date('due_date');
            $table->date('paid_date')->nullable();
            $table->text('notes')->nullable();
            $table->text('terms')->nullable();
            $table->string('payment_terms')->nullable();
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('cascade');
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'due_date']);
        });

        // Payments
        Schema::create('payments', function (Blueprint $table) {
            $table->uuid('id')->primary();
            $table->uuid('organization_id');
            $table->uuid('invoice_id')->nullable();
            $table->uuid('customer_id')->nullable();
            $table->decimal('amount', 15, 2);
            $table->string('currency')->default('USD');
            $table->string('method');
            $table->string('reference')->nullable();
            $table->string('status')->default('completed');
            $table->timestamp('paid_at');
            $table->text('notes')->nullable();
            $table->json('metadata')->nullable();
            $table->uuid('created_by');
            $table->timestamps();
            $table->softDeletes();

            $table->foreign('organization_id')->references('id')->on('organizations')->onDelete('cascade');
            $table->foreign('invoice_id')->references('id')->on('invoices')->onDelete('set null');
            $table->foreign('customer_id')->references('id')->on('customers')->onDelete('set null');
            $table->index(['organization_id', 'status']);
            $table->index(['organization_id', 'paid_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payments');
        Schema::dropIfExists('invoices');
        Schema::dropIfExists('transactions');
        Schema::dropIfExists('transaction_categories');
        Schema::dropIfExists('accounts');
    }
};
