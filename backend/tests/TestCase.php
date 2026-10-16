<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Testing\TestCase as BaseTestCase;
use RuntimeException;

abstract class TestCase extends BaseTestCase
{
    /** Boots the app and refuses to run against anything but the dedicated test database. */
    public function createApplication(): Application
    {
        $app = require __DIR__ . '/../bootstrap/app.php';
        $app->make(Kernel::class)->bootstrap();

        if (config('database.connections.pgsql.database') !== 'nexora_test') {
            throw new RuntimeException('Refusing to run tests: the database must be nexora_test.');
        }

        return $app;
    }
}
