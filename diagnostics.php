<?php
// Diagnostics Script for Paras Chess Academy (diagnostics.php)
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/html; charset=UTF-8");

echo "<h1>Paras Chess Academy - System Diagnostics</h1>";
echo "<hr>";

// 1. PHP Environment
echo "<h3>1. Environment Details</h3>";
echo "PHP Version: " . phpversion() . "<br>";
echo "Current Directory: " . __DIR__ . "<br>";
echo "Server Software: " . $_SERVER['SERVER_SOFTWARE'] . "<br>";

// 2. Directory Permissions Check
echo "<h3>2. Database Directory & Write Permissions</h3>";
$dbDir = __DIR__ . '/data';
$dbFile = $dbDir . '/database.php';

if (is_dir($dbDir)) {
    echo "Directory <code style='background:#f4f4f4;padding:2px 6px;'>/data</code> exists.<br>";
    $dirPerms = substr(sprintf('%o', fileperms($dbDir)), -4);
    echo "Directory permissions: <strong>$dirPerms</strong><br>";
    
    if (is_writable($dbDir)) {
        echo "<span style='color:green;font-weight:bold;'>✔ /data directory is WRITABLE.</span><br>";
    } else {
        echo "<span style='color:red;font-weight:bold;'>✘ /data directory is NOT WRITABLE!</span> Please set permissions to 755 or 777 in your Hostinger File Manager.<br>";
    }
} else {
    echo "Directory <code style='background:#f4f4f4;padding:2px 6px;'>/data</code> does not exist. Attempting to create it...<br>";
    if (mkdir($dbDir, 0755, true)) {
        echo "<span style='color:green;font-weight:bold;'>✔ Successfully created /data directory.</span><br>";
    } else {
        echo "<span style='color:red;font-weight:bold;'>✘ Failed to create /data directory!</span> Check parent directory permissions.<br>";
    }
}

// 3. Database File Permissions Check
if (file_exists($dbFile)) {
    echo "File <code style='background:#f4f4f4;padding:2px 6px;'>/data/database.php</code> exists.<br>";
    $filePerms = substr(sprintf('%o', fileperms($dbFile)), -4);
    echo "File permissions: <strong>$filePerms</strong><br>";
    
    if (is_writable($dbFile)) {
         echo "<span style='color:green;font-weight:bold;'>✔ database.php file is WRITABLE.</span><br>";
    } else {
         echo "<span style='color:red;font-weight:bold;'>✘ database.php file is NOT WRITABLE!</span> Set file permissions to 644 or 666 in Hostinger.<br>";
    }
} else {
    echo "File <code style='background:#f4f4f4;padding:2px 6px;'>/data/database.php</code> does not exist yet.<br>";
    // Try mock write
    $testPayload = "<?php http_response_code(403); exit; ?>\n" . json_encode(["teachers" => [], "bookings" => []]);
    if (@file_put_contents($dbFile, $testPayload)) {
         echo "<span style='color:green;font-weight:bold;'>✔ Successfully created and wrote test data to database.php.</span><br>";
         unlink($dbFile); // Clean up
    } else {
         echo "<span style='color:red;font-weight:bold;'>✘ Failed to write to database.php!</span><br>";
    }
}

// 4. SMTP Connection Check
echo "<h3>3. SMTP Mail Connectivity (Hostinger)</h3>";
$smtp_server = "ssl://smtp.hostinger.com";
$port = 465;
echo "Attempting secure socket connection to <strong>$smtp_server</strong> on port <strong>$port</strong>...<br>";

$tStart = microtime(true);
$socket = @fsockopen($smtp_server, $port, $errno, $errstr, 10);
$tEnd = microtime(true);
$elapsed = round($tEnd - $tStart, 3);

if ($socket) {
    echo "<span style='color:green;font-weight:bold;'>✔ Connection Successful (Time: {$elapsed}s)!</span> Hostinger SMTP port 465 is open.<br>";
    
    // Read greeting
    $greeting = "";
    stream_set_timeout($socket, 3);
    $greeting = fgets($socket, 515);
    echo "SMTP Server Greeting: <code style='background:#f4f4f4;padding:2px 6px;'>" . htmlspecialchars(trim($greeting)) . "</code><br>";
    fclose($socket);
} else {
    echo "<span style='color:red;font-weight:bold;'>✘ Connection Failed (Time: {$elapsed}s)!</span><br>";
    echo "Error Number: $errno<br>";
    echo "Error Message: $errstr<br>";
    echo "<em>Note: If this connection fails, Hostinger SMTP is either blocked by server firewall rules or you need to use port 587 with TLS or standard PHP mail() fallback.</em><br>";
}

echo "<hr>";
echo "<p style='font-size:12px;color:#666;'>Paras Chess Academy Diagnostics Script. Delete this file or block access after testing.</p>";
?>
