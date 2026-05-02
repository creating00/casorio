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
$greetingsFile = __DIR__ . DIRECTORY_SEPARATOR . 'greetings.json';
$maxFileSize = 8 * 1024 * 1024;
$allowedMimeToExt = array(
    'image/jpeg' => 'jpg',
    'image/png' => 'png',
    'image/webp' => 'webp',
    'image/gif' => 'gif',
);
$allowedExtensions = array('jpg', 'jpeg', 'png', 'webp', 'gif');

function list_image_urls($uploadDir) {
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

    return $images;
}

function list_image_items($uploadDir) {
    $items = array();
    $pattern = $uploadDir . DIRECTORY_SEPARATOR . '*.{jpg,jpeg,png,webp,gif}';
    $files = glob($pattern, GLOB_BRACE);

    if ($files !== false) {
        foreach ($files as $filePath) {
            $fileName = basename($filePath);
            $mtime = filemtime($filePath);
            $items[] = array(
                'type' => 'image',
                'src' => 'uploads/' . rawurlencode($fileName) . '?v=' . rawurlencode((string) $mtime),
                'created' => $mtime,
            );
        }
    }

    return $items;
}

function load_greetings($greetingsFile) {
    if (!is_file($greetingsFile)) {
        return array();
    }

    $raw = file_get_contents($greetingsFile);
    if ($raw === false || trim($raw) === '') {
        return array();
    }

    $data = json_decode($raw, true);
    if (!is_array($data)) {
        return array();
    }

    return $data;
}

function save_greetings($greetingsFile, $greetings) {
    $json = json_encode($greetings);
    if ($json === false || file_put_contents($greetingsFile, $json, LOCK_EX) === false) {
        send_json(500, array('ok' => false, 'error' => 'No se pudo guardar el saludo'));
    }
}

function clean_text($value, $maxLength) {
    $value = trim(strip_tags((string) $value));
    $value = preg_replace('/\s+/', ' ', $value);

    if (function_exists('mb_substr')) {
        return mb_substr($value, 0, $maxLength, 'UTF-8');
    }

    return substr($value, 0, $maxLength);
}

function list_greeting_items($greetings) {
    $items = array();

    foreach ($greetings as $greeting) {
        if (!is_array($greeting) || !isset($greeting['message']) || !isset($greeting['created'])) {
            continue;
        }

        $items[] = array(
            'type' => 'greeting',
            'message' => $greeting['message'],
            'author' => isset($greeting['author']) ? $greeting['author'] : '',
            'theme' => isset($greeting['theme']) ? $greeting['theme'] : 'rose',
            'created' => (int) $greeting['created'],
        );
    }

    return $items;
}

function sort_items_by_created($a, $b) {
    return ((int) $a['created']) - ((int) $b['created']);
}

if (!is_dir($uploadDir)) {
    if (!mkdir($uploadDir, 0775, true) && !is_dir($uploadDir)) {
        send_json(500, array('ok' => false, 'error' => 'No se pudo crear carpeta uploads'));
    }
}

$method = isset($_SERVER['REQUEST_METHOD']) ? $_SERVER['REQUEST_METHOD'] : 'GET';

if ($method === 'GET') {
    $images = list_image_urls($uploadDir);
    $greetings = list_greeting_items(load_greetings($greetingsFile));
    $items = array_merge(list_image_items($uploadDir), $greetings);
    usort($items, 'sort_items_by_created');

    send_json(200, array(
        'ok' => true,
        'images' => $images,
        'greetings' => $greetings,
        'items' => $items,
    ));
}

if ($method !== 'POST') {
    send_json(405, array('ok' => false, 'error' => 'Metodo no permitido'));
}

$action = isset($_POST['action']) ? $_POST['action'] : 'upload';

if ($action === 'delete') {
    $fileName = isset($_POST['file']) ? trim((string) $_POST['file']) : '';

    if ($fileName === '' || $fileName !== basename($fileName)) {
        send_json(400, array('ok' => false, 'error' => 'Archivo invalido'));
    }

    $extension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
    if (!in_array($extension, $allowedExtensions, true)) {
        send_json(400, array('ok' => false, 'error' => 'Formato no permitido'));
    }

    $targetPath = $uploadDir . DIRECTORY_SEPARATOR . $fileName;
    if (!is_file($targetPath)) {
        send_json(404, array('ok' => false, 'error' => 'La imagen no existe'));
    }

    if (!unlink($targetPath)) {
        send_json(500, array('ok' => false, 'error' => 'No se pudo eliminar la imagen'));
    }

    send_json(200, array(
        'ok' => true,
        'deleted' => $fileName,
        'images' => list_image_urls($uploadDir),
    ));
}

if ($action === 'greeting') {
    $message = clean_text(isset($_POST['message']) ? $_POST['message'] : '', 420);
    $author = clean_text(isset($_POST['author']) ? $_POST['author'] : '', 70);
    $theme = clean_text(isset($_POST['theme']) ? $_POST['theme'] : 'rose', 20);
    $allowedThemes = array('rose', 'gold', 'garden');

    if ($message === '') {
        send_json(400, array('ok' => false, 'error' => 'Escribe un saludo antes de enviarlo'));
    }

    if (!in_array($theme, $allowedThemes, true)) {
        $theme = 'rose';
    }

    $greetings = load_greetings($greetingsFile);
    $greetings[] = array(
        'message' => $message,
        'author' => $author,
        'theme' => $theme,
        'created' => time(),
    );

    save_greetings($greetingsFile, $greetings);

    send_json(200, array('ok' => true, 'saved' => true));
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

