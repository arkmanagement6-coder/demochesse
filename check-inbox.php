<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

header("Content-Type: text/html; charset=UTF-8");

echo "<html><head><title>Hostinger Inbox Checker</title></head><body style='font-family:Arial,sans-serif; margin:40px;'>";
echo "<h2>Inbox Checker for support@paraschessacademy.com</h2>";

$username = "support@paraschessacademy.com";
$password = "Paras@2709@";
$host = "{imap.hostinger.com:993/imap/ssl}INBOX";

if (!function_exists('imap_open')) {
    echo "<p style='color:red;'>PHP IMAP extension is not enabled on this server. Trying socket fallback...</p>";
    
    // Socket IMAP check fallback
    $socket = @fsockopen("ssl://imap.hostinger.com", 993, $errno, $errstr, 15);
    if (!$socket) {
        echo "<p style='color:red;'>IMAP Socket connection failed: $errstr ($errno)</p>";
    } else {
        echo "<p style='color:green;'>IMAP Socket connection succeeded!</p>";
        
        function read_imap_resp($socket) {
            $resp = "";
            while ($str = fgets($socket, 515)) {
                $resp .= $str;
                if (strpos($str, "OK") !== false || strpos($str, "BAD") !== false || strpos($str, "NO") !== false) {
                    break;
                }
            }
            return $resp;
        }
        
        echo "<pre>";
        echo "S: " . htmlspecialchars(fgets($socket, 515)) . "\n";
        
        // Login
        fwrite($socket, "A1 LOGIN " . $username . " " . $password . "\r\n");
        echo "C: A1 LOGIN " . $username . " ********\n";
        $login_resp = read_imap_resp($socket);
        echo "S: " . htmlspecialchars($login_resp) . "\n";
        
        if (strpos($login_resp, "A1 OK") !== false) {
            // Select INBOX
            fwrite($socket, "A2 SELECT INBOX\r\n");
            echo "C: A2 SELECT INBOX\n";
            $select_resp = read_imap_resp($socket);
            echo "S: " . htmlspecialchars($select_resp) . "\n";
            
            // Search all messages
            fwrite($socket, "A3 SEARCH ALL\r\n");
            echo "C: A3 SEARCH ALL\n";
            $search_resp = read_imap_resp($socket);
            echo "S: " . htmlspecialchars($search_resp) . "\n";
            
            // Fetch headers of the last few messages
            // Let's parse message numbers from search response
            if (preg_match('/\* SEARCH (.+)/', $search_resp, $matches)) {
                $ids = explode(" ", trim($matches[1]));
                $last_ids = array_slice($ids, -5); // last 5 messages
                foreach ($last_ids as $id) {
                    if (empty($id)) continue;
                    fwrite($socket, "A4 FETCH $id (BODY[HEADER.FIELDS (SUBJECT FROM DATE)])\r\n");
                    echo "C: A4 FETCH $id headers\n";
                    $fetch_resp = "";
                    while ($str = fgets($socket, 515)) {
                        $fetch_resp .= $str;
                        if (strpos($str, "A4 OK") !== false) break;
                    }
                    echo "S: " . htmlspecialchars($fetch_resp) . "\n";
                }
            }
        }
        
        fwrite($socket, "A5 LOGOUT\r\n");
        fclose($socket);
        echo "</pre>";
    }
} else {
    echo "<p style='color:green;'>PHP IMAP extension is available! Connecting...</p>";
    $mbox = @imap_open($host, $username, $password);
    if (!$mbox) {
        echo "<p style='color:red;'>IMAP Connection Failed: " . imap_last_error() . "</p>";
    } else {
        echo "<p style='color:green;'>IMAP Connection Succeeded!</p>";
        $num_msgs = imap_num_msg($mbox);
        echo "<p>Total messages in inbox: <strong>$num_msgs</strong></p>";
        
        if ($num_msgs > 0) {
            echo "<table border='1' cellpadding='8' style='border-collapse:collapse;'>";
            echo "<tr style='background:#f4f4f4;'><th>ID</th><th>Date</th><th>From</th><th>Subject</th></tr>";
            
            $start = max(1, $num_msgs - 9); // Show last 10 messages
            for ($i = $num_msgs; $i >= $start; $i--) {
                $header = imap_headerinfo($mbox, $i);
                $from = isset($header->fromaddress) ? htmlspecialchars($header->fromaddress) : "Unknown";
                $subject = isset($header->subject) ? htmlspecialchars($header->subject) : "No Subject";
                $date = isset($header->date) ? htmlspecialchars($header->date) : "Unknown";
                
                echo "<tr>";
                echo "<td>$i</td>";
                echo "<td>$date</td>";
                echo "<td>$from</td>";
                echo "<td>$subject</td>";
                echo "</tr>";
            }
            echo "</table>";
        } else {
            echo "<p>Inbox is empty.</p>";
        }
        imap_close($mbox);
    }
}

echo "</body></html>";
?>
