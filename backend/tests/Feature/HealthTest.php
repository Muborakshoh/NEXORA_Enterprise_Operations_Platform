<?php

namespace Tests\Feature;

use Tests\TestCase;

class HealthTest extends TestCase
{
    public function test_application_up_health_check_returns_200(): void
    {
        $response = $this->get('/up');
        $response->assertStatus(200);
    }
}
