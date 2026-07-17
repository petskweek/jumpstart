<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);

$data = input();
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $password === '') respond(422, ['message' => 'Email and password are required.']);

try {
    $statement = db()->prepare('SELECT id, name, email, password_hash, role FROM users WHERE email = ? LIMIT 1');
    $statement->execute([$email]);
    $user = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$user || !password_verify($password, $user['password_hash'])) respond(401, ['message' => 'Invalid email or password.']);
    $_SESSION['user'] = ['id' => (int) $user['id'], 'role' => $user['role']];
    respond(200, ['message' => 'Signed in.', 'user' => ['id' => (int) $user['id'], 'name' => $user['name'], 'email' => $user['email'], 'role' => $user['role']]]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to sign in.']);
}
