<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/plain; charset=UTF-8");

echo "=== PARAS CHESS ACADEMY - SMTP DIAGNOSTIC ===\n\n";

$to = "paraschessacademy@gmail.com";
$from = "support@paraschessacademy.com";
$password = "Paras@2709@";

echo "Testing SMTP SSL (ssl://smtp.hostinger.com on Port 465):\n";
test_smtp_detailed("ssl://smtp.hostinger.com", 465, $from, $password, $to);

echo "\n-----------------------------------------\n\n";

echo "Testing SMTP STARTTLS (smtp.hostinger.com on Port 587):\n";
test_smtp_detailed("smtp.hostinger.com", 587, $from, $password, $to);

function read_response($socket) {
    $response = "";
    while ($str = fgets($socket, 515)) {
        $response .= $str;
        echo "S: " . trim($str) . "\n";
        if (substr($str, 3, 1) == " ") {
            break;
        }
    }
    return $response;
}

function send_cmd($socket, $cmd) {
    echo "C: " . trim($cmd) . "\n";
    fwrite($socket, $cmd . "\r\n");
    return read_response($socket);
}

function test_smtp_detailed($server, $port, $username, $password, $to) {
    $t1 = microtime(true);
    echo "Connecting to $server on port $port...\n";
    $socket = @fsockopen($server, $port, $errno, $errstr, 10);
    if (!$socket) {
        echo "ERROR: Connection failed: $errstr ($errno)\n";
        return;
    }
    echo "Connection established in " . round(microtime(true) - $t1, 3) . "s\n";
    
    read_response($socket);
    
    send_cmd($socket, "EHLO paraschessacademy.com");
    
    if ($port == 587) {
        $res = send_cmd($socket, "STARTTLS");
        if (strpos($res, "220") !== false) {
            echo "Enabling crypto/encryption on socket...\n";
            if (stream_socket_enable_crypto($socket, true, STREAM_CRYPTO_METHOD_TLS_CLIENT)) {
                echo "TLS encryption enabled successfully!\n";
                send_cmd($socket, "EHLO paraschessacademy.com");
            } else {
                echo "ERROR: Failed to enable TLS encryption on socket.\n";
                fclose($socket);
                return;
            }
        } else {
            echo "ERROR: STARTTLS rejected.\n";
            fclose($socket);
            return;
        }
    }
    
    $auth_res = send_cmd($socket, "AUTH LOGIN");
    if (strpos($auth_res, "334") === false) {
        echo "ERROR: AUTH LOGIN initiation failed.\n";
        fclose($socket);
        return;
    }
    
    send_cmd($socket, base64_encode($username));
    $pass_res = send_cmd($socket, base64_encode($password));
    if (strpos($pass_res, "235") === false) {
        echo "ERROR: Authentication failed.\n";
        fclose($socket);
        return;
    }
    
    echo "SUCCESS: Authenticated successfully!\n";
    
    send_cmd($socket, "MAIL FROM: <$username>");
    send_cmd($socket, "RCPT TO: <$to>");
    send_cmd($socket, "DATA");
    
    $subject = "SMTP Diagnostic Test";
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Paras Chess Academy <" . $username . ">\r\n";
    $headers .= "Subject: " . $subject . "\r\n";
    $headers .= "To: " . $to . "\r\n";
    
    $body = "<html><body><h3>SMTP Diagnostic Test Succeeded</h3><p>Time: " . date("Y-m-d H:i:s") . "</p></body></html>";
    
    send_cmd($socket, $headers . "\r\n" . $body . "\r\n.");
    send_cmd($socket, "QUIT");
    
    fclose($socket);
}
?>
