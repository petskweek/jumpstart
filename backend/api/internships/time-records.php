<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

$user = requireRole('student', 'company', 'admin');
try {
    $pdo = db();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $placementId = (int) ($_GET['placementId'] ?? 0);
        if ($placementId < 1) respond(422, ['message' => 'placementId is required.']);
        $statement = $pdo->prepare('SELECT tr.id, tr.work_date AS workDate, tr.clock_in AS clockIn, tr.clock_out AS clockOut, tr.hours_worked AS hoursWorked, tr.status, tr.notes FROM time_records tr JOIN placements p ON p.id = tr.placement_id WHERE tr.placement_id = ? AND (? = "admin" OR p.student_id = ? OR p.company_id = ?) ORDER BY tr.work_date DESC');
        $statement->execute([$placementId, $user['role'], $user['id'], $user['id']]);
        respond(200, ['records' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    $data = input();
    requireFields($data, ['placementId', 'action']);
    $placementId = (int) $data['placementId'];
    $placement = $pdo->prepare('SELECT * FROM placements WHERE id = ?'); $placement->execute([$placementId]); $placement = $placement->fetch(PDO::FETCH_ASSOC);
    if (!$placement || ($user['role'] === 'student' && (int) $placement['student_id'] !== (int) $user['id'])) respond(403, ['message' => 'You do not have access to this internship.']);
    if ($data['action'] === 'clock-in') {
        if ($user['role'] !== 'student') respond(403, ['message' => 'Only students may clock in.']);
        $pdo->prepare('INSERT INTO time_records (placement_id, work_date, clock_in) VALUES (?, CURDATE(), NOW()) ON DUPLICATE KEY UPDATE clock_in = COALESCE(clock_in, NOW())')->execute([$placementId]);
        respond(200, ['message' => 'Clock-in recorded.']);
    }
    if ($data['action'] === 'clock-out') {
        if ($user['role'] !== 'student') respond(403, ['message' => 'Only students may clock out.']);
        $pdo->prepare('UPDATE time_records SET clock_out = NOW(), hours_worked = ROUND(TIMESTAMPDIFF(MINUTE, clock_in, NOW()) / 60, 2), status = "submitted" WHERE placement_id = ? AND work_date = CURDATE() AND clock_in IS NOT NULL')->execute([$placementId]);
        respond(200, ['message' => 'Clock-out recorded.']);
    }
    respond(422, ['message' => 'Unsupported time-record action.']);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to process time record.']);
}
