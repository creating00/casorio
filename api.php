<?php
header('Content-Type: application/json; charset=utf-8');
@ini_set('display_errors', '0');

function send_json($statusCode, $payload) {
    http_response_code($statusCode);
    echo json_encode($payload);
    exit;
}

set_error_handler(function ($severity, $message) {
    send_json(500, array(
        'ok' => false,
        'error' => 'Error interno de PHP: ' . $message,
    ));
});

set_exception_handler(function ($e) {
    send_json(500, array(
        'ok' => false,
        'error' => 'Excepcion en servidor: ' . $e->getMessage(),
    ));
});

$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
$maxFileSize = 8 * 1024 * 1024;
$allowedMimeToExt = array(
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
);

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        send_json(500, array('ok' => false, 'error' => 'No se pudo crear carpeta uploads'));
    }
}

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

if ($method === 'GET') {
    $images = array();
    $pattern = $uploadDir . DIRECTORY_SEPARATOR . '*.{jpg,jpeg,png,webp,gif}';
    $files = glob($pattern, GLOB_BRACE);

    if ($files !== false) {
        usort($files, function ($a, $b) {
            return filemtime($a) - filemtime($b);
        });

        foreach ($files as $filePath) {
            $fileName = basename($filePath);
            $mtime = (string) filemtime($filePath);
            $images[] = 'uploads/' . rawurlencode($fileName) . '?v=' . rawurlencode($mtime);
        }
    }

    send_json(200, array('ok' => true, 'images' => $images));
}

if ($method !== 'POST') {
    send_json(405, array('ok' => false, 'error' => 'Metodo no permitido'));
}

if (!isset($_FILES['photos'])) {
    send_json(400, array('ok' => false, 'error' => 'No se recibieron archivos'));
}

$tmpNames = isset($_FILES['photos']['tmp_name']) ? $_FILES['photos']['tmp_name'] : array();
$errors = isset($_FILES['photos']['error']) ? $_FILES['photos']['error'] : array();
$sizes = isset($_FILES['photos']['size']) ? $_FILES['photos']['size'] : array();

if (!is_array($tmpNames)) {
    $tmpNames = array($tmpNames);
    $errors = array($errors);
    $sizes = array($sizes);
}

$finfo = function_exists('finfo_open') ? finfo_open(FILEINFO_MIME_TYPE) : false;
if ($finfo === false) {
    send_json(500, array('ok' => false, 'error' => 'La extension fileinfo no esta disponible en el servidor'));
}

$saved = 0;

foreach ($tmpNames as $index => $tmpPath) {
    $error = isset($errors[$index]) ? (int) $errors[$index] : UPLOAD_ERR_NO_FILE;
    $size = isset($sizes[$index]) ? (int) $sizes[$index] : 0;

    if ($error !== UPLOAD_ERR_OK) {
        continue;
    }

    if ($size <= 0 || $size > $maxFileSize) {
        continue;
    }

    $mimeType = finfo_file($finfo, $tmpPath);
    if (!$mimeType || !isset($allowedMimeToExt[$mimeType])) {
        continue;
    }

    $extension = $allowedMimeToExt[$mimeType];
    $randomPart = function_exists('random_bytes') ? bin2hex(random_bytes(8)) : md5(uniqid((string) mt_rand(), true));
    $fileName = date('Ymd_His') . '_' . substr($randomPart, 0, 16) . '.' . $extension;
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (move_uploaded_file($tmpPath, $destination)) {
        $saved++;
    }
}

finfo_close($finfo);

if ($saved === 0) {
    send_json(400, array(
        'ok' => false,
        'error' => 'No se guardo ninguna imagen valida. Formatos permitidos: JPG, PNG, WEBP, GIF. Maximo 8MB por archivo.',
    ));
}

send_json(200, array('ok' => true, 'saved' => $saved));

