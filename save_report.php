<?php
/**
 * Thyroid K-TIRADS report collector (Synology Web Station).
 *
 * Receives one study summary as JSON (POST) from the report tool served
 * from the same folder, and appends it as a row to data/thyroid_reports.csv
 * (UTF-8 with BOM — opens directly in Excel, Korean-safe).
 *
 * Intranet use only. Place this file next to index.html; the tool's
 * "Save to NAS" button posts here. The data/ folder is created on first
 * save; back it up like any other patient-data file.
 */

header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['ok' => false, 'error' => 'POST only']);
    exit;
}

$raw = file_get_contents('php://input');
$d = json_decode($raw, true);
if (!is_array($d) || trim((string)($d['patientId'] ?? '')) === '') {
    http_response_code(400);
    echo json_encode(['ok' => false, 'error' => 'invalid payload (patientId required)']);
    exit;
}

// sanitize: strings only, bounded length
$s = function ($key, $max = 200) use ($d) {
    $v = $d[$key] ?? '';
    if (!is_scalar($v)) return '';
    return mb_substr(trim((string)$v), 0, $max);
};

$row = [
    date('Y-m-d H:i:s'),          // saved_at (server time)
    $s('examDate', 20),
    $s('patientId', 40),
    $s('ktiradsMax', 4),
    $s('noduleCount', 4),
    $s('biopsyIndicated', 8),
    $s('lnStatus', 20),
    $s('recommendation', 1000),
    $s('reportText', 20000),
];

$dir = __DIR__ . '/data';
if (!is_dir($dir) && !mkdir($dir, 0770, true)) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'cannot create data folder']);
    exit;
}

$file = $dir . '/thyroid_reports.csv';
$isNew = !file_exists($file);

$fp = fopen($file, 'a');
if ($fp === false) {
    http_response_code(500);
    echo json_encode(['ok' => false, 'error' => 'cannot open csv']);
    exit;
}
flock($fp, LOCK_EX);
if ($isNew) {
    fwrite($fp, "\xEF\xBB\xBF"); // UTF-8 BOM so Excel detects encoding
    fputcsv($fp, ['saved_at', 'exam_date', 'patient_id', 'ktirads_max',
                  'nodule_count', 'biopsy_indicated', 'ln_status',
                  'recommendation', 'report_text']);
}
fputcsv($fp, $row);
fflush($fp);
flock($fp, LOCK_UN);
fclose($fp);

// row count (excluding header)
$rows = 0;
$rf = fopen($file, 'r');
if ($rf) {
    while (fgetcsv($rf) !== false) $rows++;
    fclose($rf);
    $rows = max(0, $rows - 1);
}

echo json_encode(['ok' => true, 'rows' => $rows]);
