<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);
if (($_SESSION['user']['role'] ?? null) !== 'student') respond(403, ['message' => 'Only logged-in Students can submit an OJT application.']);

$required = ['firstName', 'lastName', 'phone', 'school', 'program', 'yearLevel', 'studentId', 'industry', 'hours', 'startDate', 'motivation'];
foreach ($required as $field) if (trim((string) ($_POST[$field] ?? '')) === '') respond(422, ['message' => 'Please complete all required fields.']);
if (!ctype_digit((string) $_POST['hours']) || (int) $_POST['hours'] === 0) respond(422, ['message' => 'Enter a valid required duration.']);
if (!isset($_FILES['resume']) || $_FILES['resume']['error'] !== UPLOAD_ERR_OK) respond(422, ['message' => 'A resume or CV is required.']);

function upload(string $key, bool $required = false): ?string {
    if (!isset($_FILES[$key]) || $_FILES[$key]['error'] === UPLOAD_ERR_NO_FILE) return $required ? null : null;
    $file = $_FILES[$key];
    if ($file['error'] !== UPLOAD_ERR_OK || $file['size'] > 5 * 1024 * 1024) respond(422, ['message' => 'Documents must be valid files no larger than 5 MB.']);
    $extension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
    if (!in_array($extension, ['pdf', 'doc', 'docx'], true)) respond(422, ['message' => 'Only PDF, DOC, and DOCX documents are accepted.']);
    $directory = dirname(__DIR__, 2) . '/uploads';
    if (!is_dir($directory) && !mkdir($directory, 0755, true)) respond(500, ['message' => 'Unable to prepare document storage.']);
    $name = bin2hex(random_bytes(16)) . '.' . $extension;
    if (!move_uploaded_file($file['tmp_name'], $directory . '/' . $name)) respond(500, ['message' => 'Unable to save the uploaded document.']);
    return 'uploads/' . $name;
}

try {
    $pdo = db();
    $userStatement = $pdo->prepare('SELECT email FROM users WHERE id = ? LIMIT 1');
    $userStatement->execute([$_SESSION['user']['id']]);
    $email = $userStatement->fetchColumn();
    if (!$email) respond(401, ['message' => 'Your account could not be found. Please sign in again.']);
    $resumePath = upload('resume', true);
    $transcriptPath = upload('transcript');
    $statement = $pdo->prepare('INSERT INTO ojt_applications (user_id, first_name, last_name, email, phone, school, program, year_level, student_id, preferred_industry, required_hours, preferred_start_date, skills, motivation, resume_path, transcript_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)');
    $statement->execute([$_SESSION['user']['id'], trim($_POST['firstName']), trim($_POST['lastName']), $email, trim($_POST['phone']), trim($_POST['school']), trim($_POST['program']), '4th Year', trim($_POST['studentId']), trim($_POST['industry']), (int) $_POST['hours'], $_POST['startDate'], trim($_POST['skills'] ?? ''), trim($_POST['motivation']), $resumePath, $transcriptPath]);
    respond(201, ['message' => 'OJT application submitted.', 'applicationId' => (int) $pdo->lastInsertId()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to save your application.']);
}
