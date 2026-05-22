<?php
/**
 * Database Configuration
 * Update these values with your actual database credentials
 */

define('DB_HOST', 'localhost');
define('DB_NAME', 'jeffdon1_WPNSV');
define('DB_USER', 'jeffdon1_WPNSV');
define('DB_PASS', '712Walnutree');
define('DB_CHARSET', 'utf8mb4');

// Error reporting (set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Timezone
date_default_timezone_set('America/New_York');

// Base URL (update this to match your domain)
define('BASE_URL', 'http://www.jeffdonovan.net');

/**
 * Get database connection
 */
function getDBConnection() {
    try {
        $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=" . DB_CHARSET;
        $options = [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
        ];
        
        $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
        return $pdo;
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['error' => 'Database connection failed: ' . $e->getMessage()]);
        exit;
    }
}

/**
 * Send JSON response
 */
function sendJSON($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit;
}

/**
 * Get request method
 */
function getRequestMethod() {
    return $_SERVER['REQUEST_METHOD'];
}

/**
 * Get JSON input from request body
 */
function getJSONInput() {
    $input = file_get_contents('php://input');
    return json_decode($input, true);
}

/**
 * Sanitize output for HTML
 */
function escape($string) {
    return htmlspecialchars($string, ENT_QUOTES, 'UTF-8');
}
