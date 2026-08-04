# JumpStart API

The active API is an Express/TypeScript application in `src/server.ts`. Prisma's PostgreSQL data model is in `prisma/schema.prisma`.

Authentication uses signed JWTs. The login route returns a token and also sets an HTTP-only cookie. Protected routes accept either that cookie or `Authorization: Bearer <token>`.

## Main routes

| Route | Method | Purpose |
| --- | --- | --- |
| `/api/auth/register` | POST | Create a Student or Company account |
| `/api/auth/login` | POST | Authenticate and issue a JWT |
| `/api/postings` | GET / POST | Browse or create OJT postings |
| `/api/postings/apply` | POST | Apply to an active posting |
| `/api/ojt/apply` | POST | Submit multipart OJT application documents |
| `/api/applications` | GET | List role-appropriate applications |
| `/api/applications/decision` | POST | Company/admin application decision |
| `/api/admin/reports` | GET | Admin summary and OJT progress |

The `.php` route aliases are temporarily supported by Express for compatibility, but new frontend code uses the extensionless routes.
