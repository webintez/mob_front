<?php
// Secure image proxy and cache for seller.mobitez.com images
// Caches images locally with a 1-year Cache-Control header.

$path = $_GET['path'] ?? '';

if (empty($path)) {
    header("HTTP/1.1 400 Bad Request");
    echo "Bad Request: Missing path.";
    exit;
}

// 1. Sanitize the path to completely prevent directory traversal
$segments = explode('/', $path);
$clean_segments = [];
foreach ($segments as $segment) {
    if ($segment === '' || $segment === '.' || $segment === '..') {
        continue;
    }
    // Only allow safe characters in directory and filenames
    $clean_segments[] = preg_replace('/[^a-zA-Z0-9_\-\.]/', '', $segment);
}
$safe_path = implode('/', $clean_segments);

$sandboxDir = __DIR__ . '/tmp/storage_cache';
$targetFile = $sandboxDir . '/' . $safe_path;

// 2. Map file extension to MIME type
$ext = strtolower(pathinfo($targetFile, PATHINFO_EXTENSION));
$mime_types = [
    'png'  => 'image/png',
    'jpg'  => 'image/jpeg',
    'jpeg' => 'image/jpeg',
    'gif'  => 'image/gif',
    'webp' => 'image/webp',
    'svg'  => 'image/svg+xml',
    'ico'  => 'image/x-icon'
];
$mime_type = $mime_types[$ext] ?? 'application/octet-stream';

// 3. Serve from local cache if it exists
if (file_exists($targetFile)) {
    header("Content-Type: " . $mime_type);
    header("Cache-Control: public, max-age=31536000, immutable");
    header("Expires: " . gmdate('D, d M Y H:i:s \G\M\T', time() + 31536000));
    readfile($targetFile);
    exit;
}

// 4. Fetch the image from the source seller.mobitez.com if not cached
// Check if path is under uploads/ or storage/
if (strpos($safe_path, 'uploads/') === 0) {
    $sourceUrl = "https://seller.mobitez.com/" . $safe_path;
} else {
    $sourceUrl = "https://seller.mobitez.com/storage/" . $safe_path;
}

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $sourceUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_MAXREDIRS, 3);
curl_setopt($ch, CURLOPT_TIMEOUT, 10);
curl_setopt($ch, CURLOPT_USERAGENT, 'MobitezImageProxy/1.0');

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode === 200 && !empty($response)) {
    // Ensure parent directory exists
    $parentDir = dirname($targetFile);
    if (!is_dir($parentDir)) {
        mkdir($parentDir, 0755, true);
    }
    
    // Save to cache
    file_put_contents($targetFile, $response);
    
    // Serve the image
    header("Content-Type: " . $mime_type);
    header("Cache-Control: public, max-age=31536000, immutable");
    header("Expires: " . gmdate('D, d M Y H:i:s \G\M\T', time() + 31536000));
    echo $response;
    exit;
} else {
    header("HTTP/1.1 404 Not Found");
    echo "Image not found.";
    exit;
}
?>
