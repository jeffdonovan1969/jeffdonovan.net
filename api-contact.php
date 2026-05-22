<?php
/**
 * api-contact.php
 * Handles contact form submissions — upserts contact, inserts comment.
 */

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'error' => 'Method not allowed']);
    exit;
}

// ── DB config ────────────────────────────────────────────────────────────────
require_once __DIR__ . '/config.php';

// ── Input validation ─────────────────────────────────────────────────────────
$input = json_decode(file_get_contents('php://input'), true);

// Support both JSON body and form-encoded POST
if (!$input) {
    $input = $_POST;
}

$firstName = trim($input['first_name'] ?? '');
$lastName  = trim($input['last_name']  ?? '');
$email     = trim($input['email']      ?? '');
$type      = trim($input['type']       ?? 'General Inquiry');
$message   = trim($input['message']    ?? '');

if (!$firstName || !$lastName || !$email || !$message) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'All fields are required.']);
    exit;
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(['success' => false, 'error' => 'Invalid email address.']);
    exit;
}

// Sanitize
$firstName = htmlspecialchars($firstName, ENT_QUOTES, 'UTF-8');
$lastName  = htmlspecialchars($lastName,  ENT_QUOTES, 'UTF-8');
$email     = htmlspecialchars($email,     ENT_QUOTES, 'UTF-8');
$type      = htmlspecialchars($type,      ENT_QUOTES, 'UTF-8');
$message   = htmlspecialchars($message,   ENT_QUOTES, 'UTF-8');

// ── DB connection ─────────────────────────────────────────────────────────────
$pdo = getDBConnection();

// ── Upsert contact ────────────────────────────────────────────────────────────
// Look up by email first; create if not found
try {
    $stmt = $pdo->prepare('SELECT id FROM contact WHERE email_address = ? LIMIT 1');
    $stmt->execute([$email]);
    $contact = $stmt->fetch(PDO::FETCH_ASSOC);

    if ($contact) {
        // Update name in case it changed
        $upd = $pdo->prepare(
            'UPDATE contact SET first_name = ?, last_name = ? WHERE id = ?'
        );
        $upd->execute([$firstName, $lastName, $contact['id']]);
        $contactId = $contact['id'];
    } else {
        // Insert new contact
        $ins = $pdo->prepare(
            'INSERT INTO contact
               (email_address, first_name, last_name, type, active_flag, email_flag, creation_date)
             VALUES (?, ?, ?, ?, 1, 0, CURDATE())'
        );
        $ins->execute([$email, $firstName, $lastName, 'INDIVIDUAL']);
        $contactId = $pdo->lastInsertId();
    }
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save contact.']);
    exit;
}

// ── Insert comment ────────────────────────────────────────────────────────────
try {
    $ins = $pdo->prepare(
        'INSERT INTO comment
           (contactId, comment, type, comment_date, active_flag, publish)
         VALUES (?, ?, ?, CURDATE(), 0, 0)'
    );
    $ins->execute([$contactId, $message, $type]);
} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Failed to save message.']);
    exit;
}

echo json_encode([
    'success'    => true,
    'message'    => 'Thank you! Your message has been received.',
    'contact_id' => (int) $contactId,
]);
