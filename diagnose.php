<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/html; charset=UTF-8");

echo "<html><head><title>Hostinger Email Diagnostic</title></head><body style='font-family:Arial,sans-serif; margin:40px; line-height:1.6;'>";
echo "<h2 style='color:#D11A2A;'>🏆 Paras Chess Academy - Hostinger Email Diagnostic Tool</h2>";
echo "<p>This utility tests the local email capabilities of your Hostinger server to find the best configuration.</p><hr>";

$to = "paraschessacademy@gmail.com";
$from_email = "support@paraschessacademy.com";
$subject = "Diagnostic Test Email - Paras Chess Academy";
$body_html = "
<html>
<body>
    <h3 style='color:#D11A2A;'>Hostinger Server Email Diagnostic</h3>
    <p>This is a live test email dispatched automatically from your Hostinger server.</p>
    <p>Timestamp: <strong>" . date("Y-m-d H:i:s") . "</strong></p>
</body>
</html>";

// Test 1
echo "<h3>1. Testing PHP mail() with LF (\\n) line endings:</h3>";
$headers_lf = "MIME-Version: 1.0\n";
$headers_lf .= "Content-Type: text/html; charset=UTF-8\n";
$headers_lf .= "From: Paras Chess Academy <" . $from_email . ">\n";
$headers_lf .= "Reply-To: " . $from_email . "\n";
$headers_lf .= "X-Mailer: PHP/" . phpversion() . "\n";
$mail_lf_result = @mail($to, $subject, $body_html, $headers_lf, "-f" . $from_email);
echo "Result: <strong>" . ($mail_lf_result ? "<span style='color:green;'>SUCCESS</span>" : "<span style='color:red;'>FAILED</span>") . "</strong><br>";

// Test 2
echo "<h3>2. Testing PHP mail() with CRLF (\\r\\n) line endings:</h3>";
$headers_crlf = "MIME-Version: 1.0\r\n";
$headers_crlf .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers_crlf .= "From: Paras Chess Academy <" . $from_email . ">\r\n";
$headers_crlf .= "Reply-To: " . $from_email . "\r\n";
$headers_crlf .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$mail_crlf_result = @mail($to, $subject, $body_html, $headers_crlf, "-f" . $from_email);
echo "Result: <strong>" . ($mail_crlf_result ? "<span style='color:green;'>SUCCESS</span>" : "<span style='color:red;'>FAILED</span>") . "</strong><br>";

// Test 3
echo "<h3>3. Testing SMTP Socket (fsockopen) connection to ssl://smtp.hostinger.com (Port 465):</h3>";
$smtp_server = "ssl://smtp.hostinger.com";
$port = 465;
echo "Connecting to $smtp_server on port $port...<br>";
$socket = @fsockopen($smtp_server, $port, $errno, $errstr, 15);
if (!$socket) {
    echo "Connection Failed: <strong><span style='color:red;'>$errstr ($errno)</span></strong><br>";
} else {
    echo "Connection Succeeded!<br>";
    $greeting = "";
    while ($str = fgets($socket, 515)) {
        $greeting .= $str;
        if (substr($str, 3, 1) == " ") break;
    }
    echo "Greeting from Hostinger SMTP: <strong>" . htmlspecialchars(trim($greeting)) . "</strong><br>";
    fclose($socket);
}

// Test 4
echo "<h3>4. Testing SMTP Socket (fsockopen) connection to tls://smtp.hostinger.com (Port 587):</h3>";
$smtp_server_tls = "tls://smtp.hostinger.com";
$port_tls = 587;
echo "Connecting to $smtp_server_tls on port $port_tls...<br>";
$socket_tls = @fsockopen($smtp_server_tls, $port_tls, $errno, $errstr, 15);
if (!$socket_tls) {
    echo "Connection Failed: <strong><span style='color:red;'>$errstr ($errno)</span></strong><br>";
} else {
    echo "Connection Succeeded!<br>";
    $greeting_tls = "";
    while ($str = fgets($socket_tls, 515)) {
        $greeting_tls .= $str;
        if (substr($str, 3, 1) == " ") break;
    }
    echo "Greeting from Hostinger SMTP: <strong>" . htmlspecialchars(trim($greeting_tls)) . "</strong><br>";
    fclose($socket_tls);
}

echo "<hr><p style='font-size:12px; color:#777;'>Paras Chess Academy Diagnostic Tool</p></body></html>";
?>
