## Stack
- Plain static frontend plus one PHP endpoint: `index.html`, `upload.html`, `saludos.html`, `viewer.html`, `admin.html`, related JS files, `styles.css`, `api.php`.
- No package manager, build step, test runner, linter, or formatter config exists in this repo.

## Entry Points
- `index.html` is only the landing page.
- Upload flow is `upload.html` + `upload.js`.
- Greeting flow is `saludos.html` + `saludos.js`; greetings are saved by `api.php` in `greetings.json`.
- Slideshow flow is `viewer.html` + `viewer.js`; it renders both uploaded photos and greeting cards from `GET api.php`.
- Admin flow is `admin.html` + `admin.js`; it is intentionally not linked from `index.html`.
- `script.js` is currently not referenced by any HTML file. Verify before editing it; most behavior changes belong in `upload.js` or `viewer.js` instead.

## Local Run
- Do not open pages via `file://`. Frontend code calls `fetch('api.php')` and uploads files, so use a PHP web server.
- Simplest local server: `php -S 127.0.0.1:8000` from repo root, then open `/index.html`, `/upload.html`, `/saludos.html`, `/viewer.html`, or `/admin.html`.

## Verification
- Only built-in automated check here is PHP syntax: `php -l api.php`.
- Normal verification is manual in a browser: upload images in `upload.html`, send greetings in `saludos.html`, then confirm both appear in `viewer.html` after refresh/polling.

## PHP / Server Constraints
- Keep `api.php` compatible with old PHP. The local CLI here is PHP 5.6, and the file already avoids modern syntax.
- `api.php` requires the `fileinfo` extension; uploads fail without it.
- `api.php` auto-creates `uploads/` if missing, but it does not recreate `uploads/.htaccess` or `uploads/index.html`. Preserve those files because they block directory listing and PHP execution inside `uploads/`.

## Behavior Notes
- `api.php` accepts only image uploads and enforces an 8 MB per-file limit.
- `GET api.php` returns `images` for compatibility and `items` for the carousel; `items` mixes image entries with greeting entries sorted by creation/modification time.
