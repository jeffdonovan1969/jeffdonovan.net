<?php
/**
 * API Test File
 * Visit this file in your browser to test if PHP and database are working
 */

error_reporting(E_ALL);
ini_set('display_errors', 1);

echo "<h1>API Test Results</h1>";

// Test 1: PHP is working
echo "<h2>✓ PHP is working</h2>";
echo "<p>PHP Version: " . phpversion() . "</p>";

// Test 2: Can we include config?
echo "<h2>Testing config.php...</h2>";
if (file_exists('config.php')) {
    echo "<p>✓ config.php file exists</p>";
    require_once 'config.php';
    echo "<p>✓ config.php loaded successfully</p>";
} else {
    echo "<p>✗ config.php not found!</p>";
    exit;
}

// Test 3: Database connection
echo "<h2>Testing database connection...</h2>";
try {
    $pdo = getDBConnection();
    echo "<p>✓ Database connected successfully</p>";
    
    // Test 4: Query galleries
    echo "<h2>Testing gallery query...</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM gallery WHERE active_flag = 1");
    $result = $stmt->fetch();
    echo "<p>✓ Found " . $result['count'] . " active galleries</p>";
    
    // Test 5: Query images
    echo "<h2>Testing image query...</h2>";
    $stmt = $pdo->query("SELECT COUNT(*) as count FROM image WHERE active_flag = 1");
    $result = $stmt->fetch();
    echo "<p>✓ Found " . $result['count'] . " active images</p>";
    
    // Test 6: Sample gallery data
    echo "<h2>Sample Gallery Data:</h2>";
    $stmt = $pdo->query("SELECT gallery_id, label, order_id FROM gallery WHERE active_flag = 1 ORDER BY order_id LIMIT 5");
    $galleries = $stmt->fetchAll();
    echo "<pre>";
    print_r($galleries);
    echo "</pre>";
    
    echo "<h2>✓ All tests passed!</h2>";
    echo "<p>Your database is working correctly. Now test the API endpoints:</p>";
    echo "<ul>";
    echo "<li><a href='api-portfolios.php'>Test api-portfolios.php</a></li>";
    echo "<li><a href='api-images.php?limit=5'>Test api-images.php</a></li>";
    echo "</ul>";
    
} catch (Exception $e) {
    echo "<p>✗ Database error: " . htmlspecialchars($e->getMessage()) . "</p>";
    echo "<h3>Common fixes:</h3>";
    echo "<ul>";
    echo "<li>Check database credentials in config.php</li>";
    echo "<li>Verify database exists</li>";
    echo "<li>Check that tables exist (gallery, image, sequence_element)</li>";
    echo "<li>Verify database user has proper permissions</li>";
    echo "</ul>";
}
?>

<style>
body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    max-width: 800px;
    margin: 50px auto;
    padding: 20px;
    background: #f5f5f5;
}
h1 { color: #2563eb; }
h2 { color: #334155; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
p { background: white; padding: 10px; border-left: 4px solid #10b981; }
.error { border-left-color: #ef4444; }
pre { background: white; padding: 15px; overflow-x: auto; border: 1px solid #e2e8f0; }
ul { background: white; padding: 20px; }
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
</style>
