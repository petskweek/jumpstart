<?php
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: http://localhost:5173');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Access-Control-Allow-Credentials: true');

session_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') exit;

function respond(int $status, array $body): never {
    http_response_code($status);
    echo json_encode($body);
    exit;
}

function input(): array {
    $data = json_decode(file_get_contents('php://input'), true);
    if (!is_array($data)) respond(400, ['message' => 'Invalid JSON request body.']);
    return $data;
}

function requireRole(string ...$roles): array {
    $user = $_SESSION['user'] ?? null;
    if (!is_array($user) || !in_array($user['role'] ?? null, $roles, true)) {
        respond(403, ['message' => 'You do not have permission to perform this action.']);
    }
    return $user;
}

function requireFields(array $data, array $fields): void {
    foreach ($fields as $field) {
        if (!isset($data[$field]) || trim((string) $data[$field]) === '') {
            respond(422, ['message' => "The {$field} field is required."]);
        }
    }
}

function db(): PDO {
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $name = getenv('DB_NAME') ?: 'jumpstart';
    $user = getenv('DB_USER') ?: 'root';
    $password = getenv('DB_PASSWORD') ?: '';
    return new PDO("mysql:host=$host;dbname=$name;charset=utf8mb4", $user, $password, [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION]);
}
