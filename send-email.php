<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

// Handle CORS Preflight OPTIONS request
if ($_SERVER["REQUEST_METHOD"] === "OPTIONS") {
    http_response_code(200);
    exit;
}

// Diagnostic error logger
function log_smtp_error($msg) {
    file_put_contents("email-errors.log", "[" . date("Y-m-d H:i:s") . "] " . $msg . "\n", FILE_APPEND);
}

function read_smtp_response($socket) {
    $response = "";
    while ($str = fgets($socket, 515)) {
        $response .= $str;
        if (substr($str, 3, 1) == " ") {
            break;
        }
    }
    return $response;
}

function send_smtp_email($to, $subject, $body_html, $from_email, $password) {
    // 1. First, try the standard PHP mail() function which is 100% reliable on Hostinger
    $headers = "MIME-Version: 1.0\r\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\r\n";
    $headers .= "From: Paras Chess Academy <" . $from_email . ">\r\n";
    $headers .= "Reply-To: " . $from_email . "\r\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\r\n";
    
    // -f option sets the sender envelope address (critical on Hostinger to avoid spoofing filters)
    $additional_params = "-f" . $from_email;
    
    $mail_sent = @mail($to, $subject, $body_html, $headers, $additional_params);
    if ($mail_sent) {
        return true;
    }
    
    // Log PHP mail() failure and try SMTP socket fallback
    log_smtp_error("PHP mail() failed for $to. Trying SMTP socket fallback...");

    $smtp_server = "ssl://smtp.hostinger.com";
    $port = 465;
    
    // Connect via secure socket
    $socket = @fsockopen($smtp_server, $port, $errno, $errstr, 15);
    if (!$socket) {
        log_smtp_error("SMTP Connection failed: $errstr ($errno)");
        return false;
    }
    
    $greeting = read_smtp_response($socket);
    if (strpos($greeting, "220") === false) {
        log_smtp_error("SMTP Greeting failed: $greeting");
        fclose($socket);
        return false;
    }
    
    // EHLO
    fwrite($socket, "EHLO paraschessacademy.com\r\n");
    $ehlo = read_smtp_response($socket);
    
    // AUTH LOGIN
    fwrite($socket, "AUTH LOGIN\r\n");
    $auth = read_smtp_response($socket);
    if (strpos($auth, "334") === false) {
        log_smtp_error("SMTP AUTH LOGIN initiation failed: $auth");
        fclose($socket);
        return false;
    }
    
    // Send Username
    fwrite($socket, base64_encode($from_email) . "\r\n");
    $user_resp = read_smtp_response($socket);
    if (strpos($user_resp, "334") === false) {
        log_smtp_error("SMTP Username rejected: $user_resp");
        fclose($socket);
        return false;
    }
    
    // Send Password
    fwrite($socket, base64_encode($password) . "\r\n");
    $pass_resp = read_smtp_response($socket);
    if (strpos($pass_resp, "235") === false) {
        log_smtp_error("SMTP Password rejected / authentication failed: $pass_resp");
        fclose($socket);
        return false;
    }
    
    // MAIL FROM
    fwrite($socket, "MAIL FROM: <$from_email>\r\n");
    $from_resp = read_smtp_response($socket);
    
    // RCPT TO
    fwrite($socket, "RCPT TO: <$to>\r\n");
    $to_resp = read_smtp_response($socket);
    if (strpos($to_resp, "250") === false && strpos($to_resp, "251") === false) {
        log_smtp_error("SMTP Recipient rejected: $to_resp");
        fclose($socket);
        return false;
    }
    
    // DATA
    fwrite($socket, "DATA\r\n");
    $data_resp = read_smtp_response($socket);
    if (strpos($data_resp, "354") === false) {
        log_smtp_error("SMTP DATA command rejected: $data_resp");
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
    $send_resp = read_smtp_response($socket);
    if (strpos($send_resp, "250") === false) {
        log_smtp_error("SMTP Failed to deliver body payload: $send_resp");
        fclose($socket);
        return false;
    }
    
    // QUIT
    fwrite($socket, "QUIT\r\n");
    read_smtp_response($socket);
    fclose($socket);
    
    return true;
}

if ($_SERVER["REQUEST_METHOD"] === "POST") {
    // Get the JSON data
    $json = file_get_contents("php://input");
    $data = json_decode($json, true);

    $type = isset($data["type"]) ? strip_tags($data["type"]) : "syllabus";
    $email = isset($data["email"]) ? filter_var($data["email"], FILTER_SANITIZE_EMAIL) : "";

    if (empty($email)) {
        http_response_code(400);
        echo json_encode(["status" => "error", "message" => "Recipient email is required."]);
        exit;
    }

    $from = "support@paraschessacademy.com";
    $password = "Paras@2709@";

    if ($type === "booking") {
        // --- 1. DEMO CLASS BOOKING CONFIRMATION EMAIL ---
        $studentName = isset($data["studentName"]) ? strip_tags($data["studentName"]) : "Student";
        $parentName = isset($data["parentName"]) ? strip_tags($data["parentName"]) : "Parent";
        $date = isset($data["date"]) ? strip_tags($data["date"]) : "";
        $slot = isset($data["slot"]) ? strip_tags($data["slot"]) : "";
        $teacherName = isset($data["teacherName"]) ? strip_tags($data["teacherName"]) : "Expert Coach";
        $meetingLink = isset($data["meetingLink"]) ? strip_tags($data["meetingLink"]) : "https://meet.google.com/chess-demo";
        $generatedPassword = isset($data["generatedPassword"]) ? strip_tags($data["generatedPassword"]) : "";

        $subject = "Confirmed: 1-on-1 Chess Demo Class - Paras Chess Academy";
        
        $message = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>
                <div style='text-align: center; margin-bottom: 25px;'>
                    <h2 style='color: #D11A2A; margin: 0;'>🏆 Paras Chess Academy</h2>
                    <p style='color: #16A34A; font-weight: bold; font-size: 18px; margin-top: 5px;'>✓ Demo Booking Confirmed!</p>
                </div>
                
                <p>Dear <strong>$parentName</strong>,</p>
                <p>Your child's (<strong>$studentName</strong>) personalized 1-on-1 Chess Demo Assessment Class has been scheduled successfully. Below are the class details:</p>
                
                <!-- Class Details Card -->
                <div style='background: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0; margin: 20px 0;'>
                    <table style='width: 100%; font-size: 14px;'>
                        <tr>
                            <td style='font-weight: bold; width: 35%; padding: 6px 0;'>Date:</td>
                            <td style='color: #0F172A;'>$date</td>
                        </tr>
                        <tr>
                            <td style='font-weight: bold; padding: 6px 0;'>Time Slot:</td>
                            <td style='color: #0F172A;'>$slot</td>
                        </tr>
                        <tr>
                            <td style='font-weight: bold; padding: 6px 0;'>Assigned Coach:</td>
                            <td style='color: #0F172A;'>Coach $teacherName</td>
                        </tr>
                        <tr>
                            <td style='font-weight: bold; padding: 6px 0;'>Class Link:</td>
                            <td><a href='$meetingLink' style='color: #D11A2A; font-weight: bold;'>Join Google Meet Class</a></td>
                        </tr>
                    </table>
                </div>

                <!-- Portal Credentials Card -->
                <div style='background: #FFFBEB; padding: 20px; border-radius: 8px; border: 1px solid #FDE68A; margin: 20px 0;'>
                    <h4 style='color: #D97706; margin-top: 0; margin-bottom: 10px;'>🔑 Student Portal Credentials</h4>
                    <p style='margin: 0 0 10px 0; font-size: 13px;'>We have created a student portal account for your child. Log in to track progress, access worksheets, and join future sessions.</p>
                    <table style='width: 100%; font-size: 13px;'>
                        <tr>
                            <td style='font-weight: bold; width: 25%;'>Portal URL:</td>
                            <td><a href='https://paraschessacademy.com/login.html' style='color: #D97706;'>paraschessacademy.com/login.html</a></td>
                        </tr>
                        <tr>
                            <td style='font-weight: bold;'>Login Email:</td>
                            <td style='font-family: monospace;'>$email</td>
                        </tr>
                        <tr>
                            <td style='font-weight: bold;'>Password:</td>
                            <td style='font-family: monospace; font-weight: bold; color: #D11A2A;'>$generatedPassword</td>
                        </tr>
                    </table>
                </div>

                <p style='margin-top: 25px;'><strong>Important Class Instructions:</strong></p>
                <ul style='font-size: 13px; padding-left: 20px;'>
                    <li>Please join the Google Meet class using a laptop or tablet for the best board view experience.</li>
                    <li>Ensure your webcam and microphone are working correctly.</li>
                    <li>Join exactly 5 minutes before the scheduled time slot.</li>
                </ul>

                <hr style='border: 0; border-top: 1px solid #eee; margin: 30px 0;'>
                <p style='font-size: 12px; color: #777; text-align: center;'>
                    Our counselor will connect on WhatsApp shortly. For immediate support, email us at <a href='mailto:support@paraschessacademy.com'>support@paraschessacademy.com</a>
                </p>
            </div>
        </body>
        </html>
        ";

        // Send to Candidate
        $mailSent = send_smtp_email($email, $subject, $message, $from, $password);

        // Send Lead alert to Admin
        $adminTo = "paraschessacademy@gmail.com";
        $adminSubject = "New Demo Class Booked by $studentName";
        $adminMessage = "
        <html>
        <body>
            <h2>New 1-on-1 Chess Demo Class Booked</h2>
            <p><strong>Student Name:</strong> $studentName</p>
            <p><strong>Parent Name:</strong> $parentName</p>
            <p><strong>Parent Email:</strong> $email</p>
            <p><strong>Mobile:</strong> " . (isset($data["mobile"]) ? strip_tags($data["mobile"]) : "N/A") . "</p>
            <p><strong>Date & Slot:</strong> $date at $slot</p>
            <p><strong>Assigned Coach:</strong> Coach $teacherName</p>
            <p><strong>Portal Temp Password:</strong> $generatedPassword</p>
        </body>
        </html>
        ";
        send_smtp_email($adminTo, $adminSubject, $adminMessage, $from, $password);

        // Dynamic Syllabus Details in Email Body
        $syllabusDetailsHTML = "";
        $pdfFilename = "syllabus.pdf"; // Default fallback
        
        if (strpos(strtolower($levelName), "begin") !== false) {
            $pdfFilename = "syllabus-beginners.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>♟️ Beginners Chess Program Syllabus</h3>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-bottom: 5px;'>Level 1 – Foundations (2-3 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Introduction to the Chessboard (Squares, files, ranks, diagonals, notations)</li>
                <li>Introduction to Chess Pieces (Names, movements, and values of all pieces)</li>
                <li>Attacking a Piece & Capturing Hanging Pieces</li>
                <li>How to Defend a Piece (Move away, capture, support, or block)</li>
                <li>Introduction to Check & Checkmate (Two Rooks mate)</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 2 – Special Rules & Core Tactics (5-6 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Special Moves (Castling, Pawn Promotion, En Passant)</li>
                <li>Opening Fundamentals (Center control, development, King safety)</li>
                <li>Primary Tactics (Double Attack, Knight Fork, Pin, Skewer)</li>
                <li>Advanced Tactics (Back Rank, Discovered Check, Removing the Defender)</li>
                <li>Draw Rules (Stalemate, agreement, repetition, insufficient material)</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 3 – Practical Play & Etiquette (3 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Active games and detailed post-game analysis</li>
                <li>Identifying tactical opportunities & finding opponent's threats</li>
                <li>Tournament rules, etiquette, and preparation for Intermediate stage</li>
            </ul>";
        } elseif (strpos(strtolower($levelName), "inter") !== false) {
            $pdfFilename = "syllabus-intermediate.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>♟️ Intermediate Chess Program Syllabus</h3>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-bottom: 5px;'>Level 1 – Tactical Vision & Major Openings (6 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Tactical Training (Mate in 2, Mate in 3, Double Attack, Fork, Pin, Skewer Level 2)</li>
                <li>Discovered Check, Discovered Attack, Destroying the Defender Level 1 & 2</li>
                <li>Opening Preparation (Queen's Gambit Accepted & Declined, Sicilian Defence, Caro-Kann, French)</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 2 – Advanced Calculation & Repertoire (6 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Advanced Tactics (Mate in 4 Moves, Double Attack, Fork, Pin, Skewer Level 3)</li>
                <li>Discovered Check & Attack Level 3, Destroying the Defender Level 3</li>
                <li>Opening Preparation (King's Indian Defence, Modern Defence, Pirc Defence, Ruy Lopez)</li>
                <li>Building tournament level tactical calculation skills</li>
            </ul>";
        } elseif (strpos(strtolower($levelName), "advan") !== false) {
            $pdfFilename = "syllabus-advanced.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>♟️ Advanced Chess Program Syllabus</h3>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-bottom: 5px;'>Level 1 – Advanced Strategic & Tactical Concepts (6 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Positional & Strategic calculation to improve calculation and practical play</li>
                <li>Tactical concepts (Overloaded Piece, Line Opening & Closing, Square Vacation, Passed Pawn)</li>
                <li>Zwischenzug, Drawing Combinations, X-Ray Attack, Windmills</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 2 – Advanced Tactics & Attacking (6 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Advanced tactics and elementary checkmates to improve attacking ability</li>
                <li>Elementary Checkmate with Bishop & Knight, Checkmating Patterns</li>
                <li>Art of Combining Pieces, Decoy & Deflection tactics</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 3 – Endgame Fundamentals & FIDE Prep (6 Months)</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Endgame Fundamentals (Concept of Opposition, Rule of the Square, King & Pawn Endings)</li>
                <li>Queen vs Pawn, Knight vs Pawn, Rook vs Pawn, Queen vs Rook, Rook Endings</li>
                <li>Guidance for official FIDE Rated Tournaments, building confidence</li>
            </ul>";
        } else {
            // FIDE Rating or Complete
            $pdfFilename = "syllabus-fide.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>🏆 Personalized FIDE Rating Training Outline</h3>
            <p style='font-size: 14px; color: #475569; font-weight: bold; margin-bottom: 5px;'>Dedicated 1-on-1 Coaching with Higher Rated FIDE Masters</p>
            <p style='font-size: 13px; line-height: 1.5; color: #475569; margin: 0 0 10px 0;'>Our FIDE Rating training is deeply personalized. You are matched with international masters who analyze your game statistics, detect logical blind spots, and curate openings explicitly designed for you.</p>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li><strong>Opening Repertoire:</strong> Custom repertoire matching your cognitive style.</li>
                <li><strong>Middlegame Planning:</strong> Evaluating piece dynamics, planning, and tactical vision.</li>
                <li><strong>Tournament Psychology:</strong> Time management, coping with pressure, speed-clock psychology.</li>
                <li><strong>Endgame Technique:</strong> Flawless conversion of winning advantage positions.</li>
                <li><strong>FIDE Rating Roadmap:</strong> Strategy for official FIDE rated tournaments.</li>
            </ul>";
        }

        $subject = "Your Paras Chess Academy Syllabus - $levelName Program";
        $message = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>
                <div style='text-align: center; margin-bottom: 25px;'>
                    <h2 style='color: #D11A2A; margin: 0;'>🏆 Paras Chess Academy</h2>
                    <p style='font-size: 16px; font-weight: bold; color: #0F172A; margin-top: 5px;'>Hello $name,</p>
                </div>
                <p>Thank you for your interest in <strong>Paras Chess Academy</strong>. As requested, we have prepared and attached the detailed chess curriculum outline for your child below:</p>
                
                <!-- Dynamic Syllabus Content Block -->
                <div style='background: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0; margin: 20px 0;'>
                    $syllabusDetailsHTML
                </div>

                <p style='margin-bottom: 20px; font-size: 14px; text-align: center; font-weight: bold; color: #0F172A;'>Ready to experience our world-class teaching firsthand?</p>
                <div style='text-align: center; margin-bottom: 25px;'>
                    <a href='https://paraschessacademy.com/book.html' style='background: #D11A2A; color: white; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 12px rgba(209, 26, 42, 0.25); display: inline-block; font-size: 15px;'>📅 Book a FREE 1-on-1 Chess Class Now</a>
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

        // Send Syllabus
        $mailSent = send_smtp_email($email, $subject, $message, $from, $password);

        // Send Lead alert to Admin
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
        send_smtp_email($adminTo, $adminSubject, $adminMessage, $from, $password);
    }

    if ($mailSent) {
        echo json_encode(["status" => "success", "message" => "Email dispatched successfully."]);
    } else {
        http_response_code(500);
        echo json_encode(["status" => "error", "message" => "Failed to deliver email via Hostinger SMTP."]);
    }
} else {
    http_response_code(405);
    echo json_encode(["status" => "error", "message" => "Method not allowed."]);
}
?>
