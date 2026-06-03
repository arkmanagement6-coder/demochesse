<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/html; charset=UTF-8");

echo "<html><head><title>Hostinger Email Diagnostic</title></head><body style='font-family:Arial,sans-serif; margin:40px; line-height:1.6;'>";
echo "<h2 style='color:#D11A2A;'>🏆 Paras Chess Academy - Hostinger Email Diagnostic Tool</h2>";
echo "<p>This utility tests the local email capabilities of your Hostinger server to find the best configuration.</p><hr>";

$to = "paraschessacademy@gmail.com";
$from_email = "support@paraschessacademy.com";
$password = "Paras@2709@";
$subject = "Diagnostic Test Email - Paras Chess Academy";
$body_html = "
<html>
<body>
    <h3 style='color:#D11A2A;'>Hostinger Server Email Diagnostic</h3>
    <p>This is a live test email dispatched automatically from your Hostinger server.</p>
    <p>Timestamp: <strong>" . date("Y-m-d H:i:s") . "</strong></p>
</body>
</html>";

// Test 1: PHP Mail LF
echo "<h3>1. Testing PHP mail() with LF (\\n) line endings:</h3>";
$headers_lf = "MIME-Version: 1.0\n";
$headers_lf .= "Content-Type: text/html; charset=UTF-8\n";
$headers_lf .= "From: Paras Chess Academy <" . $from_email . ">\n";
$headers_lf .= "Reply-To: " . $from_email . "\n";
$headers_lf .= "X-Mailer: PHP/" . phpversion() . "\n";
$mail_lf_result = @mail($to, $subject, $body_html, $headers_lf, "-f" . $from_email);
echo "Result: <strong>" . ($mail_lf_result ? "<span style='color:green;'>SUCCESS (Queued by local mailer)</span>" : "<span style='color:red;'>FAILED</span>") . "</strong><br>";

// Test 2: PHP Mail CRLF
echo "<h3>2. Testing PHP mail() with CRLF (\\r\\n) line endings:</h3>";
$headers_crlf = "MIME-Version: 1.0\r\n";
$headers_crlf .= "Content-Type: text/html; charset=UTF-8\r\n";
$headers_crlf .= "From: Paras Chess Academy <" . $from_email . ">\r\n";
$headers_crlf .= "Reply-To: " . $from_email . "\r\n";
$headers_crlf .= "X-Mailer: PHP/" . phpversion() . "\r\n";
$mail_crlf_result = @mail($to, $subject, $body_html, $headers_crlf, "-f" . $from_email);
echo "Result: <strong>" . ($mail_crlf_result ? "<span style='color:green;'>SUCCESS (Queued by local mailer)</span>" : "<span style='color:red;'>FAILED</span>") . "</strong><br>";

// Test 3: Full SMTP handshakes
echo "<h3>3. Testing Direct SMTP Handshake (ssl://smtp.hostinger.com on Port 465):</h3>";

function read_smtp_response_html($socket) {
    $response = "";
    while ($str = fgets($socket, 515)) {
        $response .= $str;
        echo "<span style='color:#555;'>S: " . htmlspecialchars(trim($str)) . "</span><br>";
        if (substr($str, 3, 1) == " ") {
            break;
        }
    }
    return $response;
}

function send_smtp_cmd_html($socket, $cmd, $mask_cmd = null) {
    $display_cmd = ($mask_cmd !== null) ? $mask_cmd : $cmd;
    echo "<strong>C: " . htmlspecialchars(trim($display_cmd)) . "</strong><br>";
    fwrite($socket, $cmd . "\r\n");
    return read_smtp_response_html($socket);
}

$smtp_server = "ssl://smtp.hostinger.com";
$port = 465;

echo "Connecting to $smtp_server on port $port...<br>";
$socket = @fsockopen($smtp_server, $port, $errno, $errstr, 15);
if (!$socket) {
    echo "Connection Failed: <strong><span style='color:red;'>$errstr ($errno)</span></strong><br>";
} else {
    echo "<span style='color:green; font-weight:bold;'>Socket Connection Succeeded! Starting Handshake:</span><br><br>";
    
    // Read Greeting
    read_smtp_response_html($socket);
    
    // EHLO
    send_smtp_cmd_html($socket, "EHLO paraschessacademy.com");
    
    // AUTH LOGIN
    $auth_res = send_smtp_cmd_html($socket, "AUTH LOGIN");
    
    if (strpos($auth_res, "334") !== false) {
        // Send User
        send_smtp_cmd_html($socket, base64_encode($from_email), "base64_encode('$from_email')");
        // Send Pass
        $pass_res = send_smtp_cmd_html($socket, base64_encode($password), "base64_encode('********')");
        
        if (strpos($pass_res, "235") !== false) {
            echo "<span style='color:green; font-weight:bold;'>Authentication Succeeded! Attempting to send test mail:</span><br><br>";
            
            send_smtp_cmd_html($socket, "MAIL FROM: <$from_email>");
            send_smtp_cmd_html($socket, "RCPT TO: <$to>");
            
            $data_res = send_smtp_cmd_html($socket, "DATA");
            if (strpos($data_res, "354") !== false) {
                $headers = "MIME-Version: 1.0\r\n";
                $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
                $headers .= "From: Paras Chess Academy <" . $from_email . ">\r\n";
                $headers .= "Subject: SMTP Live Diagnostic Test\r\n";
                $headers .= "To: " . $to . "\r\n";
                
                $payload = $headers . "\r\n" . $body_html . "\r\n.";
                send_smtp_cmd_html($socket, $payload, "[EMAIL HEADERS AND BODY PAYLOAD]");
            }
        } else {
            echo "<span style='color:red; font-weight:bold;'>Authentication Failed! Check your SMTP username and password.</span><br>";
        }
    }
    
    send_smtp_cmd_html($socket, "QUIT");
    fclose($socket);
    echo "<br><span style='color:blue; font-weight:bold;'>SMTP session closed.</span><br>";
}

echo "<hr><p style='font-size:12px; color:#777;'>Paras Chess Academy Diagnostic Tool</p></body></html>";
?>
