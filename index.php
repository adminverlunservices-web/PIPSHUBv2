<?php
$reactEntry = __DIR__ . '/react-dist/index.html';
if (is_file($reactEntry)) {
    readfile($reactEntry);
    exit;
}

header('Location: index.html', true, 302);
exit;
