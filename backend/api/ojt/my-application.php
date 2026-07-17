<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'GET') respond(405, ['message' => 'Method not allowed.']);
if (($_SESSION['user']['role'] ?? null) !== 'student') respond(403, ['message' => 'Only Student accounts can view OJT application details.']);

try {
    $statement = db()->prepare('SELECT id, school, program, year_level FROM ojt_applications WHERE user_id = ? ORDER BY created_at DESC, id DESC LIMIT 1');
    $statement->execute([$_SESSION['user']['id']]);
    $application = $statement->fetch(PDO::FETCH_ASSOC);
    respond(200, ['application' => $application ? ['id' => (int) $application['id'], 'school' => $application['school'], 'program' => $application['program'], 'yearLevel' => $application['year_level']] : null]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to retrieve OJT application details.']);
}
