<?php

return [
    'paths' => ['api/*'], // Apply CORS to all API routes
    'allowed_methods' => ['*'], // Allow all methods (GET, POST, PUT, DELETE, OPTIONS)
    'allowed_origins' => ['http://localhost:3000'], // Frontend URL
    'allowed_origins_patterns' => [],
    'allowed_headers' => ['Content-Type', 'Authorization', 'Accept'],
    'exposed_headers' => [],
    'max_age' => 0,
    'supports_credentials' => true, // Required for withCredentials in axios.js
];
