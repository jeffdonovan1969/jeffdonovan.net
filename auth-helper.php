<?php
/**
 * API Authentication Helper
 * Include this at the top of each API file to protect them
 */

session_start();

/**
 * Check if user is authenticated
 */
function checkAuth() {
    if (!isset($_SESSION['admin_logged_in']) || $_SESSION['admin_logged_in'] !== true) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Unauthorized. Please login to access the API.']);
        exit;
    }
}

/**
 * Optional: Check for API key in header (alternative to session)
 */
function checkApiKey() {
    $apiKey = $_SERVER['HTTP_X_API_KEY'] ?? '';
    $validApiKey = 'your_api_key_here'; // Change this!
    
    if ($apiKey !== $validApiKey) {
        http_response_code(401);
        header('Content-Type: application/json');
        echo json_encode(['error' => 'Invalid API key']);
        exit;
    }
}

// To use session-based auth, add this to the top of your API files:
// require_once 'auth-helper.php';
// checkAuth();

// To use API key auth, add this instead:
// require_once 'auth-helper.php';
// checkApiKey();
