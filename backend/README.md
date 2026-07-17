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
