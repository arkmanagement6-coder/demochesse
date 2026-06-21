<?php
// PHP Script to programmatically generate Zoom Meetings via Server-to-Server OAuth
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method Not Allowed']);
    exit;
}

require_once 'zoom-config.php';

// Check if credentials are still placeholder values
if (ZOOM_ACCOUNT_ID === 'YOUR_ZOOM_ACCOUNT_ID' || ZOOM_CLIENT_ID === 'YOUR_ZOOM_CLIENT_ID' || ZOOM_CLIENT_SECRET === 'YOUR_ZOOM_CLIENT_SECRET') {
    echo json_encode(['error' => 'Zoom API credentials are not configured. Please fill in your credentials in zoom-config.php, or update the Zoom link manually.']);
    exit;
}

$input = json_decode(file_get_contents('php://input'), true);
$bookingId = isset($input['booking_id']) ? strip_tags($input['booking_id']) : '';

if (empty($bookingId)) {
    http_response_code(400);
    echo json_encode(['error' => 'Booking ID is required']);
    exit;
}

// 1. Get Zoom Access Token via Server-to-Server OAuth
$tokenUrl = "https://zoom.us/oauth/token";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $tokenUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query([
    'grant_type' => 'account_credentials',
    'account_id' => ZOOM_ACCOUNT_ID
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Basic ' . base64_encode(ZOOM_CLIENT_ID . ':' . ZOOM_CLIENT_SECRET),
    'Content-Type: application/x-www-form-urlencoded'
]);

$tokenResponse = curl_exec($ch);
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error during token fetch: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

$tokenData = json_decode($tokenResponse, true);
if (isset($tokenData['error'])) {
    http_response_code(400);
    echo json_encode(['error' => 'Zoom Token Authorization Error: ' . $tokenData['error_description']]);
    exit;
}

$accessToken = isset($tokenData['access_token']) ? $tokenData['access_token'] : '';
if (empty($accessToken)) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to retrieve access token from Zoom.']);
    exit;
}

// 2. Load Booking Details from server database file
$dbFile = __DIR__ . '/data/database.php';
$securityPrefix = "<?php http_response_code(403); exit; ?>\n";

if (!file_exists($dbFile)) {
    http_response_code(500);
    echo json_encode(['error' => 'Server database file not found.']);
    exit;
}

$rawDb = file_get_contents($dbFile);
$jsonDb = str_replace($securityPrefix, '', $rawDb);
$dbData = json_decode($jsonDb, true);

if (!$dbData || !isset($dbData['bookings'])) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to parse database or bookings list.']);
    exit;
}

$bookingIndex = -1;
foreach ($dbData['bookings'] as $idx => $b) {
    if ($b['id'] === $bookingId) {
        $bookingIndex = $idx;
        break;
    }
}

if ($bookingIndex === -1) {
    http_response_code(404);
    echo json_encode(['error' => 'Booking ID not found in server database.']);
    exit;
}

$booking = $dbData['bookings'][$bookingIndex];
$studentName = isset($booking['studentName']) ? $booking['studentName'] : 'Chess Student';

// 3. Create Zoom Meeting via API
$meetingUrl = "https://api.zoom.us/v2/users/me/meetings";
$meetingPayload = [
    'topic' => 'Paras Chess Academy Demo: ' . $studentName,
    'type' => 2, // Scheduled Meeting
    'duration' => 45,
    'timezone' => 'Asia/Kolkata',
    'settings' => [
        'join_before_host' => true,
        'waiting_room' => false,
        'jbh_time' => 0,
        'mute_upon_entry' => true
    ]
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $meetingUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($meetingPayload));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ' . $accessToken,
    'Content-Type: application/json'
]);

$meetingResponse = curl_exec($ch);
if (curl_errno($ch)) {
    http_response_code(500);
    echo json_encode(['error' => 'cURL error during meeting creation: ' . curl_error($ch)]);
    curl_close($ch);
    exit;
}
curl_close($ch);

$meetingData = json_decode($meetingResponse, true);
if (isset($meetingData['code']) && $meetingData['code'] != 200) {
    http_response_code(400);
    echo json_encode(['error' => 'Zoom API error: ' . $meetingData['message']]);
    exit;
}

$joinUrl = isset($meetingData['join_url']) ? $meetingData['join_url'] : '';
if (empty($joinUrl)) {
    http_response_code(500);
    echo json_encode(['error' => 'Zoom API did not return a valid join URL.']);
    exit;
}

// 4. Update Database
$dbData['bookings'][$bookingIndex]['meetingLink'] = $joinUrl;
$dbData['bookings'][$bookingIndex]['isRealMeetingLink'] = true;

// Add logs
if (isset($dbData['logs'])) {
    array_unshift($dbData['logs'], [
        'timestamp' => date('c'),
        'type' => 'system',
        'message' => "Generated active Zoom meeting room via API for student " . $studentName . ": " . $joinUrl
    ]);
}

$newJsonDb = json_encode($dbData, JSON_PRETTY_PRINT);
$writeSuccess = file_put_contents($dbFile, $securityPrefix . $newJsonDb);

if ($writeSuccess === false) {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to save updated database file.']);
    exit;
}

echo json_encode([
    'success' => true,
    'meetingLink' => $joinUrl
]);
