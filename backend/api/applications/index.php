<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(405, ['message' => 'Method not allowed.']);
$user = requireRole('student', 'company', 'admin');
try {
    $sql = 'SELECT a.id, a.first_name AS firstName, a.last_name AS lastName, a.school, a.program, a.required_hours AS requiredHours, a.status, a.company_status AS companyStatus, a.created_at AS createdAt, p.id AS postingId, p.title AS postingTitle, cp.company_name AS company FROM ojt_applications a LEFT JOIN job_postings p ON p.id = a.job_posting_id LEFT JOIN company_profiles cp ON cp.user_id = p.company_id';
    $params = [];
    if ($user['role'] === 'student') { $sql .= ' WHERE a.user_id = ?'; $params[] = $user['id']; }
    if ($user['role'] === 'company') { $sql .= ' WHERE p.company_id = ?'; $params[] = $user['id']; }
    $sql .= ' ORDER BY a.created_at DESC';
    $statement = db()->prepare($sql);
    $statement->execute($params);
    respond(200, ['applications' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to retrieve applications.']);
}
