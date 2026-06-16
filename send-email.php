<?php
ignore_user_abort(true);
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
    $smtp_server = "ssl://smtp.hostinger.com";
    $port = 465;
    
    // Connect via secure socket
    $socket = @fsockopen($smtp_server, $port, $errno, $errstr, 15);
    if ($socket) {
        $greeting = read_smtp_response($socket);
        if (strpos($greeting, "220") !== false) {
            // EHLO
            fwrite($socket, "EHLO paraschessacademy.com\r\n");
            $ehlo = read_smtp_response($socket);
            
            // AUTH LOGIN
            fwrite($socket, "AUTH LOGIN\r\n");
            $auth = read_smtp_response($socket);
            if (strpos($auth, "334") !== false) {
                // Send Username
                fwrite($socket, base64_encode($from_email) . "\r\n");
                $user_resp = read_smtp_response($socket);
                if (strpos($user_resp, "334") !== false) {
                    // Send Password
                    fwrite($socket, base64_encode($password) . "\r\n");
                    $pass_resp = read_smtp_response($socket);
                    if (strpos($pass_resp, "235") !== false) {
                        // MAIL FROM
                        fwrite($socket, "MAIL FROM: <$from_email>\r\n");
                        $from_resp = read_smtp_response($socket);
                        
                        // RCPT TO
                        fwrite($socket, "RCPT TO: <$to>\r\n");
                        $to_resp = read_smtp_response($socket);
                        if (strpos($to_resp, "250") !== false || strpos($to_resp, "251") !== false) {
                            // DATA
                            fwrite($socket, "DATA\r\n");
                            $data_resp = read_smtp_response($socket);
                            if (strpos($data_resp, "354") !== false) {
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
                                if (strpos($send_resp, "250") !== false) {
                                    // QUIT
                                    fwrite($socket, "QUIT\r\n");
                                    read_smtp_response($socket);
                                    fclose($socket);
                                    return true;
                                } else {
                                    log_smtp_error("SMTP Failed to deliver body payload: $send_resp");
                                }
                            } else {
                                log_smtp_error("SMTP DATA command rejected: $data_resp");
                            }
                        } else {
                            log_smtp_error("SMTP Recipient rejected: $to_resp");
                        }
                    } else {
                        log_smtp_error("SMTP Password rejected / authentication failed: $pass_resp");
                    }
                } else {
                    log_smtp_error("SMTP Username rejected: $user_resp");
                }
            } else {
                log_smtp_error("SMTP AUTH LOGIN initiation failed: $auth");
            }
        } else {
            log_smtp_error("SMTP Greeting failed: $greeting");
        }
        fclose($socket);
    } else {
        log_smtp_error("SMTP Connection failed: $errstr ($errno)");
    }
    
    // Log fallback and try standard PHP mail() function
    log_smtp_error("SMTP dispatch failed. Trying fallback to PHP mail() function...");
    
    $headers = "MIME-Version: 1.0\n";
    $headers .= "Content-Type: text/html; charset=UTF-8\n";
    $headers .= "From: Paras Chess Academy <" . $from_email . ">\n";
    $headers .= "Reply-To: " . $from_email . "\n";
    $headers .= "X-Mailer: PHP/" . phpversion() . "\n";
    
    $additional_params = "-f" . $from_email;
    return @mail($to, $subject, $body_html, $headers, $additional_params);
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

    if ($type === "update-meet-link") {
        $studentName = isset($data["studentName"]) ? strip_tags($data["studentName"]) : "Student";
        $parentName = isset($data["parentName"]) ? strip_tags($data["parentName"]) : "Parent";
        $date = isset($data["date"]) ? strip_tags($data["date"]) : "";
        $slot = isset($data["slot"]) ? strip_tags($data["slot"]) : "";
        $teacherName = isset($data["teacherName"]) ? strip_tags($data["teacherName"]) : "Expert Coach";
        $meetingLink = isset($data["meetingLink"]) ? strip_tags($data["meetingLink"]) : "";

        $subject = "Live Class Link Updated - Paras Chess Academy";
        
        $message = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>
                <div style='text-align: center; margin-bottom: 25px;'>
                    <h2 style='color: #D11A2A; margin: 0;'>Paras Chess Academy</h2>
                    <p style='color: #3B82F6; font-weight: bold; font-size: 18px; margin-top: 5px;'>Live Class Link Updated!</p>
                </div>
                
                <p>Dear <strong>$parentName</strong>,</p>
                <p>Your child's (<strong>$studentName</strong>) Chess class link has been updated by Coach <strong>$teacherName</strong>. Please use the new link below to join the live session:</p>
                
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
                            <td style='font-weight: bold; padding: 6px 0;'>NEW Classroom Link:</td>
                            <td><a href='$meetingLink' style='color: #3B82F6; font-weight: bold;'>Join Live Class on Google Meet</a></td>
                        </tr>
                    </table>
                </div>
                
                <p style='font-size: 13px; color: #555;'>You can also enter your Live Chess Classroom directly from your <a href='https://demobooking.paraschessacademy.com/login.html' style='color: #D11A2A; font-weight: bold;'>Candidate Dashboard</a> to access homework, worksheets, and future sessions.</p>

                <hr style='border: 0; border-top: 1px solid #eee; margin: 30px 0;'>
                <p style='font-size: 12px; color: #777; text-align: center;'>
                    For immediate assistance, please reply to this email or contact support at <a href='mailto:support@paraschessacademy.com'>support@paraschessacademy.com</a>
                </p>
            </div>
        </body>
        </html>
        ";

        $mailSent = send_smtp_email($email, $subject, $message, $from, $password);
        if ($mailSent) {
            echo json_encode(["status" => "success", "message" => "Update email sent successfully."]);
        } else {
            http_response_code(500);
            echo json_encode(["status" => "error", "message" => "Failed to send update email."]);
        }
        exit;
    }

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
                    <h2 style='color: #D11A2A; margin: 0;'>Paras Chess Academy</h2>
                    <p style='color: #16A34A; font-weight: bold; font-size: 18px; margin-top: 5px;'>Demo Booking Confirmed!</p>
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
                    <h4 style='color: #D97706; margin-top: 0; margin-bottom: 10px;'>Student Portal Credentials</h4>
                    <p style='margin: 0 0 10px 0; font-size: 13px;'>We have created a student portal account for your child. Log in to track progress, access worksheets, and join future sessions.</p>
                    <table style='width: 100%; font-size: 13px;'>
                        <tr>
                            <td style='font-weight: bold; width: 25%;'>Portal URL:</td>
                            <td><a href='https://demobooking.paraschessacademy.com/login.html' style='color: #D97706;'>demobooking.paraschessacademy.com/login.html</a></td>
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
    }

    if ($type === "syllabus") {
        $name = isset($data["name"]) ? strip_tags($data["name"]) : "Parent";
        $age = isset($data["age"]) ? strip_tags($data["age"]) : "";
        $phone = isset($data["phone"]) ? strip_tags($data["phone"]) : "";
        $levelName = isset($data["levelName"]) ? strip_tags($data["levelName"]) : "Complete";

        // Dynamic Syllabus Details in Email Body
        $syllabusDetailsHTML = "";
        $pdfFilename = "syllabus.pdf"; // Default fallback
        
        if (strpos(strtolower($levelName), "begin") !== false) {
            $pdfFilename = "syllabus-beginners.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>Beginners Chess Program Syllabus</h3>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-bottom: 5px;'>Level 1 – Beginners Level 1 (2-3 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>Learn the fundamentals of the chessboard, pieces, movements, defense techniques, check, and introductory checkmates.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Introduction to the Chessboard</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Number of Squares</li>
                <li>Names of Squares</li>
                <li>Files and Ranks</li>
                <li>Diagonals</li>
                <li>Light & Dark Squares</li>
                <li>Understanding Notations</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🔹 Introduction to Chess Pieces</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Names of Pieces</li>
                <li>Value of Pieces</li>
                <li>Movements of Pieces</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🔹 Basic Strategy & Tactics</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Attacking a Piece</li>
                <li>Capturing Hanging Pieces</li>
                <li>How to Defend a Piece (Defense by moving away, capturing, supporting, or blocking)</li>
                <li>Good Exchange and Bad Exchange</li>
                <li>Check: Creating a Check</li>
                <li>Getting Out of Check (Defense by moving away, capturing, or blocking)</li>
                <li>Introduction to Checkmate (Difference Between Check and Checkmate)</li>
                <li>Checkmate with Two Rooks</li>
                <li>Introduction to Chess Notation</li>
                <li>Basic Puzzle Solving</li>
            </ul>

            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 2 – Beginners Level 2 (5-6 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>Develop core tactical concepts, special moves, opening fundamentals, elementary checkmates, draw rules, and chess clock mechanics.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Special Moves & Rules</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Castling</li>
                <li>Pawn Promotion</li>
                <li>En Passant</li>
                <li>Difference Between Pawn Promotion and Underpromotion</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🔹 Opening Fundamentals</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Control of the Center</li>
                <li>Development of Pieces</li>
                <li>King Safety</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🔹 Chess Tactics & Endgames</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Basic Checkmate in One Move</li>
                <li>Double Attack</li>
                <li>Knight Fork</li>
                <li>Pin</li>
                <li>Back Rank Checkmate</li>
                <li>Skewer</li>
                <li>Discovered Check</li>
                <li>Discovered Attack</li>
                <li>Introduction to Removing the Defender</li>
                <li>Italian Game Opening</li>
                <li>Checkmate with One Queen and One King</li>
                <li>Checkmate with One Rook and One King</li>
                <li>Draw by Stalemate</li>
                <li>Draw by Agreement</li>
                <li>Draw by Threefold Repetition</li>
                <li>Draw by Insufficient Material</li>
                <li>Draw by Insufficient Material vs Time Flag</li>
                <li>Introduction to Chess Clock Usage (Applicable only for Offline Classes)</li>
                <li>Solving Tactical Puzzles</li>
            </ul>

            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 3 – Beginners Level 3 (3 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>Apply learned tactics and rules in active play, analyze games, detect threats, correct opening mistakes, and prepare for tournament environments.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Games & Practical Application</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Games and Game Analysis</li>
                <li>Correction of Understanding and Application of Concepts in Practical Games</li>
                <li>Practical Application of Concepts in Games (Double Attack, Knight Fork, Pin, Back Rank, Skewer, Discovered Check/Attack, Italian Game, Two Rooks mate, Queen/Rook mates, Draws)</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🔹 Pre-Tournament & Opening Corrections</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Identifying Tactical Opportunities in Games</li>
                <li>Finding Opponent’s Threats</li>
                <li>Basic Opening Mistakes and Corrections</li>
                <li>Playing Practice Games and Correcting Mistakes</li>
                <li>Introduction to Tournament Rules and Etiquette</li>
                <li>Preparation Before Starting the Intermediate Syllabus</li>
            </ul>";
        } elseif (strpos(strtolower($levelName), "inter") !== false) {
            $pdfFilename = "syllabus-intermediate.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>Intermediate Chess Program Syllabus</h3>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-bottom: 5px;'>Level 1 – Intermediate Level 1 (48 Sessions / 6 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>This level focuses on improving tactical vision, calculation ability, and opening understanding required for tournament play.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Tactical Training</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Mate in 2</li>
                <li>Mate in 3</li>
                <li>Double Attack – Level 2</li>
                <li>Knight Fork – Level 2</li>
                <li>Pin – Level 2</li>
                <li>Back Rank – Level 2</li>
                <li>Skewer – Level 2</li>
                <li>Discovered Check – Level 2</li>
                <li>Discovered Attack – Level 2</li>
                <li>Destroying the Defender – Level 1 & 2</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🔹 Opening Preparation</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Queen’s Gambit (Accepted & Declined)</li>
                <li>Sicilian Defence (Including Anti-Sicilians)</li>
                <li>Caro-Kann Defence</li>
                <li>French Defence</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 2 – Intermediate Level 2 (48 Sessions / 6 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>This module develops advanced tactical calculation and deeper opening understanding for competitive tournament games.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Advanced Tactical Training</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Mate in 4 Moves</li>
                <li>Double Attack – Level 3</li>
                <li>Knight Fork – Level 3</li>
                <li>Pin – Level 3</li>
                <li>Back Rank – Level 3</li>
                <li>Skewer – Level 3</li>
                <li>Discovered Check – Level 3</li>
                <li>Discovered Attack – Level 3</li>
                <li>Destroying the Defender – Level 3</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🔹 Opening Preparation</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>King’s Indian Defence</li>
                <li>Modern Defence</li>
                <li>Pirc Defence</li>
                <li>Ruy Lopez</li>
            </ul>
            <p style='font-size: 13px; font-weight: bold; margin-top: 15px;'>🏆 Goal: To prepare students for competitive tournament chess with strong tactical understanding, calculation skills, and opening preparation.</p>";
        } elseif (strpos(strtolower($levelName), "advan") !== false) {
            $pdfFilename = "syllabus-advanced.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>Advanced Chess Program Syllabus</h3>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-bottom: 5px;'>Level 1 – Advanced (48 Sessions / 6 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>This module focuses on advanced strategic and tactical concepts to improve calculation, positional understanding, and practical play.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Advanced Strategic & Tactical Concepts</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Overloaded Piece</li>
                <li>Line Opening & Closing</li>
                <li>Square Vacation</li>
                <li>Passed Pawn</li>
                <li>Zwischenzug</li>
                <li>Drawing Combinations</li>
                <li>X-Ray Attack</li>
                <li>Windmills</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 2 – Advanced (48 Sessions / 6 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>This module focuses on advanced tactics and elementary checkmates to improve attacking and calculation abilities.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Advanced Tactical Concepts</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Elementary Checkmate with Bishop & Knight</li>
                <li>Checkmating Patterns</li>
                <li>Introduction to Chess Tactics</li>
                <li>Art of Combining Pieces</li>
                <li>Decoy</li>
                <li>Deflection</li>
            </ul>
            <p style='font-size: 14px; font-weight: bold; color: #D11A2A; margin-top: 15px; margin-bottom: 5px;'>Level 3 – Advanced Chess Players (48 Sessions / 6 Months)</p>
            <p style='font-size: 13px; color: #555; margin-bottom: 8px;'>In this module, students will be introduced to the world of chess endings and learn important practical endgame concepts every serious player must know.</p>
            <strong style='font-size: 13px; display: block; margin-bottom: 5px;'>🔹 Endgame Fundamentals</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>The Concept of Opposition</li>
                <li>Rule of the Square</li>
                <li>King & Pawn Endings</li>
                <li>Queen vs Pawn</li>
                <li>Knight vs Pawn</li>
                <li>Rook vs Pawn</li>
                <li>Queen vs Rook</li>
                <li>Fundamentals of Rook Endings</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🏅 Tournament Preparation</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Guidance for Official FIDE Rated Tournaments</li>
                <li>Building Tournament Confidence</li>
                <li>Improving Practical Endgame Skills</li>
            </ul>
            <p style='font-size: 13px; font-weight: bold; margin-top: 15px;'>🏆 Goal: To develop strong tournament players capable of competing at higher competitive levels.</p>";
        } else {
            // FIDE Rating or Complete
            $pdfFilename = "syllabus-fide.pdf";
            $syllabusDetailsHTML = "
            <h3 style='margin-top: 0; color: #0F172A;'>Personalized FIDE Rating Training Outline</h3>
            <p style='font-size: 13px; line-height: 1.5; color: #475569; margin: 0 0 10px 0;'>This program is specially designed for students who are already FIDE Rated or students who have completed our Advanced Level Program and are preparing to enter FIDE Rated tournaments. In this program, students receive personalized 1-on-1 coaching sessions with higher-rated trainers to help them improve their tournament performance and increase their FIDE Rating.</p>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🌟 Training is Completely Personalized</strong>
            <p style='font-size: 13px; color: #555; margin: 0 0 10px 0;'>The topics and training plan depend entirely on the student’s weaknesses and practical game performance.</p>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>📌 Areas Covered May Include:</strong>
            <ul style='font-size: 13px; padding-left: 20px; margin-top: 0;'>
                <li>Opening Preparation</li>
                <li>Middlegame Planning</li>
                <li>Tactical Calculation</li>
                <li>Positional Understanding</li>
                <li>Endgame Technique</li>
                <li>Time Management</li>
                <li>Tournament Psychology</li>
                <li>Game Analysis & Mistake Correction</li>
                <li>FIDE Tournament Preparation</li>
            </ul>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>🎯 Main Goal:</strong>
            <p style='font-size: 13px; color: #555; margin: 0 0 10px 0;'>To help students perform better in FIDE Rated tournaments and steadily improve their FIDE Rating through structured guidance and personal attention.</p>
            <strong style='font-size: 13px; display: block; margin-top: 10px; margin-bottom: 5px;'>👨‍🏫 1-on-1 Training with Experienced Higher Rated Coaches</strong>
            <strong style='font-size: 13px; display: block; margin-top: 5px; margin-bottom: 10px;'>📈 Customized Improvement Plan for Every Student</strong>";
        }

        $subject = "Your Paras Chess Academy Syllabus - $levelName Program";
        $message = "
        <html>
        <body style='font-family: Arial, sans-serif; line-height: 1.6; color: #333;'>
            <div style='max-width: 600px; margin: 0 auto; padding: 25px; border: 1px solid #ddd; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);'>
                <div style='text-align: center; margin-bottom: 25px;'>
                    <h2 style='color: #D11A2A; margin: 0;'>Paras Chess Academy</h2>
                    <p style='font-size: 16px; font-weight: bold; color: #0F172A; margin-top: 5px;'>Hello $name,</p>
                </div>
                <p>Thank you for your interest in <strong>Paras Chess Academy</strong>. As requested, we have prepared and attached the detailed chess curriculum outline for your child below:</p>
                
                <!-- Dynamic Syllabus Content Block -->
                <div style='background: #F8FAFC; padding: 20px; border-radius: 8px; border: 1px solid #E2E8F0; margin: 20px 0;'>
                    $syllabusDetailsHTML
                </div>

                <p style='margin-bottom: 20px; font-size: 14px; text-align: center; font-weight: bold; color: #0F172A;'>Ready to experience our world-class teaching firsthand?</p>
                <div style='text-align: center; margin-bottom: 25px;'>
                    <a href='https://demobooking.paraschessacademy.com/' style='background: #D11A2A; color: white; padding: 14px 30px; text-decoration: none; font-weight: bold; border-radius: 8px; box-shadow: 0 4px 12px rgba(209, 26, 42, 0.25); display: inline-block; font-size: 15px;'>Book a FREE 1-on-1 Chess Class Now</a>
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
