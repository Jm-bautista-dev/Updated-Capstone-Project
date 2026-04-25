<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Http\Controllers\Api\AuthController;
use Exception;

class MobileAuthController extends Controller
{
    /**
     * Mobile login wrapper.
     * Wraps existing AuthController logic to provide a standardized response format.
     */
    public function login(Request $request)
    {
        try {
            // Instantiate existing controller logic internally
            $authController = app(AuthController::class);
            $response = $authController->login($request);
            
            // Extract data from existing response
            $data = $response->getData(true);

            if ($response->getStatusCode() >= 400) {
                return response()->json([
                    "status" => "error",
                    "message" => $data['message'] ?? "Invalid credentials",
                    "code" => $response->getStatusCode()
                ], $response->getStatusCode());
            }

            return response()->json([
                "status" => "success",
                "message" => "Login successful",
                "data" => $data
            ], 200);

        } catch (Exception $e) {
            return response()->json([
                "status" => "error",
                "message" => "Server connection error. Please try again later.",
                "debug" => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
