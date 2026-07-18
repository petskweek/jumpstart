<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);

$data = input();
$name = trim((string) ($data['name'] ?? ''));
$email = strtolower(trim((string) ($data['email'] ?? '')));
$password = (string) ($data['password'] ?? '');
$role = (string) ($data['role'] ?? 'student');

if ($name === '' || !filter_var($email, FILTER_VALIDATE_EMAIL) || strlen($password) < 8) {
    respond(422, ['message' => 'Enter a name, valid email address, and password of at least 8 characters.']);
}
if (!in_array($role, ['student', 'company'], true)) respond(422, ['message' => 'Invalid account type.']);

try {
    $pdo = db();
    $statement = $pdo->prepare('INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)');
    $statement->execute([$name, $email, password_hash($password, PASSWORD_DEFAULT), $role]);
    $userId = (int) $pdo->lastInsertId();
    if ($role === 'company') {
        $company = $pdo->prepare('INSERT INTO company_profiles (user_id, company_name, contact_name) VALUES (?, ?, ?)');
        $company->execute([$userId, trim((string) ($data['companyName'] ?? $name)), $name]);
    }
    respond(201, ['message' => 'Account created.', 'user' => ['name' => $name, 'email' => $email, 'role' => $role]]);
} catch (PDOException $exception) {
    if ($exception->getCode() === '23000') respond(409, ['message' => 'An account with that email already exists.']);
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to create the account.']);
}
