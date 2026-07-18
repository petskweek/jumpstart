<?php
declare(strict_types=1);
require_once __DIR__ . '/../bootstrap.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') respond(405, ['message' => 'Method not allowed.']);
$user = requireRole('student');
$data = input();
requireFields($data, ['jobPostingId', 'motivation']);
try {
    $pdo = db();
    $posting = $pdo->prepare('SELECT id, required_hours FROM job_postings WHERE id = ? AND status = "active"');
    $posting->execute([(int) $data['jobPostingId']]);
    $posting = $posting->fetch(PDO::FETCH_ASSOC);
    if (!$posting) respond(404, ['message' => 'This OJT posting is no longer available.']);
    $profile = $pdo->prepare('SELECT sp.*, u.name, u.email FROM student_profiles sp JOIN users u ON u.id = sp.user_id WHERE sp.user_id = ?');
    $profile->execute([$user['id']]);
    $profile = $profile->fetch(PDO::FETCH_ASSOC);
    if (!$profile || !$profile['phone'] || !$profile['school'] || !$profile['program'] || !$profile['student_number'] || !$profile['resume_path']) respond(422, ['message' => 'Complete your student profile and upload a resume before applying to a posting.']);
    $duplicate = $pdo->prepare('SELECT id FROM ojt_applications WHERE user_id = ? AND job_posting_id = ? AND status NOT IN ("withdrawn", "rejected")');
    $duplicate->execute([$user['id'], $posting['id']]);
    if ($duplicate->fetchColumn()) respond(409, ['message' => 'You already have an active application for this posting.']);
    $name = preg_split('/\\s+/', trim($profile['name']), 2);
    $statement = $pdo->prepare('INSERT INTO ojt_applications (user_id, job_posting_id, first_name, last_name, email, phone, school, program, year_level, student_id, preferred_industry, required_hours, preferred_start_date, skills, motivation, resume_path, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), ?, ?, ?, "pending")');
    $statement->execute([$user['id'], $posting['id'], $name[0], $name[1] ?? '', $profile['email'], $profile['phone'], $profile['school'], $profile['program'], $profile['year_level'] ?: 'Not specified', $profile['student_number'], $profile['preferred_industry'] ?: 'Not specified', $posting['required_hours'], $profile['skills'], trim($data['motivation']), $profile['resume_path']]);
    respond(201, ['message' => 'Application sent to the company.', 'applicationId' => (int) $pdo->lastInsertId()]);
} catch (PDOException $exception) {
    error_log($exception->getMessage());
    respond(500, ['message' => 'Unable to submit application.']);
}
