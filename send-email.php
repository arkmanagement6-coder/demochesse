<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

// Diagnostic error logger
function log_smtp_error($msg) {
    file_put_contents("email-errors.log", "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
}

function send_smtp_email($to, $subject, $body_html, $from_email, $password) {
    $smtp_server = "ssl://smtp.hostinger.com";
    $port = 465;
    
    // Connect via secure socket
    $socket = @fsockopen($smtp_server, $port, $errno, $errstr, 15);
    if (!$socket) {
        log_smtp_error("Connection failed: $errstr ($errno)");
        return false;
    }
    
    function read_response($socket) {
        $response = "";
        while ($str = fgets($socket, 515)) {
            $response .= $str;
            if (substr($str, 3, 1) == " ") {
                break;
            }
        }
        return $response;
    }
    
    $greeting = read_response($socket);
    if (strpos($greeting, "220") === false) {
        log_smtp_error("Greeting failed: $greeting");
        fclose($socket);
        return false;
    }
    
    // EHLO
    fwrite($socket, "EHLO paraschessacademy.com\r\n");
    $ehlo = read_response($socket);
    
    // AUTH LOGIN
    fwrite($socket, "AUTH LOGIN\r\n");
    $auth = read_response($socket);
    if (strpos($auth, "334") === false) {
        log_smtp_error("AUTH LOGIN initiation failed: $auth");
        fclose($socket);
        return false;
    }
    
    // Send Username
    fwrite($socket, base64_encode($from_email) . "\r\n");
    $user_resp = read_response($socket);
    if (strpos($user_resp, "334") === false) {
        log_smtp_error("Username rejected: $user_resp");
        fclose($socket);
        return false;
    }
    
    // Send Password
    fwrite($socket, base64_encode($password) . "\r\n");
    $pass_resp = read_response($socket);
    if (strpos($pass_resp, "235") === false) {
        log_smtp_error("Password rejected / authentication failed: $pass_resp");
        fclose($socket);
        return false;
    }
    
    // MAIL FROM
    fwrite($socket, "MAIL FROM: <$from_email>\r\n");
    $from_resp = read_response($socket);
    
    // RCPT TO
    fwrite($socket, "RCPT TO: <$to>\r\n");
    $to_resp = read_response($socket);
    if (strpos($to_resp, "250") === false && strpos($to_resp, "251") === false) {
        log_smtp_error("Recipient rejected: $to_resp");
        fclose($socket);
        return false;
    }
    
    // DATA
    fwrite($socket, "DATA\r\n");
    $data_resp = read_response($socket);
    if (strpos($data_resp, "354") === false) {
        log_smtp_error("DATA command rejected: $data_resp");
        fclose($socket);
        return false;
    }
    
    // Construct standard headers and payload
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Paras Chess Academy <" . $from_email . ">\r\n";
    $headers .= "Reply-To: " . $from_email . "\r\n";
    $headers .= "Subject: " . $subject . "\r\n";
    $headers .= "To: " . $to . "\r\n";
    
    $email_payload = $headers . "\r\n" . $body_html . "\r\n.\r\n";
    
    fwrite($socket, $email_payload);
    $send_resp = read_response($socket);
    if (strpos($send_resp, "250") === false) {
        log_smtp_error("Failed to deliver body payload: $send_resp");
        fclose($socket);
        return false;
    }
    
    // QUIT
    fwrite($socket, "QUIT\r\n");
    read_response($socket);
    fclose($socket);
    
    return true;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Get the JSON data
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    $name = isset($data["name"]) ? strip_tags($data["name"]) : "";
    $email = isset($data["email"]) ? filter_var($data["email"], FILTER_SANITIZE_EMAIL) : "";
    $phone = isset($data["phone"]) ? strip_tags($data["phone"]) : "";
    $age = isset($data["age"]) ? strip_tags($data["age"]) : "";
    $levelName = isset($data["levelName"]) ? strip_tags($data["levelName"]) : "Complete";

    if (empty($name) || empty($email)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Name and Email are required."]);
        exit;
    }

    $from = "support@paraschessacademy.com";
    $password = "Paras@2709@";

    // 1. Email Content for the Candidate
    $subject = "Your Paras Chess Academy Syllabus - $levelName Program";
    $message = "
    <html>
    <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
        <div style='max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;'>
            <div style='text-align: center; margin-bottom: 20px;'>
                <h2 style='color: #D11A2A;'>🏆 Paras Chess Academy</h2>
                <p style='font-size: 16px; font-weight: bold;'>Hello $name,</p>
            </div>
            <p>Thank you for your interest in the <strong>Paras Chess Academy</strong>. As requested, we have attached the detailed chess syllabus outline below:</p>
            
            <div style='background: #f9f9f9; padding: 15px; border-left: 4px solid #D11A2A; margin: 20px 0;'>
                <h3 style='margin-top: 0; color: #0F172A;'>$levelName Chess Syllabus Overview</h3>
                <ul>
                    <li>Chessboard foundations, coordinates, and basics.</li>
                    <li>Advanced Tactical Drills: Forks, Skewers, Decoys, Windmills.</li>
                    <li>Personalized 1-on-1 strategy sessions with FIDE-rated coaches.</li>
                    <li>Weekly live matches and game post-mortem analysis.</li>
                </ul>
            </div>

            <p style='margin-bottom: 25px;'>You can download the full detailed PDF version of the syllabus directly from the link below:</p>
            <div style='text-align: center;'>
                <a href='https://paraschessacademy.com/syllabus.pdf' style='background: #D11A2A; color: white; padding: 12px 25px; text-decoration: none; font-weight: bold; border-radius: 5px; box-shadow: 0 4px 10px rgba(209, 26, 42, 0.2);'>📥 Download Syllabus PDF</a>
            </div>

            <hr style='border: 0; border-top: 1px solid #eee; margin: 30px 0;'>
            <p style='font-size: 12px; color: #777; text-align: center;'>
                Our counselor will reach out to you on WhatsApp at <strong>$phone</strong> shortly to schedule your FREE 1-on-1 demo assessment class.<br>
                For support, email us at <a href='mailto:support@paraschessacademy.com'>support@paraschessacademy.com</a>
            </p>
        </div>
    </body>
    </html>
    ";

    // Send to candidate using SMTP
    $mailSent = send_smtp_email($email, $subject, $message, $from, $password);

    if (!$mailSent) {
        log_smtp_error("Syllabus dispatch failed to send to $email.");
    }

    // 2. Email Content for Admin (Notification Lead)
    $adminTo = "paraschessacademy@gmail.com";
    $adminSubject = "New Lead: Syllabus Requested by $name";
    $adminMessage = "
    <html>
    <body>
        <h2>New Chess Syllabus Request Lead</h2>
        <p><strong>Name:</strong> $name</p>
        <p><strong>Email:</strong> $email</p>
        <p><strong>Phone:</strong> $phone</p>
        <p><strong>Child's Age:</strong> $age Years</p>
        <p><strong>Requested Course Level:</strong> $levelName</p>
        <p><strong>Timestamp:</strong> " . date("Y-m-d H:i:s") . "</p>
    </body>
    </html>
    ";

    // Send to Admin using SMTP
    $adminMailSent = send_smtp_email($adminTo, $adminSubject, $adminMessage, $from, $password);
    if (!$adminMailSent) {
        log_smtp_error("Lead notification failed to send to $adminTo.");
    }

    if ($mailSent) {
        echo json_encode(["status" => "success", "message" => "Syllabus sent successfully to your email."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to deliver email via Hostinger SMTP. Checked diagnostics logs."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
}
?>
