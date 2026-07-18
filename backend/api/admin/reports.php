<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(405, ['message' => 'Method not allowed.']);
requireRole('admin');
try {
    $pdo = db();
    $summary = $pdo->query('SELECT (SELECT COUNT(*) FROM users WHERE role = "student") AS students, (SELECT COUNT(*) FROM users WHERE role = "company") AS companies, (SELECT COUNT(*) FROM job_postings WHERE status = "active") AS activePostings, (SELECT COUNT(*) FROM placements WHERE status = "active") AS activeInternships, (SELECT COUNT(*) FROM ojt_applications WHERE status = "pending") AS pendingApplications')->fetch(PDO::FETCH_ASSOC);
    $progress = $pdo->query('SELECT p.id AS placementId, u.name AS student, cp.company_name AS company, p.required_hours AS requiredHours, COALESCE(SUM(CASE WHEN tr.status = "approved" THEN tr.hours_worked ELSE 0 END), 0) AS approvedHours FROM placements p JOIN users u ON u.id = p.student_id JOIN company_profiles cp ON cp.user_id = p.company_id LEFT JOIN time_records tr ON tr.placement_id = p.id WHERE p.status = "active" GROUP BY p.id, u.name, cp.company_name, p.required_hours ORDER BY u.name')->fetchAll(PDO::FETCH_ASSOC);
    respond(200, ['summary' => $summary, 'ojtProgress' => $progress]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to generate reports.']);
}
