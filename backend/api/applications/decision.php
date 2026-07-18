<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);
$user = requireRole('company', 'admin');
$data = input();
requireFields($data, ['applicationId', 'decision']);
$applicationId = (int) $data['applicationId'];
$decision = (string) $data['decision'];
try {
    $pdo = db();
    $statement = $pdo->prepare('SELECT a.*, p.company_id FROM ojt_applications a LEFT JOIN job_postings p ON p.id = a.job_posting_id WHERE a.id = ?');
    $statement->execute([$applicationId]);
    $application = $statement->fetch(PDO::FETCH_ASSOC);
    if (!$application) respond(404, ['message' => 'Application not found.']);
    if ($user['role'] === 'company') {
        if ((int) $application['company_id'] !== (int) $user['id']) respond(403, ['message' => 'You can only decide on applicants for your postings.']);
        if (!in_array($decision, ['accepted', 'rejected'], true)) respond(422, ['message' => 'Company decisions must be accepted or rejected.']);
        $pdo->prepare('UPDATE ojt_applications SET company_status = ?, status = IF(? = "rejected", "rejected", "reviewed"), review_notes = ? WHERE id = ?')->execute([$decision, $decision, trim((string) ($data['notes'] ?? '')), $applicationId]);
        respond(200, ['message' => 'Applicant decision saved.']);
    }
    if (!in_array($decision, ['approved', 'rejected'], true)) respond(422, ['message' => 'Admin decisions must be approved or rejected.']);
    if ($decision === 'approved' && $application['company_status'] !== 'accepted') respond(422, ['message' => 'The company must accept the applicant before placement approval.']);
    $pdo->beginTransaction();
    $pdo->prepare('UPDATE ojt_applications SET status = ?, reviewed_by = ?, reviewed_at = NOW(), review_notes = ? WHERE id = ?')->execute([$decision, $user['id'], trim((string) ($data['notes'] ?? '')), $applicationId]);
    if ($decision === 'approved') {
        $pdo->prepare('INSERT INTO placements (application_id, student_id, company_id, job_posting_id, start_date, required_hours, status, approved_by, approved_at) VALUES (?, ?, ?, ?, ?, ?, "active", ?, NOW())')->execute([$applicationId, $application['user_id'], $application['company_id'], $application['job_posting_id'], $application['preferred_start_date'], $application['required_hours'], $user['id']]);
    }
    $pdo->commit();
    respond(200, ['message' => 'Application decision saved.']);
} catch (PDOException $exception) {
    if (isset($pdo) && $pdo->inTransaction()) $pdo->rollBack();
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to save application decision.']);
}
