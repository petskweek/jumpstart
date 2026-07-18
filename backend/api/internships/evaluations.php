<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

$user = requireRole('student', 'company', 'admin');
try {
    $pdo = db();
    if ($_SERVER['REQUEST_METHOD'] === 'GET') {
        $placementId = (int) ($_GET['placementId'] ?? 0);
        if ($placementId < 1) respond(422, ['message' => 'placementId is required.']);
        $statement = $pdo->prepare('SELECT e.id, e.period_type AS periodType, e.period_start AS periodStart, e.period_end AS periodEnd, e.work_quality AS workQuality, e.attendance, e.communication, e.overall_score AS overallScore, e.comments, e.created_at AS createdAt FROM evaluations e JOIN placements p ON p.id = e.placement_id WHERE e.placement_id = ? AND (? = "admin" OR p.student_id = ? OR p.company_id = ?) ORDER BY e.period_end DESC');
        $statement->execute([$placementId, $user['role'], $user['id'], $user['id']]);
        respond(200, ['evaluations' => $statement->fetchAll(PDO::FETCH_ASSOC)]);
    }
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);
    if ($user['role'] !== 'company') respond(403, ['message' => 'Only companies may submit evaluations.']);
    $data = input();
    requireFields($data, ['placementId', 'periodType', 'periodStart', 'periodEnd']);
    if (!in_array($data['periodType'], ['weekly', 'monthly', 'final'], true)) respond(422, ['message' => 'Invalid evaluation period type.']);
    foreach (['workQuality', 'attendance', 'communication'] as $score) if (isset($data[$score]) && ((int) $data[$score] < 1 || (int) $data[$score] > 5)) respond(422, ['message' => "$score must be between 1 and 5."]);
    $placement = $pdo->prepare('SELECT id FROM placements WHERE id = ? AND company_id = ?'); $placement->execute([(int) $data['placementId'], $user['id']]);
    if (!$placement->fetchColumn()) respond(403, ['message' => 'You can only evaluate your own interns.']);
    $scores = array_filter([$data['workQuality'] ?? null, $data['attendance'] ?? null, $data['communication'] ?? null], fn($value) => $value !== null && $value !== '');
    $overall = $scores ? round(array_sum(array_map('intval', $scores)) / count($scores), 2) : null;
    $statement = $pdo->prepare('INSERT INTO evaluations (placement_id, evaluator_id, period_type, period_start, period_end, work_quality, attendance, communication, overall_score, comments) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE evaluator_id = VALUES(evaluator_id), work_quality = VALUES(work_quality), attendance = VALUES(attendance), communication = VALUES(communication), overall_score = VALUES(overall_score), comments = VALUES(comments)');
    $statement->execute([(int) $data['placementId'], $user['id'], $data['periodType'], $data['periodStart'], $data['periodEnd'], $data['workQuality'] ?? null, $data['attendance'] ?? null, $data['communication'] ?? null, $overall, trim((string) ($data['comments'] ?? ''))]);
    respond(201, ['message' => 'Evaluation saved.', 'overallScore' => $overall]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to process evaluation.']);
}
