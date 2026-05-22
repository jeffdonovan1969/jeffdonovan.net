<?php
/**
 * Minimal API Test
 * This will show if config.php is being loaded correctly
 */

// Show all errors
error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "Testing API setup...\n\n";

// Test 1: Can we include config?
echo "1. Testing config.php include... ";
if (file_exists('config.php')) {
    echo "✓ File exists\n";
    try {
        require_once 'config.php';
        echo "2. Config loaded successfully ✓\n";
    } catch (Exception $e) {
        echo "✗ Error loading config: " . $e->getMessage() . "\n";
        exit;
    }
} else {
    echo "✗ config.php NOT FOUND!\n";
    echo "Current directory: " . getcwd() . "\n";
    echo "Files in directory:\n";
    print_r(scandir('.'));
    exit;
}

// Test 2: Can we connect to database?
echo "3. Testing database connection... ";
try {
    $pdo = getDBConnection();
    echo "✓ Connected\n";
} catch (Exception $e) {
    echo "✗ Failed: " . $e->getMessage() . "\n";
    echo "\nPlease update these in config.php:\n";
    echo "- DB_USER (currently looking for: " . DB_USER . ")\n";
    echo "- DB_PASS (currently set)\n";
    echo "- DB_NAME (currently: " . DB_NAME . ")\n";
    exit;
}

// Test 3: Can we query the database?
echo "4. Testing gallery query... ";
try {
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM gallery WHERE active_flag = 1");
    $result = $stmt->fetch();
    echo "✓ Found " . $result['count'] . " galleries\n";
} catch (Exception $e) {
    echo "✗ Query failed: " . $e->getMessage() . "\n";
    exit;
}

// Test 4: Can we return JSON?
echo "5. Testing JSON output... ";
header('Content-Type: application/json');
echo json_encode([
    'success' => true,
    'message' => 'All tests passed!',
    'galleries_count' => $result['count']
]);
?>
