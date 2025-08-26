<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class Cors
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @return \Illuminate\Http\Response|\Illuminate\Http\JsonResponse
     */
    public function handle(Request $request, Closure $next)
    {
        // Define allowed origins (update for production)
        $allowedOrigins = [
            'http://localhost:3000', // Your frontend URL
            // Add production URL, e.g., 'https://your-frontend.com'
        ];

        // Get the request origin
        $origin = $request->headers->get('Origin');

        // Apply CORS headers if the origin is allowed
        if (in_array($origin, $allowedOrigins)) {
            $headers = [
                'Access-Control-Allow-Origin' => $origin,
                'Access-Control-Allow-Methods' => 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
                'Access-Control-Allow-Headers' => 'Content-Type, Authorization, X-Requested-With, Accept',
                'Access-Control-Allow-Credentials' => 'true',
                'Access-Control-Max-Age' => '86400', // Cache preflight for 24 hours
            ];

            // Handle preflight (OPTIONS) requests
            if ($request->isMethod('OPTIONS')) {
                return response()->json([], 200)->withHeaders($headers);
            }

            // Add CORS headers to the response
            $response = $next($request);
            foreach ($headers as $key => $value) {
                $response->headers->set($key, $value);
            }

            return $response;
        }

        // Proceed without CORS headers for non-allowed origins
        return $next($request);
    }
}
