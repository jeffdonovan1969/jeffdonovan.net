<?php
/**
 * Images API
 * Handles CRUD operations for images and their association with galleries
 */

require_once 'config.php';

// Enable CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

if (getRequestMethod() === 'OPTIONS') {
    exit(0);
}

$pdo = getDBConnection();
$method = getRequestMethod();

// Route the request
switch ($method) {
    case 'GET':
        if (isset($_GET['gallery_id'])) {
            getImagesByGallery($pdo, $_GET['gallery_id']);
        } elseif (isset($_GET['id'])) {
            getImageById($pdo, $_GET['id']);
        } elseif (isset($_GET['search'])) {
            searchImages($pdo, $_GET['search']);
        } else {
            getAllImages($pdo);
        }
        break;
    
    case 'POST':
        if (isset($_GET['action']) && $_GET['action'] === 'add_to_gallery') {
            addImageToGallery($pdo);
        } else {
            createImage($pdo);
        }
        break;
    
    case 'PUT':
        if (isset($_GET['id'])) {
            updateImage($pdo, $_GET['id']);
        } else {
            sendJSON(['error' => 'Image ID is required'], 400);
        }
        break;
    
    case 'DELETE':
        if (isset($_GET['action']) && $_GET['action'] === 'remove_from_gallery') {
            removeImageFromGallery($pdo);
        } elseif (isset($_GET['id'])) {
            deleteImage($pdo, $_GET['id']);
        } else {
            sendJSON(['error' => 'Image ID is required'], 400);
        }
        break;
    
    default:
        sendJSON(['error' => 'Method not allowed'], 405);
}

/**
 * Get all active images
 */
function getAllImages($pdo) {
    try {
        $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
        $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 50;
        $offset = ($page - 1) * $limit;
        
        // Get total count
        $countStmt = $pdo->query("SELECT COUNT(*) FROM image WHERE active_flag = 1");
        $total = $countStmt->fetchColumn();
        
        // Get images
        $stmt = $pdo->prepare("
            SELECT 
                id,
                name,
                location,
                date,
                xlarge_file,
                large_file,
                medium_file,
                small_file,
                teaser,
                text,
                date_taken
            FROM image
            WHERE active_flag = 1
            ORDER BY id DESC
            LIMIT ? OFFSET ?
        ");
        
        $stmt->execute([$limit, $offset]);
        $images = $stmt->fetchAll();
        
        sendJSON([
            'images' => $images,
            'total' => (int)$total,
            'page' => $page,
            'per_page' => $limit,
            'total_pages' => ceil($total / $limit)
        ]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to fetch images: ' . $e->getMessage()], 500);
    }
}

/**
 * Get images by gallery ID
 */
function getImagesByGallery($pdo, $galleryId) {
    try {
        $stmt = $pdo->prepare("
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
                se.position,
                se.sequence_element_id
            FROM sequence_element se
            INNER JOIN image i ON se.image_id = i.id
            WHERE se.gallery_id = ? AND se.active_flag = 1 AND i.active_flag = 1
            ORDER BY se.position ASC
        ");
        
        $stmt->execute([$galleryId]);
        $images = $stmt->fetchAll();
        
        sendJSON(['images' => $images]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to fetch images: ' . $e->getMessage()], 500);
    }
}

/**
 * Get single image by ID
 */
function getImageById($pdo, $imageId) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                name,
                location,
                date,
                xlarge_file,
                large_file,
                medium_file,
                small_file,
                teaser,
                text,
                date_taken
            FROM image
            WHERE id = ? AND active_flag = 1
        ");
        
        $stmt->execute([$imageId]);
        $image = $stmt->fetch();
        
        if (!$image) {
            sendJSON(['error' => 'Image not found'], 404);
        }
        
        // Get galleries this image belongs to
        $galleryStmt = $pdo->prepare("
            SELECT g.gallery_id, g.label
            FROM sequence_element se
            INNER JOIN gallery g ON se.gallery_id = g.gallery_id
            WHERE se.image_id = ? AND se.active_flag = 1
        ");
        $galleryStmt->execute([$imageId]);
        $image['galleries'] = $galleryStmt->fetchAll();
        
        sendJSON(['image' => $image]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to fetch image: ' . $e->getMessage()], 500);
    }
}

/**
 * Search images
 */
function searchImages($pdo, $searchTerm) {
    try {
        $stmt = $pdo->prepare("
            SELECT 
                id,
                name,
                location,
                date,
                medium_file,
                teaser
            FROM image
            WHERE active_flag = 1 
            AND (
                name LIKE ? OR 
                location LIKE ? OR 
                teaser LIKE ? OR 
                text LIKE ?
            )
            ORDER BY id DESC
            LIMIT 100
        ");
        
        $searchPattern = '%' . $searchTerm . '%';
        $stmt->execute([$searchPattern, $searchPattern, $searchPattern, $searchPattern]);
        $images = $stmt->fetchAll();
        
        sendJSON(['images' => $images, 'count' => count($images)]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to search images: ' . $e->getMessage()], 500);
    }
}

/**
 * Create a new image
 */
function createImage($pdo) {
    $input = getJSONInput();
    
    if (!isset($input['name']) || empty($input['name'])) {
        sendJSON(['error' => 'Image name is required'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("
            INSERT INTO image (
                name, location, date, xlarge_file, large_file, 
                medium_file, small_file, teaser, text, active_flag
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
        ");
        
        $stmt->execute([
            $input['name'],
            $input['location'] ?? '',
            $input['date'] ?? '',
            $input['xlarge_file'] ?? '',
            $input['large_file'] ?? '',
            $input['medium_file'] ?? '',
            $input['small_file'] ?? '',
            $input['teaser'] ?? '',
            $input['text'] ?? ''
        ]);
        
        $imageId = $pdo->lastInsertId();
        
        sendJSON([
            'success' => true,
            'message' => 'Image created successfully',
            'image_id' => $imageId
        ], 201);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to create image: ' . $e->getMessage()], 500);
    }
}

/**
 * Update an image
 */
function updateImage($pdo, $imageId) {
    $input = getJSONInput();
    
    try {
        // First check if image exists
        $checkStmt = $pdo->prepare("SELECT id FROM image WHERE id = ? AND active_flag = 1");
        $checkStmt->execute([$imageId]);
        if (!$checkStmt->fetch()) {
            sendJSON(['error' => 'Image not found'], 404);
        }
        
        $stmt = $pdo->prepare("
            UPDATE image 
            SET name = ?, location = ?, date = ?, xlarge_file = ?, 
                large_file = ?, medium_file = ?, small_file = ?, 
                teaser = ?, text = ?
            WHERE id = ?
        ");
        
        $stmt->execute([
            $input['name'],
            $input['location'] ?? '',
            $input['date'] ?? '',
            $input['xlarge_file'] ?? '',
            $input['large_file'] ?? '',
            $input['medium_file'] ?? '',
            $input['small_file'] ?? '',
            $input['teaser'] ?? '',
            $input['text'] ?? '',
            $imageId
        ]);
        
        sendJSON([
            'success' => true,
            'message' => 'Image updated successfully'
        ]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to update image: ' . $e->getMessage()], 500);
    }
}

/**
 * Delete (deactivate) an image
 */
function deleteImage($pdo, $imageId) {
    try {
        $stmt = $pdo->prepare("UPDATE image SET active_flag = 0 WHERE id = ?");
        $stmt->execute([$imageId]);
        
        sendJSON([
            'success' => true,
            'message' => 'Image deleted successfully'
        ]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to delete image: ' . $e->getMessage()], 500);
    }
}

/**
 * Add an image to a gallery
 */
function addImageToGallery($pdo) {
    $input = getJSONInput();
    
    if (!isset($input['gallery_id']) || !isset($input['image_id'])) {
        sendJSON(['error' => 'Gallery ID and Image ID are required'], 400);
    }
    
    try {
        // Get the max position for this gallery
        $posStmt = $pdo->prepare("
            SELECT COALESCE(MAX(position), -1) + 1 as next_position
            FROM sequence_element
            WHERE gallery_id = ?
        ");
        $posStmt->execute([$input['gallery_id']]);
        $position = $posStmt->fetchColumn();
        
        // Insert the association
        $stmt = $pdo->prepare("
            INSERT INTO sequence_element (gallery_id, image_id, position, active_flag)
            VALUES (?, ?, ?, 1)
        ");
        
        $stmt->execute([
            $input['gallery_id'],
            $input['image_id'],
            $input['position'] ?? $position
        ]);
        
        sendJSON([
            'success' => true,
            'message' => 'Image added to gallery successfully',
            'sequence_element_id' => $pdo->lastInsertId()
        ], 201);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to add image to gallery: ' . $e->getMessage()], 500);
    }
}

/**
 * Remove an image from a gallery
 */
function removeImageFromGallery($pdo) {
    $input = getJSONInput();
    
    if (!isset($input['gallery_id']) || !isset($input['image_id'])) {
        sendJSON(['error' => 'Gallery ID and Image ID are required'], 400);
    }
    
    try {
        $stmt = $pdo->prepare("
            UPDATE sequence_element 
            SET active_flag = 0 
            WHERE gallery_id = ? AND image_id = ?
        ");
        
        $stmt->execute([
            $input['gallery_id'],
            $input['image_id']
        ]);
        
        sendJSON([
            'success' => true,
            'message' => 'Image removed from gallery successfully'
        ]);
        
    } catch (PDOException $e) {
        sendJSON(['error' => 'Failed to remove image from gallery: ' . $e->getMessage()], 500);
    }
}
