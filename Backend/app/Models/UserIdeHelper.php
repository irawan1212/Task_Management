<?php

namespace App\Models;

use Laravel\Sanctum\NewAccessToken;

/**
 * IDE Helper for User model to satisfy static analysis tools like Intelephense.
 *
 * @method NewAccessToken createToken(string $name, array $abilities = ['*'])
 */
class UserIdeHelper {}
