<?php
// Environment-aware Database Connection File
// Supports both MySQL (Local XAMPP / Cloud) and PostgreSQL (Supabase)

$db_type = getenv('DB_TYPE') ?: 'mysql';
$db_host = getenv('DB_HOST') ?: 'localhost';
$db_user = getenv('DB_USER') ?: 'root';
$db_pass = getenv('DB_PASS') !== false ? getenv('DB_PASS') : (getenv('DB_PASSWORD') !== false ? getenv('DB_PASSWORD') : '');
$db_name = getenv('DB_NAME') ?: 'project1';
$db_port = getenv('DB_PORT') ?: ($db_type === 'pgsql' || $db_type === 'postgres' ? '5432' : '3306');

if ($db_type === 'pgsql' || $db_type === 'postgres' || $db_port == '5432') {
    // Supabase PostgreSQL Connection via PDO
    try {
        $dsn = "pgsql:host=$db_host;port=$db_port;dbname=$db_name;options='--client_encoding=UTF8'";
        $pdo = new PDO($dsn, $db_user, $db_pass, [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
        ]);
        $con = $pdo;
    } catch (PDOException $e) {
        die("Could not connect to Supabase PostgreSQL: " . $e->getMessage());
    }
} else {
    // MySQL Connection (Local XAMPP / Standard MySQL)
    $con = new mysqli($db_host, $db_user, $db_pass, $db_name, (int)$db_port);
    if ($con->connect_error) {
        die("Could not connect to MySQL: " . $con->connect_error);
    }
}

// Define custom db functions for both MySQL and PostgreSQL/PDO
function db_query($con, $query) {
    global $db_type;
    if ($db_type === 'pgsql' || $db_type === 'postgres' || $con instanceof PDO) {
        try {
            // Rewrite reserved keywords in PostgreSQL queries (user and rank tables)
            $query = preg_replace('/\b(user|rank)\b/i', '"$1"', $query);
            $stmt = $con->prepare($query);
            $stmt->execute();
            return $stmt;
        } catch (PDOException $e) {
            return false;
        }
    } else {
        return mysqli_query($con, $query);
    }
}

function db_fetch_array($result) {
    if ($result instanceof PDOStatement) {
        return $result->fetch(PDO::FETCH_BOTH);
    } elseif (is_object($result) || is_resource($result)) {
        return mysqli_fetch_array($result);
    }
    return false;
}

function db_num_rows($result) {
    if ($result instanceof PDOStatement) {
        return $result->rowCount();
    } elseif (is_object($result) || is_resource($result)) {
        return mysqli_num_rows($result);
    }
    return 0;
}

function db_error($con) {
    if ($con instanceof PDO) {
        $error = $con->errorInfo();
        return $error[2] ?? '';
    } else {
        return mysqli_error($con);
    }
}
?>