<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Sanitize all API error responses — never expose SQL queries, DB details, or stack traces
        $exceptions->renderable(function (\Throwable $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                $status = 500;
                $message = 'An unexpected error occurred. Please try again later.';

                if ($e instanceof \Illuminate\Validation\ValidationException) {
                    return null; // Let Laravel handle validation errors normally (they're safe)
                }

                if ($e instanceof \Illuminate\Auth\AuthenticationException) {
                    $status = 401;
                    $message = 'Unauthenticated. Please log in again.';
                }

                if ($e instanceof \Illuminate\Auth\Access\AuthorizationException) {
                    $status = 403;
                    $message = 'You do not have permission to perform this action.';
                }

                if ($e instanceof \Symfony\Component\HttpKernel\Exception\NotFoundHttpException ||
                    $e instanceof \Illuminate\Database\Eloquent\ModelNotFoundException) {
                    $status = 404;
                    $message = 'The requested resource was not found.';
                }

                if ($e instanceof \Symfony\Component\HttpKernel\Exception\MethodNotAllowedHttpException) {
                    $status = 405;
                    $message = 'This request method is not allowed.';
                }

                if ($e instanceof \Illuminate\Database\QueryException) {
                    $status = 503;
                    $message = 'A database error occurred. Please ensure the database server is running.';
                    \Illuminate\Support\Facades\Log::error('Database error: ' . $e->getMessage());
                }

                if ($e instanceof \Symfony\Component\HttpKernel\Exception\HttpException) {
                    $status = $e->getStatusCode();
                }

                return response()->json([
                    'message' => $message,
                ], $status);
            }
        });
    })->create();
