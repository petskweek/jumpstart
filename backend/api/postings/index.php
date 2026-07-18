<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

try {
    $pdo = db();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $companyId = isset($_GET['companyId']) ? (int) $_GET['companyId'] : 0;
        $sql = 'SELECT p.id, p.title, p.department, p.description, p.location, p.required_hours AS requiredHours, p.requirements, p.status, p.created_at AS createdAt, cp.company_name AS company FROM job_postings p JOIN company_profiles cp ON cp.user_id = p.company_id WHERE p.status = "active"';
        $params = [];
        if ($companyId > 0) { $sql .= ' AND p.company_id = ?'; $params[] = $companyId; }
        $sql .= ' ORDER BY p.created_at DESC';
        $statement = $pdo->prepare($sql);
        $statement->execute($params);
        respond(200, ['postings' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    $user = requireRole('company');
    $data = input();
    requireFields($data, ['title', 'description', 'requiredHours']);
    if (!ctype_digit((string) $data['requiredHours']) || (int) $data['requiredHours'] < 1) respond(422, ['message' => 'requiredHours must be a positive whole number.']);
    $statement = $pdo->prepare('INSERT INTO job_postings (company_id, title, department, description, location, required_hours, requirements, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)');
    $statement->execute([$user['id'], trim($data['title']), trim((string) ($data['department'] ?? '')), trim($data['description']), trim((string) ($data['location'] ?? '')), (int) $data['requiredHours'], trim((string) ($data['requirements'] ?? '')), in_array($data['status'] ?? 'active', ['draft', 'active'], true) ? $data['status'] ?? 'active' : 'active']);
    respond(201, ['message' => 'Job posting created.', 'postingId' => (int) $pdo->lastInsertId()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to process job postings.']);
}
