<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json");

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

    // Email to the Candidate (Syllabus PDF email)
    $to = $email;
    $from = "support@paraschessacademy.com";
    $subject = "Your Paras Chess Academy Syllabus - $levelName Program";

    // Email content with syllabus overview and direct download link
    $message = "
    <html>
    <head>
        <title>Your Paras Chess Academy Syllabus</title>
    </head>
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

    // HTML Headers
    $headers = "MIME-Version: 1.0" . "\r\n";
    $headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $headers .= "From: Paras Chess Academy <" . $from . ">" . "\r\n";
    $headers .= "Reply-To: " . $from . "\r\n";

    // Send syllabus to candidate
    $mailSent = mail($to, $subject, $message, $headers);

    // Email to Admin/Owner as Lead Notification
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
    $adminHeaders = "MIME-Version: 1.0" . "\r\n";
    $adminHeaders .= "Content-type:text/html;charset=UTF-8" . "\r\n";
    $adminHeaders .= "From: Lead Generator <" . $from . ">" . "\r\n";
    
    mail($adminTo, $adminSubject, $adminMessage, $adminHeaders);

    if ($mailSent) {
        echo json_encode(["status" => "success", "message" => "Syllabus sent successfully to your email."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to send email."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
}
?>
