<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');

$uploadDir = __DIR__ . DIRECTORY_SEPARATOR . 'uploads';
$maxFileSize = 8 * 1024 * 1024;
$allowedMimeToExt = [
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
];

if (!is_dir($uploadDir) && !mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo crear carpeta uploads']);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $images = [];

    $files = glob($uploadDir . DIRECTORY_SEPARATOR . '*.{jpg,jpeg,png,webp,gif}', GLOB_BRACE);
    if ($files !== false) {
        usort($files, static fn(string $a, string $b): int => filemtime($a) <=> filemtime($b));

        foreach ($files as $filePath) {
            $fileName = basename($filePath);
            $mtime = (string) filemtime($filePath);
            $images[] = 'uploads/' . rawurlencode($fileName) . '?v=' . rawurlencode($mtime);
        }
    }

    echo json_encode(['ok' => true, 'images' => $images]);
    exit;
}

if ($method !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'Metodo no permitido']);
    exit;
}

if (!isset($_FILES['photos'])) {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'No se recibieron archivos']);
    exit;
}

$names = $_FILES['photos']['name'] ?? [];
$tmpNames = $_FILES['photos']['tmp_name'] ?? [];
$errors = $_FILES['photos']['error'] ?? [];
$sizes = $_FILES['photos']['size'] ?? [];

if (!is_array($tmpNames)) {
    $names = [$names];
    $tmpNames = [$tmpNames];
    $errors = [$errors];
    $sizes = [$sizes];
}

$finfo = finfo_open(FILEINFO_MIME_TYPE);
if ($finfo === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'No se pudo inicializar verificador de tipo']);
    exit;
}

$saved = 0;

foreach ($tmpNames as $index => $tmpPath) {
    $error = (int) ($errors[$index] ?? UPLOAD_ERR_NO_FILE);
    $size = (int) ($sizes[$index] ?? 0);

    if ($error !== UPLOAD_ERR_OK) {
        continue;
    }

    if ($size <= 0 || $size > $maxFileSize) {
        continue;
    }

    $mimeType = finfo_file($finfo, $tmpPath) ?: '';
    if (!isset($allowedMimeToExt[$mimeType])) {
        continue;
    }

    $extension = $allowedMimeToExt[$mimeType];
    $randomPart = bin2hex(random_bytes(8));
    $fileName = date('Ymd_His') . '_' . $randomPart . '.' . $extension;
    $destination = $uploadDir . DIRECTORY_SEPARATOR . $fileName;

    if (move_uploaded_file($tmpPath, $destination)) {
        $saved++;
    }
}

finfo_close($finfo);

if ($saved === 0) {
    http_response_code(400);
    echo json_encode([
        'ok' => false,
        'error' => 'No se guardo ninguna imagen valida. Formatos permitidos: JPG, PNG, WEBP, GIF. Maximo 8MB por archivo.',
    ]);
    exit;
}

echo json_encode(['ok' => true, 'saved' => $saved]);
