<?php
/**
 * Portfolio API
 * Handles CRUD operations for galleries (portfolios)
 */

require_once 'config.php';

// Enable CORS for local development
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (getRequestMethod() === 'OPTIONS') {
    exit(0);
}

$pdo = getDBConnection();
$method = getRequestMethod();

// Get gallery_id from query parameter
// e.g., api-portfolios.php?id=4 or api-portfolios.php?gallery_id=4
$galleryId = isset($_GET['id']) ? $_GET['id'] : (isset($_GET['gallery_id']) ? $_GET['gallery_id'] : null);

// Route the request
switch ($method) {
    case 'GET':
        if ($galleryId) {
            getPortfolioBySlug($pdo, $galleryId); // Function name kept for compatibility
        } else {
            getAllPortfolios($pdo);
        }
        break;
    
    case 'POST':
        createPortfolio($pdo);
        break;
    
    case 'PUT':
        updatePortfolio($pdo, $galleryId);
        break;
    
    case 'DELETE':
        deletePortfolio($pdo, $galleryId);
        break;
    
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}

/**
 * Get all active portfolios
 */
function getAllPortfolios($pdo) {
    try {
        $stmt = $pdo->query("
            SELECT 
                gallery_id,
                label as title,
                graphic_url as cover_image,
                teaser as description,
                text as full_description,
                order_id,
                active_flag
            FROM gallery
            WHERE active_flag = 1
            ORDER BY order_id ASC
        ");
        
        $portfolios = $stmt->fetchAll();
        
        // Add slug and image count to each portfolio
        foreach ($portfolios as &$portfolio) {
            $portfolio['slug'] = generateSlug($portfolio['title']);
            
            // Get image count
            $countStmt = $pdo->prepare("
                SELECT COUNT(*) as count
                FROM sequence_element se
                INNER JOIN image i ON se.image_id = i.id
                WHERE se.gallery_id = ? AND se.active_flag = 1 AND i.active_flag = 1
            ");
            $countStmt->execute([$portfolio['gallery_id']]);
            $count = $countStmt->fetch();
            $portfolio['image_count'] = (int)$count['count'];
            
            // Get preview images (first 4)
            $previewStmt = $pdo->prepare("
                SELECT i.medium_file
                FROM sequence_element se
                INNER JOIN image i ON se.image_id = i.id
                WHERE se.gallery_id = ? AND se.active_flag = 1 AND i.active_flag = 1
                ORDER BY se.position ASC
                LIMIT 4
            ");
            $previewStmt->execute([$portfolio['gallery_id']]);
            $portfolio['preview_images'] = $previewStmt->fetchAll(PDO::FETCH_COLUMN);
        }
        
        sendJSON(['portfolios' => $portfolios]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to fetch portfolios: ' . $e->getMessage()], 500);
    }
}

/**
 * Get a single portfolio by gallery_id with all its images
 */
function getPortfolioBySlug($pdo, $galleryId) {
    try {
        // Get the gallery directly by ID
        $stmt = $pdo->prepare("
            SELECT 
                gallery_id,
                label as title,
                graphic_url as cover_image,
                teaser as description,
                text as full_description,
                order_id
            FROM gallery
            WHERE gallery_id = ? AND active_flag = 1
        ");
        
        $stmt->execute([$galleryId]);
        $portfolio = $stmt->fetch();
        
        if (!$portfolio) {
            sendJSON(['error' => 'Portfolio not found'], 404);
        }
        
        // Generate slug for compatibility
        $portfolio['slug'] = generateSlug($portfolio['title']);
        
        // Get all images for this portfolio
        $imageStmt = $pdo->prepare("
            SELECT 
                i.id,
                i.name,
                i.location,
                i.date,
                i.xlarge_file,
                i.large_file,
                i.medium_file,
                i.small_file,
                i.teaser,
                i.text,
                i.date_taken,
                se.position
            FROM sequence_element se
            INNER JOIN image i ON se.image_id = i.id
            WHERE se.gallery_id = ? AND se.active_flag = 1 AND i.active_flag = 1
            ORDER BY se.position ASC
        ");
        
        $imageStmt->execute([$galleryId]);
        $portfolio['images'] = $imageStmt->fetchAll();
        
        sendJSON(['portfolio' => $portfolio]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to fetch portfolio: ' . $e->getMessage()], 500);
    }
}

/**
 * Create a new portfolio
 */
function createPortfolio($pdo) {
    $input = getJSONInput();
    
    if (!isset($input['title']) || empty($input['title'])) {
        sendJSON(['error' => 'Title is required'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO gallery (label, graphic_url, teaser, text, order_id, active_flag, cdate)
            VALUES (?, ?, ?, ?, ?, 1, CURDATE())
        ");
        
        $stmt->execute([
            $input['title'],
            $input['cover_image'] ?? '',
            $input['description'] ?? '',
            $input['full_description'] ?? '',
            $input['order_id'] ?? 999
        ]);
        
        $galleryId = $pdo->lastInsertId();
        
        sendJSON([
            'success' => true,
            'message' => 'Portfolio created successfully',
            'gallery_id' => $galleryId
        ], 201);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to create portfolio: ' . $e->getMessage()], 500);
    }
}

/**
 * Update a portfolio
 */
function updatePortfolio($pdo, $galleryId) {
    if (!$galleryId) {
        sendJSON(['error' => 'Gallery ID is required'], 400);
    }
    
    $input = getJSONInput();
    
    try {
        // Check if gallery exists
        $checkStmt = $pdo->prepare("SELECT gallery_id FROM gallery WHERE gallery_id = ? AND active_flag = 1");
        $checkStmt->execute([$galleryId]);
        if (!$checkStmt->fetch()) {
            sendJSON(['error' => 'Portfolio not found'], 404);
        }
        
        $stmt = $pdo->prepare("
            UPDATE gallery 
            SET label = ?, graphic_url = ?, teaser = ?, text = ?, order_id = ?
            WHERE gallery_id = ?
        ");
        
        $stmt->execute([
            $input['title'],
            $input['cover_image'] ?? '',
            $input['description'] ?? '',
            $input['full_description'] ?? '',
            $input['order_id'] ?? 999,
            $galleryId
        ]);
        
        sendJSON([
            'success' => true,
            'message' => 'Portfolio updated successfully'
        ]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to update portfolio: ' . $e->getMessage()], 500);
    }
}

/**
 * Delete (deactivate) a portfolio
 */
function deletePortfolio($pdo, $galleryId) {
    if (!$galleryId) {
        sendJSON(['error' => 'Gallery ID is required'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("UPDATE gallery SET active_flag = 0 WHERE gallery_id = ?");
        $stmt->execute([$galleryId]);
        
        sendJSON([
            'success' => true,
            'message' => 'Portfolio deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to delete portfolio: ' . $e->getMessage()], 500);
    }
}

/**
 * Helper: Generate URL-friendly slug from title
 */
function generateSlug($title) {
    $slug = strtolower($title);
    $slug = preg_replace('/[^a-z0-9\s-]/', '', $slug);
    $slug = preg_replace('/[\s-]+/', '-', $slug);
    $slug = trim($slug, '-');
    return $slug;
}
