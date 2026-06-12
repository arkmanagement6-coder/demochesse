<?php
// Secure AJAX Backend Database Handler for Paras Chess Academy (db.php)
error_reporting(0);
ini_set('display_errors', 0);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

$dbDir = __DIR__ . '/data';
$dbFile = $dbDir . '/database.php';

// Ensure data directory exists
if (!is_dir($dbDir)) {
    mkdir($dbDir, 0755, true);
    // Create an .htaccess file in data/ to prevent any direct access to files inside it
    file_put_contents($dbDir . '/.htaccess', "Deny from all\n");
}

$action = isset($_GET['action']) ? $_GET['action'] : '';

// Helper to send JSON responses
function sendResponse($data) {
    echo json_encode($data);
    exit;
}

// Prefix to prevent direct access to database.php file if htaccess is bypassed
$securityPrefix = "<?php http_response_code(403); exit; ?>\n";

if ($action === 'load') {
    if (!file_exists($dbFile)) {
        // Return default empty state
        sendResponse([
            'teachers' => [],
            'bookings' => [],
            'crm_leads' => [],
            'logs' => [],
            'roster' => []
        ]);
    }
    
    $raw = file_get_contents($dbFile);
    if ($raw === false) {
        sendResponse(['error' => 'Failed to read database file']);
    }
    
    // Strip the security prefix
    $json = str_replace($securityPrefix, '', $raw);
    $data = json_decode($json, true);
    if ($data === null) {
        // Fallback to empty if corrupted
        sendResponse([
            'teachers' => [],
            'bookings' => [],
            'crm_leads' => [],
            'logs' => [],
            'roster' => []
        ]);
    }
    
    sendResponse($data);
} 
elseif ($action === 'save') {
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        http_response_code(405);
        sendResponse(['error' => 'Method Not Allowed']);
    }
    
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    if ($data === null) {
        http_response_code(400);
        sendResponse(['error' => 'Invalid JSON input']);
    }
    
    // Validate required fields to ensure it's not a garbage save
    if (!isset($data['teachers']) || !isset($data['bookings'])) {
        http_response_code(400);
        sendResponse(['error' => 'Missing database keys']);
    }
    
    // Write data securely with exclusive lock
    $payload = $securityPrefix . json_encode($data, JSON_PRETTY_PRINT);
    $result = file_put_contents($dbFile, $payload, LOCK_EX);
    
    if ($result === false) {
        http_response_code(500);
        sendResponse(['error' => 'Failed to write database file']);
    }
    
    sendResponse(['success' => true]);
} 
else {
    http_response_code(400);
    sendResponse(['error' => 'Invalid action']);
}
