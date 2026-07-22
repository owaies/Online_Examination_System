<?php
//all the variables defined here are accessible in all the files that include this one
// Supabase PostgreSQL Connection DSN setup
$host = getenv('SUPABASE_DB_HOST') ?: 'aws-0-eu-central-1.pooler.supabase.com';
$port = getenv('SUPABASE_DB_PORT') ?: '6543';
$dbname = getenv('SUPABASE_DB_NAME') ?: 'postgres';
$user = getenv('SUPABASE_DB_USER') ?: 'postgres.xxxx';
$password = getenv('SUPABASE_DB_PASSWORD') ?: 'YOUR_SUPABASE_PASSWORD';

$dsn = "pgsql:host=$host;port=$port;dbname=$dbname";

try {
    // $con is used as the PDO instance across the app
    $con = new PDO($dsn, $user, $password, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
} catch (PDOException $e) {
    die("Could not connect to PostgreSQL database: " . $e->getMessage());
}
?>