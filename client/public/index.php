<?php
declare(strict_types=1);

/*
 * Shared-hosting entry point for CodeMentor AI.
 * Serve the built React app even when the host prefers index.php over index.html.
 */
$entry = __DIR__ . DIRECTORY_SEPARATOR . 'index.html';

if (!is_file($entry) || !is_readable($entry)) {
    http_response_code(503);
    header('Content-Type: text/plain; charset=UTF-8');
    echo 'CodeMentor AI website files are incomplete. Please upload index.html and the assets/ folder from the same ZIP.';
    exit;
}

header('Content-Type: text/html; charset=UTF-8');
readfile($entry);
