<?php
declare(strict_types=1);

const TO = 'info@erstitsolutions.com';
const FROM = 'info@erstitsolutions.com';
const HOSTS = ['erstitsolutions.com', 'www.erstitsolutions.com'];
const LIMIT = 5;
const WINDOW = 3600;
const MIN_SECONDS = 3;

const TOPICS = [
    'opt.ai' => 'AI ajan projesi',
    'opt.software' => 'Yazılım / SaaS projesi',
    'opt.website' => 'Web sitesi',
    'opt.mobile' => 'Mobil uygulama',
    'opt.auto' => 'Otomasyon',
    'opt.crm' => 'CRM',
    'opt.erp' => 'ERP',
    'opt.server' => 'Sunucu ve panel',
    'opt.mail' => 'E-posta, DNS, Cloudflare',
    'opt.care' => 'Mevcut site / hata ayıklama',
    'opt.site' => 'Ürün demosu',
    'opt.panel' => 'WhatsApp paneli',
    'opt.books' => 'Muhasebe',
    'opt.web' => 'Döviz bürosu sitesi',
    'opt.studio' => 'Yeni proje',
];

$wantsJson = str_contains($_SERVER['HTTP_ACCEPT'] ?? '', 'application/json');
$lang = in_array($_POST['lang'] ?? '', ['tr', 'en', 'fa'], true) ? $_POST['lang'] : langFromReferer();

function langFromReferer(): string
{
    $path = parse_url($_SERVER['HTTP_REFERER'] ?? '', PHP_URL_PATH) ?: '';
    return preg_match('#^/(en|fa)/#', $path, $m) ? $m[1] : 'tr';
}

function finish(bool $ok, string $code, int $status): never
{
    global $wantsJson, $lang;
    header('Cache-Control: no-store');
    if ($wantsJson) {
        http_response_code($status);
        header('Content-Type: application/json; charset=utf-8');
        echo json_encode(['ok' => $ok, 'error' => $ok ? null : $code]);
        exit;
    }
    $base = $lang === 'tr' ? '/contact' : "/$lang/contact";
    header('Location: ' . $base . ($ok ? '?sent=1' : '?error=' . rawurlencode($code)) . '#form', true, 303);
    exit;
}

function field(string $key, int $max): string
{
    $value = trim((string) ($_POST[$key] ?? ''));
    $value = preg_replace('/[^\P{C}\n\t]/u', '', $value) ?? '';
    return mb_substr($value, 0, $max);
}

function oneLine(string $value): string
{
    return trim(preg_replace('/\s+/u', ' ', $value) ?? '');
}

if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') {
    header('Allow: POST');
    finish(false, 'method', 405);
}

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if ($origin !== '' && !in_array(parse_url($origin, PHP_URL_HOST), HOSTS, true)) {
    finish(false, 'origin', 403);
}

if (field('website', 200) !== '') {
    finish(true, '', 200);
}
$started = (int) ($_POST['t'] ?? 0);
if ($started > 0 && time() - intdiv($started, 1000) < MIN_SECONDS) {
    finish(true, '', 200);
}

$ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? $_SERVER['REMOTE_ADDR'] ?? '';
$bucket = sys_get_temp_dir() . '/erst-contact-' . hash('sha256', 'erst' . $ip);
$now = time();
$hits = array_filter(
    array_map('intval', is_file($bucket) ? (array) file($bucket, FILE_IGNORE_NEW_LINES) : []),
    fn(int $at) => $at > $now - WINDOW
);
if (count($hits) >= LIMIT) {
    finish(false, 'rate', 429);
}

$name = oneLine(field('name', 100));
$email = oneLine(field('email', 160));
$phone = oneLine(field('phone', 40));
$topicKey = field('interest', 40);
$message = field('message', 5000);

if ($name === '' || $message === '') {
    finish(false, 'required', 422);
}
if ($email === '' && $phone === '') {
    finish(false, 'contact', 422);
}
if ($email !== '' && !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    finish(false, 'email', 422);
}

$topic = TOPICS[$topicKey] ?? 'Genel';
$langName = ['tr' => 'Türkçe', 'en' => 'English', 'fa' => 'فارسی'][$lang];
$body = implode("\n", [
    "Ad soyad: $name",
    'E-posta: ' . ($email ?: '-'),
    'Telefon: ' . ($phone ?: '-'),
    "Konu: $topic",
    "Dil: $langName",
    'Tarih: ' . (new DateTime('now', new DateTimeZone('Europe/Istanbul')))->format('Y-m-d H:i'),
    '',
    $message,
    '',
    '-- ',
    'erstitsolutions.com iletişim formu',
]);

$subject = '=?UTF-8?B?' . base64_encode("Web formu: $topic · $name") . '?=';
$fromName = '=?UTF-8?B?' . base64_encode('ERST web formu') . '?=';
$headers = [
    'From' => "$fromName <" . FROM . '>',
    'MIME-Version' => '1.0',
    'Content-Type' => 'text/plain; charset=UTF-8',
    'Content-Transfer-Encoding' => '8bit',
    'X-Mailer' => 'erstitsolutions.com',
];
if ($email !== '') {
    $headers['Reply-To'] = $email;
}

if (!mail(TO, $subject, $body, $headers, '-f' . FROM)) {
    finish(false, 'send', 500);
}

$hits[] = $now;
@file_put_contents($bucket, implode("\n", $hits), LOCK_EX);
finish(true, '', 200);
