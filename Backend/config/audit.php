<?php

return [
    'enabled' => env('AUDITING_ENABLED', true),

    'implementation' => OwenIt\Auditing\Models\Audit::class,

    'user' => [
        'morph_prefix' => 'user',
        'guards' => [
            'web',
            'api',
            'sanctum',
        ],
        'model' => App\Models\User::class, // Tambahkan model pengguna
        'resolver' => OwenIt\Auditing\Resolvers\UserResolver::class, // Tambahkan resolver
        'strict' => false, // Izinkan auditing tanpa pengguna
    ],

    'pruning' => [
        'enabled' => false,
        'threshold' => 30,
        'chunk' => 1000,
    ],

    'console' => false,
];
