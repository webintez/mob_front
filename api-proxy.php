<?php
// Robust PHP Proxy for Mobitez API
// Forwards requests directly to the seller API, bypassing the Node.js server.
// It injects the X-API-Key securely and supports CORS.

$request_method = $_SERVER['REQUEST_METHOD'];
$path = ltrim($_GET['path'] ?? '', '/');
$query_string = $_SERVER['QUERY_STRING'];

// Clean up path from QUERY_STRING if it was added by .htaccess
$query_parts = [];
parse_str($query_string, $query_parts);
unset($query_parts['path']);
$clean_query = http_build_query($query_parts);

// Handle preflight OPTIONS request locally
if ($request_method === 'OPTIONS') {
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    http_response_code(200);
    exit;
}

// Handle specific mocked APIs
if ($request_method === 'GET') {
    if ($path === 'videos' || $path === 'api/videos') {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        echo json_encode([
            "success" => true,
            "data" => [
                [
                    "id" => 1,
                    "title" => "Galaxy S24 Ultra Review",
                    "thumbnail_url" => "https://images.unsplash.com/photo-1610945415295-d9baf060e871?auto=format&fit=crop&w=400&h=700",
                    "video_url" => "https://www.youtube.com/shorts/dQw4w9WgXcQ"
                ],
                [
                    "id" => 2,
                    "title" => "iPhone 15 Pro Max Hands-on",
                    "thumbnail_url" => "https://images.unsplash.com/photo-1510557880182-3d4d3cba35a5?auto=format&fit=crop&w=400&h=700",
                    "video_url" => "https://www.youtube.com/shorts/dQw4w9WgXcQ"
                ],
                [
                    "id" => 3,
                    "title" => "Nothing Phone (2) aesthetic",
                    "thumbnail_url" => "https://images.unsplash.com/photo-1533228100845-08145b01de14?auto=format&fit=crop&w=400&h=700",
                    "video_url" => "https://www.youtube.com/shorts/dQw4w9WgXcQ"
                ]
            ]
        ]);
        exit;
    }
    
    if ($path === 'pages/footer-content' || $path === 'api/pages/footer-content') {
        header('Access-Control-Allow-Origin: *');
        header('Content-Type: application/json');
        echo json_encode([
            "success" => true,
            "data" => [
                "content" => '
                    <div class="seo-narrative-block">
                        <h1 class="seo-narrative-header">Mobitez: The Ultimate Destination for Tech Enthusiasts</h1>
                        <p class="seo-narrative-text">Welcome to Mobitez, your one-stop shop for the latest in mobile technology. We pride ourselves on offering a wide selection of smartphones, tablets, and accessories from the world\'s leading brands.</p>
                        <h2 class="seo-narrative-header">Why Choose Us?</h2>
                        <p class="seo-narrative-text">With over a decade of experience in the mobile industry, we understand what our customers need: quality products, competitive prices, and exceptional service.</p>
                    </div>'
            ]
        ]);
        exit;
    }
}

$url = "https://seller.mobitez.webintez.com/api/" . $path;
if (!empty($clean_query)) {
    $url .= "?" . $clean_query;
}

// ---- CACHE MECHANISM FOR HEAVY ENDPOINTS ----
$cache_file = __DIR__ . '/tmp/categories_index_cache.json';
// Use str_contains to be safe with varying path rewrites
$use_cache = str_contains($path, 'categories/index');

if ($use_cache) {
    if (file_exists($cache_file) && (time() - filemtime($cache_file) < 3600)) { // 1 hour
        header("Content-Type: application/json; charset=UTF-8");
        header('Access-Control-Allow-Origin: *');
        echo file_get_contents($cache_file);
        exit;
    }
}
// ---------------------------------------------

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $request_method);
// Tell cURL to decode all supported encodings (gzip, deflate, etc) automatically
curl_setopt($ch, CURLOPT_ENCODING, "");

// Determine the headers based on the request
$headers = [];
$content_type_set = false;

// fallback function if getallheaders is missing in this PHP environment
if (!function_exists('getallheaders')) {
    function getallheaders() {
        $headers = [];
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == 'HTTP_') {
                $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value;
            } else if ($name == "CONTENT_TYPE") {
                $headers["Content-Type"] = $value;
            } else if ($name == "CONTENT_LENGTH") {
                $headers["Content-Length"] = $value;
            }
        }
        return $headers;
    }
}

// Forward appropriate incoming headers to the destination API
foreach (getallheaders() as $key => $value) {
    $lower_key = strtolower($key);
    // Exclude host, content-length, accept-encoding (cURL handles this), and any spoofed x-api-key
    if (!in_array($lower_key, ['host', 'content-length', 'accept-encoding', 'x-api-key'])) {
        $headers[] = "$key: $value";
        if ($lower_key === 'content-type') {
            $content_type_set = true;
        }
    }
}

// ADD THE SECRET API KEY HERE FOR SECURITY
$headers[] = "X-API-Key: mHRT3jvUD7tqSVy+iPIn3DE+wyuJXcBeLaPIjBGVHMo=";

// Ensure JSON Content-Type if not set for POST/PUT requests
if (!$content_type_set && in_array($request_method, ['POST', 'PUT', 'PATCH'])) {
    $headers[] = "Content-Type: application/json";
}

curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

// Pass request body for non-GET/HEAD methods
if ($request_method != 'GET' && $request_method != 'HEAD') {
    $body = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

// Get the response
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);

if (curl_errno($ch)) {
    header("HTTP/1.1 500 Internal Server Error");
    header("Content-Type: application/json");
    echo json_encode(["success" => false, "message" => "Proxy Error: " . curl_error($ch)]);
} else {
    // Forward the original Content-Type
    if ($contentType) {
        header("Content-Type: " . $contentType);
    } else {
        header("Content-Type: application/json");
    }
    
    // Some headers from seller API might be CORS restrictive;
    // ensure the browser accepts the proxy's response.
    header('Access-Control-Allow-Origin: *');
    header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type, X-API-Key, Authorization');
    
    http_response_code($httpCode);
    
    // Save to cache for next loads
    if ($use_cache && $httpCode === 200 && !empty($response)) {
        if (!is_dir(__DIR__ . '/tmp')) {
            mkdir(__DIR__ . '/tmp', 0755, true);
        }
        file_put_contents($cache_file, $response);
    }

    // Output the decoded response (cURL decoded it for us)
    echo $response;
}

curl_close($ch);
?>
