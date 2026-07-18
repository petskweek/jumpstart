# XAMPP setup

1. Start Apache and MySQL in the XAMPP Control Panel.
2. Open `http://localhost/phpmyadmin`, create/import the database by importing `database.sql`.
3. Copy the **contents** of this `backend` folder to `C:\xampp\htdocs\jumpstart-api`. The register endpoint will then be at `http://localhost/jumpstart-api/api/auth/register.php`.
4. In the frontend project root, create `.env` with:

   ```env
   VITE_API_URL=http://localhost/jumpstart-api
   ```

5. Restart Vite after changing `.env`.

The PHP API uses XAMPP's default MySQL settings: host `127.0.0.1`, database `jumpstart`, user `root`, blank password. To use different credentials, set `DB_HOST`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` in Apache's environment or change those defaults in `api/bootstrap.php`.

Only Student and Company roles can be registered publicly. Create administrator accounts directly in the database.

## API workflow

The database implements the activity diagram end-to-end: student profiles/documents and OJT applications; company job postings, applicant decisions, intern monitoring and evaluations; and school-admin placement approval and reports.

| Route | Method | Purpose |
| --- | --- | --- |
| `api/postings/index.php` | GET / POST | Browse active postings or create a company posting |
| `api/postings/apply.php` | POST | Student applies to an active posting using their saved profile |
| `api/applications/index.php` | GET | Get applications appropriate to the signed-in role |
| `api/applications/decision.php` | POST | Company accepts/rejects; admin approves/rejects and creates placement |
| `api/internships/time-records.php` | GET / POST | Read DTR entries; student clock-in or clock-out |
| `api/internships/evaluations.php` | GET / POST | Read evaluations; company creates weekly/monthly/final evaluations |
| `api/admin/reports.php` | GET | Admin system summary and active OJT progress |

All non-public endpoints use the existing PHP session cookie. Send requests with `credentials: "include"` from the frontend.
