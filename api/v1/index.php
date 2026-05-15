<?php
declare(strict_types=1);

const DB_HOST = 'localhost';
const DB_NAME = 'a0110809_swallet';
const DB_USER = 'a0110809_swallet';
const DB_PASS = 'hr*PQqOopprY6oM';
const TOKEN_SECRET = 'change-this-swallet-php-secret-before-production';
const ACCESS_TTL = 900;
const REFRESH_TTL = 604800;
const ALLOWED_USERS = ['FranPernil', 'MaxiTaxi'];
const ALLOWED_PASSWORD = 'LiamVillero123';

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: ' . ($_SERVER['HTTP_ORIGIN'] ?? '*'));
header('Access-Control-Allow-Credentials: true');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

try {
    $method = $_SERVER['REQUEST_METHOD'];
    $path = normalized_path();

    if ($method === 'GET' && $path === '') {
        respond(['ok' => true, 'service' => 'sWallet API']);
    }

    if ($path === 'auth/login' && $method === 'POST') {
        login();
    }

    if ($path === 'auth/me' && $method === 'GET') {
        $session = require_auth();
        respond(['user' => user_payload($session['username'])]);
    }

    if ($path === 'auth/refresh' && $method === 'POST') {
        $body = json_body();
        $session = verify_token((string)($body['refreshToken'] ?? ''), 'refresh');
        if (!$session) unauthorized('Sesion expirada. Inicia sesion nuevamente.');
        respond(session_payload($session['username']));
    }

    if ($path === 'auth/logout' && $method === 'POST') {
        respond(['ok' => true]);
    }

    if ($path === 'clients') {
        clients_collection($method);
    }

    if (preg_match('/^clients\/([^\/]+)$/', $path, $matches)) {
        client_resource($method, $matches[1]);
    }

    if ($path === 'projects') {
        projects_collection($method);
    }

    if (preg_match('/^projects\/([^\/]+)$/', $path, $matches)) {
        project_resource($method, $matches[1]);
    }

    respond(['message' => 'Ruta no encontrada.'], 404);
} catch (Throwable $error) {
    respond(['message' => 'Error interno del servidor.', 'detail' => $error->getMessage()], 500);
}

function normalized_path(): string
{
    $uriPath = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
    $scriptDir = rtrim(str_replace('\\', '/', dirname($_SERVER['SCRIPT_NAME'] ?? '')), '/');
    $path = $scriptDir && starts_with($uriPath, $scriptDir)
        ? substr($uriPath, strlen($scriptDir))
        : $uriPath;
    $path = trim($path, '/');
    if ($path === 'index.php') {
        return '';
    }
    if (starts_with($path, 'index.php/')) {
        return substr($path, strlen('index.php/'));
    }
    return $path;
}

function starts_with(string $value, string $prefix): bool
{
    return substr($value, 0, strlen($prefix)) === $prefix;
}

function login(): void
{
    $body = json_body();
    $credential = trim((string)($body['credential'] ?? $body['email'] ?? $body['username'] ?? ''));
    $password = (string)($body['password'] ?? '');

    $username = allowed_username($credential);
    if (!$username || $password !== ALLOWED_PASSWORD) {
        unauthorized('Usuario o contrasena incorrectos.');
    }

    ensure_schema();
    ensure_user($username);
    respond(session_payload($username));
}

function session_payload(string $username): array
{
    return [
        'user' => user_payload($username),
        'accessToken' => create_token($username, 'access', ACCESS_TTL),
        'refreshToken' => create_token($username, 'refresh', REFRESH_TTL),
        'expiresAt' => gmdate('c', time() + ACCESS_TTL)
    ];
}

function user_payload(string $username): array
{
    return [
        'id' => strtolower($username),
        'name' => $username,
        'username' => $username,
        'email' => strtolower($username) . '@swallet.local',
        'role' => 'admin',
        'status' => 'activo',
        'permissions' => ['read', 'write', 'delete', 'admin']
    ];
}

function allowed_username(string $credential): ?string
{
    foreach (ALLOWED_USERS as $username) {
        if (strcasecmp($credential, $username) === 0) {
            return $username;
        }
    }
    return null;
}

function require_auth(): array
{
    $header = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if (!$header && function_exists('apache_request_headers')) {
        $headers = apache_request_headers();
        $header = $headers['Authorization'] ?? $headers['authorization'] ?? '';
    }

    if (!preg_match('/Bearer\s+(.+)/i', $header, $matches)) {
        unauthorized('Sesion expirada. Inicia sesion nuevamente.');
    }

    $session = verify_token($matches[1], 'access');
    if (!$session) unauthorized('Sesion expirada. Inicia sesion nuevamente.');
    return $session;
}

function create_token(string $username, string $type, int $ttl): string
{
    $payload = [
        'username' => $username,
        'type' => $type,
        'exp' => time() + $ttl
    ];
    $encodedPayload = base64_url_encode(json_encode($payload, JSON_UNESCAPED_SLASHES));
    $signature = hash_hmac('sha256', $encodedPayload, TOKEN_SECRET);
    return $encodedPayload . '.' . $signature;
}

function verify_token(string $token, string $type): ?array
{
    $parts = explode('.', $token);
    if (count($parts) !== 2) return null;

    [$encodedPayload, $signature] = $parts;
    $expected = hash_hmac('sha256', $encodedPayload, TOKEN_SECRET);
    if (!hash_equals($expected, $signature)) return null;

    $payload = json_decode(base64_url_decode($encodedPayload), true);
    if (!is_array($payload)) return null;
    if (($payload['type'] ?? '') !== $type) return null;
    if ((int)($payload['exp'] ?? 0) < time()) return null;

    $username = allowed_username((string)($payload['username'] ?? ''));
    if (!$username) return null;
    return ['username' => $username];
}

function clients_collection(string $method): void
{
    require_auth();
    ensure_schema();

    if ($method === 'GET') {
        $rows = db()->query('SELECT * FROM swallet_clients ORDER BY created_at DESC')->fetchAll();
        respond(['clients' => array_map('client_from_row', $rows), 'meta' => meta(count($rows))]);
    }

    if ($method === 'POST') {
        $input = json_body();
        $id = new_id('client');
        $stmt = db()->prepare('INSERT INTO swallet_clients (id, name, company, email, phone, address, socials, website, service, agreed_price, currency, status, priority, first_contact, last_contact, start_date, observations, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([
            $id,
            str_value($input, 'name'),
            str_value($input, 'company'),
            str_value($input, 'email'),
            str_value($input, 'phone'),
            nullable_str($input, 'address'),
            nullable_str($input, 'socials'),
            nullable_str($input, 'website'),
            str_value($input, 'service'),
            number_value($input, 'agreedPrice'),
            str_value($input, 'currency', 'ARS'),
            str_value($input, 'status', 'lead'),
            str_value($input, 'priority', 'media'),
            nullable_date($input, 'firstContact'),
            nullable_date($input, 'lastContact'),
            nullable_date($input, 'startDate'),
            nullable_str($input, 'observations')
        ]);
        respond(['client' => get_client($id)], 201);
    }

    method_not_allowed();
}

function client_resource(string $method, string $id): void
{
    require_auth();
    ensure_schema();

    if ($method === 'PATCH') {
        $input = json_body();
        $stmt = db()->prepare('UPDATE swallet_clients SET name = ?, company = ?, email = ?, phone = ?, address = ?, socials = ?, website = ?, service = ?, agreed_price = ?, currency = ?, status = ?, priority = ?, first_contact = ?, last_contact = ?, start_date = ?, observations = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([
            str_value($input, 'name'),
            str_value($input, 'company'),
            str_value($input, 'email'),
            str_value($input, 'phone'),
            nullable_str($input, 'address'),
            nullable_str($input, 'socials'),
            nullable_str($input, 'website'),
            str_value($input, 'service'),
            number_value($input, 'agreedPrice'),
            str_value($input, 'currency', 'ARS'),
            str_value($input, 'status', 'lead'),
            str_value($input, 'priority', 'media'),
            nullable_date($input, 'firstContact'),
            nullable_date($input, 'lastContact'),
            nullable_date($input, 'startDate'),
            nullable_str($input, 'observations'),
            $id
        ]);
        respond(['client' => get_client($id)]);
    }

    if ($method === 'DELETE') {
        $stmt = db()->prepare('DELETE FROM swallet_clients WHERE id = ?');
        $stmt->execute([$id]);
        respond(null, 204);
    }

    method_not_allowed();
}

function projects_collection(string $method): void
{
    require_auth();
    ensure_schema();

    if ($method === 'GET') {
        $rows = db()->query('SELECT * FROM swallet_projects ORDER BY created_at DESC')->fetchAll();
        respond(['projects' => array_map('project_from_row', $rows), 'meta' => meta(count($rows))]);
    }

    if ($method === 'POST') {
        $input = json_body();
        $id = new_id('project');
        $stmt = db()->prepare('INSERT INTO swallet_projects (id, client_id, name, description, budget, paid, expenses, currency, status, progress, responsible, technologies, links, starts_at, due_at, notes, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())');
        $stmt->execute([
            $id,
            str_value($input, 'clientId'),
            str_value($input, 'name'),
            nullable_str($input, 'description'),
            number_value($input, 'budget'),
            number_value($input, 'paid'),
            number_value($input, 'expenses'),
            str_value($input, 'currency', 'ARS'),
            str_value($input, 'status', 'planificacion'),
            (int)number_value($input, 'progress'),
            nullable_str($input, 'responsible'),
            nullable_str($input, 'technologies'),
            nullable_str($input, 'links'),
            nullable_date($input, 'startsAt'),
            nullable_date($input, 'dueAt'),
            nullable_str($input, 'notes')
        ]);
        respond(['project' => get_project($id)], 201);
    }

    method_not_allowed();
}

function project_resource(string $method, string $id): void
{
    require_auth();
    ensure_schema();

    if ($method === 'PATCH') {
        $input = json_body();
        $stmt = db()->prepare('UPDATE swallet_projects SET client_id = ?, name = ?, description = ?, budget = ?, paid = ?, expenses = ?, currency = ?, status = ?, progress = ?, responsible = ?, technologies = ?, links = ?, starts_at = ?, due_at = ?, notes = ?, updated_at = NOW() WHERE id = ?');
        $stmt->execute([
            str_value($input, 'clientId'),
            str_value($input, 'name'),
            nullable_str($input, 'description'),
            number_value($input, 'budget'),
            number_value($input, 'paid'),
            number_value($input, 'expenses'),
            str_value($input, 'currency', 'ARS'),
            str_value($input, 'status', 'planificacion'),
            (int)number_value($input, 'progress'),
            nullable_str($input, 'responsible'),
            nullable_str($input, 'technologies'),
            nullable_str($input, 'links'),
            nullable_date($input, 'startsAt'),
            nullable_date($input, 'dueAt'),
            nullable_str($input, 'notes'),
            $id
        ]);
        respond(['project' => get_project($id)]);
    }

    if ($method === 'DELETE') {
        $stmt = db()->prepare('DELETE FROM swallet_projects WHERE id = ?');
        $stmt->execute([$id]);
        respond(null, 204);
    }

    method_not_allowed();
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo instanceof PDO) return $pdo;

    $dsn = 'mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4';
    $pdo = new PDO($dsn, DB_USER, DB_PASS, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
    ]);
    return $pdo;
}

function ensure_schema(): void
{
    static $done = false;
    if ($done) return;

    db()->exec("CREATE TABLE IF NOT EXISTS swallet_users (
        id VARCHAR(80) PRIMARY KEY,
        username VARCHAR(80) NOT NULL UNIQUE,
        email VARCHAR(160) NOT NULL,
        role VARCHAR(40) NOT NULL DEFAULT 'admin',
        status VARCHAR(40) NOT NULL DEFAULT 'activo',
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    db()->exec("CREATE TABLE IF NOT EXISTS swallet_clients (
        id VARCHAR(80) PRIMARY KEY,
        name VARCHAR(160) NOT NULL,
        company VARCHAR(160) NOT NULL,
        email VARCHAR(160) NOT NULL,
        phone VARCHAR(80) NOT NULL,
        address TEXT NULL,
        socials TEXT NULL,
        website VARCHAR(255) NULL,
        service VARCHAR(160) NOT NULL,
        agreed_price DECIMAL(14,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'ARS',
        status VARCHAR(60) NOT NULL DEFAULT 'lead',
        priority VARCHAR(40) NOT NULL DEFAULT 'media',
        first_contact DATE NULL,
        last_contact DATE NULL,
        start_date DATE NULL,
        observations TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    db()->exec("CREATE TABLE IF NOT EXISTS swallet_projects (
        id VARCHAR(80) PRIMARY KEY,
        client_id VARCHAR(80) NOT NULL,
        name VARCHAR(180) NOT NULL,
        description TEXT NULL,
        budget DECIMAL(14,2) NOT NULL DEFAULT 0,
        paid DECIMAL(14,2) NOT NULL DEFAULT 0,
        expenses DECIMAL(14,2) NOT NULL DEFAULT 0,
        currency VARCHAR(10) NOT NULL DEFAULT 'ARS',
        status VARCHAR(60) NOT NULL DEFAULT 'planificacion',
        progress INT NOT NULL DEFAULT 0,
        responsible VARCHAR(160) NULL,
        technologies TEXT NULL,
        links TEXT NULL,
        starts_at DATE NULL,
        due_at DATE NULL,
        notes TEXT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

    $done = true;
}

function ensure_user(string $username): void
{
    $stmt = db()->prepare("INSERT INTO swallet_users (id, username, email, role, status, created_at, updated_at)
        VALUES (?, ?, ?, 'admin', 'activo', NOW(), NOW())
        ON DUPLICATE KEY UPDATE username = VALUES(username), email = VALUES(email), role = 'admin', status = 'activo', updated_at = NOW()");
    $stmt->execute([strtolower($username), $username, strtolower($username) . '@swallet.local']);
}

function get_client(string $id): array
{
    $stmt = db()->prepare('SELECT * FROM swallet_clients WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['message' => 'Cliente no encontrado.'], 404);
    return client_from_row($row);
}

function get_project(string $id): array
{
    $stmt = db()->prepare('SELECT * FROM swallet_projects WHERE id = ?');
    $stmt->execute([$id]);
    $row = $stmt->fetch();
    if (!$row) respond(['message' => 'Proyecto no encontrado.'], 404);
    return project_from_row($row);
}

function client_from_row(array $row): array
{
    return [
        'id' => $row['id'],
        'name' => $row['name'],
        'company' => $row['company'],
        'email' => $row['email'],
        'phone' => $row['phone'],
        'address' => $row['address'],
        'socials' => $row['socials'],
        'website' => $row['website'],
        'service' => $row['service'],
        'agreedPrice' => (float)$row['agreed_price'],
        'currency' => $row['currency'],
        'status' => $row['status'],
        'priority' => $row['priority'],
        'firstContact' => $row['first_contact'],
        'lastContact' => $row['last_contact'],
        'startDate' => $row['start_date'],
        'observations' => $row['observations'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at']
    ];
}

function project_from_row(array $row): array
{
    return [
        'id' => $row['id'],
        'clientId' => $row['client_id'],
        'name' => $row['name'],
        'description' => $row['description'],
        'budget' => (float)$row['budget'],
        'paid' => (float)$row['paid'],
        'expenses' => (float)$row['expenses'],
        'currency' => $row['currency'],
        'status' => $row['status'],
        'progress' => (int)$row['progress'],
        'responsible' => $row['responsible'],
        'technologies' => $row['technologies'],
        'links' => $row['links'],
        'startsAt' => $row['starts_at'],
        'dueAt' => $row['due_at'],
        'notes' => $row['notes'],
        'createdAt' => $row['created_at'],
        'updatedAt' => $row['updated_at']
    ];
}

function json_body(): array
{
    $raw = file_get_contents('php://input') ?: '';
    $data = json_decode($raw, true);
    return is_array($data) ? $data : [];
}

function str_value(array $input, string $key, string $default = ''): string
{
    $value = trim((string)($input[$key] ?? $default));
    return $value !== '' ? $value : $default;
}

function nullable_str(array $input, string $key): ?string
{
    $value = trim((string)($input[$key] ?? ''));
    return $value === '' ? null : $value;
}

function nullable_date(array $input, string $key): ?string
{
    $value = nullable_str($input, $key);
    return $value ? substr($value, 0, 10) : null;
}

function number_value(array $input, string $key): float
{
    return is_numeric($input[$key] ?? null) ? (float)$input[$key] : 0.0;
}

function new_id(string $prefix): string
{
    return $prefix . '_' . bin2hex(random_bytes(8));
}

function meta(int $count): array
{
    return ['page' => 1, 'pageSize' => max($count, 1), 'total' => $count, 'totalPages' => 1];
}

function base64_url_encode(string $value): string
{
    return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
}

function base64_url_decode(string $value): string
{
    return base64_decode(strtr($value, '-_', '+/')) ?: '';
}

function unauthorized(string $message): void
{
    respond(['message' => $message], 401);
}

function method_not_allowed(): void
{
    respond(['message' => 'Metodo no permitido.'], 405);
}

function respond($payload, int $status = 200): void
{
    http_response_code($status);
    if ($status !== 204) {
        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    }
    exit;
}
