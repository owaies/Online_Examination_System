<?php
// Vercel Serverless PHP Router
// Proxy requests to root level PHP files

$uri = $_SERVER['REQUEST_URI'];
$path = parse_url($uri, PHP_URL_PATH);

// Clean path
if ($path === '/' || $path === '') {
    $file = 'index.php';
} else {
    $file = ltrim($path, '/');
    if (substr($file, -4) !== '.php') {
        $file .= '.php';
    }
}

$target = dirname(__DIR__) . '/' . $file;

if (file_exists($target)) {
    // Set cwd to root directory so includes/requires resolve correctly
    chdir(dirname(__DIR__));
    require $target;
} else {
    // Fallback to index.php
    chdir(dirname(__DIR__));
    require dirname(__DIR__) . '/index.php';
}
?>
