import "dotenv/config";
import path from "node:path";
import fs from "node:fs";
import express, { type NextFunction, type Request, type Response } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import multer from "multer";
import { PrismaClient, type Role } from "@prisma/client";

const prisma = new PrismaClient();
const app = express();
const port = Number(process.env.PORT ?? 3000);
const jwtSecret = process.env.JWT_SECRET ?? process.env.SESSION_SECRET ?? "";
if (!jwtSecret) throw new Error("JWT_SECRET or SESSION_SECRET must be set in the environment.");

type AuthUser = { id: number; role: Role };
declare global { namespace Express { interface Request { user?: AuthUser } } }

app.use(cors({ origin: process.env.CLIENT_URL ?? "http://localhost:5173", credentials: true }));
app.use(express.json({ limit: "1mb" }));
app.use(cookieParser());

const uploadsDir = path.resolve(process.cwd(), "backend", "uploads");
fs.mkdirSync(uploadsDir, { recursive: true });
app.use("/uploads", express.static(uploadsDir));

const upload = multer({
  storage: multer.diskStorage({ destination: uploadsDir, filename: (_req, file, done) => done(null, `${crypto.randomUUID()}${path.extname(file.originalname).toLowerCase()}`) }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, done) => done(null, [".pdf", ".doc", ".docx"].includes(path.extname(file.originalname).toLowerCase())),
});

function asyncRoute(handler: (req: Request, res: Response) => Promise<unknown>) {
  return (req: Request, res: Response, next: NextFunction) => void handler(req, res).catch(next);
}
function authenticate(req: Request, res: Response, next: NextFunction) {
  const bearer = req.get("authorization")?.replace(/^Bearer\s+/i, "");
  const token = bearer || req.cookies.jumpstart_token;
  if (!token) return res.status(401).json({ message: "Please sign in to continue." });
  try { req.user = jwt.verify(token, jwtSecret) as unknown as AuthUser; next(); }
  catch { res.status(401).json({ message: "Your session has expired. Please sign in again." }); }
}
function allow(...roles: Role[]) {
  return [authenticate, (req: Request, res: Response, next: NextFunction) => roles.includes(req.user!.role) ? next() : res.status(403).json({ message: "You do not have permission to perform this action." })];
}
function text(value: unknown) { return typeof value === "string" ? value.trim() : ""; }
function dateOnly(value: unknown) { const date = new Date(`${String(value)}T00:00:00.000Z`); return Number.isNaN(date.valueOf()) ? null : date; }

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post(["/api/auth/register", "/api/auth/register.php"], asyncRoute(async (req, res) => {
  const name = text(req.body.name), email = text(req.body.email).toLowerCase(), password = String(req.body.password ?? ""), role = req.body.role as Role;
  if (!name || !/^\S+@\S+\.\S+$/.test(email) || password.length < 8 || !["student", "company"].includes(role)) return res.status(422).json({ message: "Enter a name, valid email, account type, and password of at least 8 characters." });
  const companyName = text(req.body.companyName), companyAddress = text(req.body.companyAddress), contactPosition = text(req.body.contactPosition);
  if (role === "company" && (!companyName || !companyAddress || !contactPosition)) return res.status(422).json({ message: "Company name, address, and your position in the company are required." });
  const user = await prisma.user.create({ data: { name, email, passwordHash: await bcrypt.hash(password, 12), role, companyProfile: role === "company" ? { create: { companyName, contactName: name, contactPosition, address: companyAddress } } : undefined } });
  res.status(201).json({ message: "Account created.", user: { id: user.id, name, email, role } });
}));

app.post(["/api/auth/login", "/api/auth/login.php"], asyncRoute(async (req, res) => {
  const email = text(req.body.email).toLowerCase(), password = String(req.body.password ?? "");
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return res.status(401).json({ message: "Invalid email or password." });
  const token = jwt.sign({ id: user.id, role: user.role } satisfies AuthUser, jwtSecret, { expiresIn: req.body.rememberMe ? "30d" : "8h" });
  res.cookie("jumpstart_token", token, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: req.body.rememberMe ? 30 * 86400000 : undefined });
  res.json({ message: "Signed in.", token, user: { id: user.id, name: user.name, email: user.email, role: user.role } });
}));

app.post(["/api/auth/logout", "/api/auth/logout.php"], (_req, res) => { res.clearCookie("jumpstart_token"); res.json({ message: "Signed out." }); });

app.get(["/api/postings", "/api/postings/index.php"], asyncRoute(async (req, res) => {
  const companyId = Number(req.query.companyId) || undefined;
  const postings = await prisma.jobPosting.findMany({ where: { status: "active", companyId }, include: { company: { include: { companyProfile: true } } }, orderBy: { createdAt: "desc" } });
  res.json({ postings: postings.map(p => ({ id: p.id, title: p.title, department: p.department, description: p.description, location: p.location, requiredHours: p.requiredHours, requirements: p.requirements, status: p.status, createdAt: p.createdAt, company: p.company.companyProfile?.companyName ?? p.company.name })) });
}));

app.get("/api/company/postings", ...allow("company"), asyncRoute(async (req, res) => {
  const postings = await prisma.jobPosting.findMany({ where: { companyId: req.user!.id }, include: { company: { include: { companyProfile: true } } }, orderBy: { createdAt: "desc" } });
  res.json({ postings: postings.map(p => ({ id: p.id, title: p.title, department: p.department, description: p.description, location: p.location, requiredHours: p.requiredHours, requirements: p.requirements, status: p.status, createdAt: p.createdAt, company: p.company.companyProfile?.companyName ?? p.company.name })) });
}));

app.post(["/api/postings", "/api/postings/index.php"], ...allow("company"), asyncRoute(async (req, res) => {
  const requiredHours = Number(req.body.requiredHours);
  if (!text(req.body.title) || !text(req.body.description) || !Number.isInteger(requiredHours) || requiredHours < 1) return res.status(422).json({ message: "Title, description, and positive requiredHours are required." });
  const posting = await prisma.jobPosting.create({ data: { companyId: req.user!.id, title: text(req.body.title), description: text(req.body.description), department: text(req.body.department) || null, location: text(req.body.location) || null, requirements: text(req.body.requirements) || null, requiredHours, status: ["draft", "active"].includes(req.body.status) ? req.body.status : "active" } });
  res.status(201).json({ message: "Job posting created.", postingId: posting.id });
}));

app.patch("/api/postings/:id", ...allow("company"), asyncRoute(async (req, res) => {
  const id = Number(req.params.id), action = text(req.body.action);
  const posting = await prisma.jobPosting.findFirst({ where: { id, companyId: req.user!.id } });
  if (!posting) return res.status(404).json({ message: "Posting not found." });
  if (action === "close") {
    if (posting.status === "closed") return res.status(422).json({ message: "Posting is already closed." });
    await prisma.jobPosting.update({ where: { id }, data: { status: "closed" } });
    return res.json({ message: "Posting moved to closed postings." });
  }
  if (action === "restore") {
    if (posting.status !== "closed") return res.status(422).json({ message: "Only a closed posting can be restored." });
    await prisma.jobPosting.update({ where: { id }, data: { status: "active" } });
    return res.json({ message: "Posting restored." });
  }
  if (action === "publish") {
    if (posting.status !== "draft") return res.status(422).json({ message: "Only a draft posting can be published." });
    await prisma.jobPosting.update({ where: { id }, data: { status: "active" } });
    return res.json({ message: "Posting published." });
  }
  return res.status(422).json({ message: "Choose close, restore, or publish." });
}));

app.delete("/api/postings/:id", ...allow("company"), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const posting = await prisma.jobPosting.findFirst({ where: { id, companyId: req.user!.id } });
  if (!posting) return res.status(404).json({ message: "Posting not found." });
  if (posting.status !== "closed") return res.status(422).json({ message: "Only a closed posting can be permanently deleted." });
  await prisma.jobPosting.delete({ where: { id } });
  res.json({ message: "Posting permanently deleted." });
}));

app.post(["/api/postings/apply", "/api/postings/apply.php"], ...allow("student"), asyncRoute(async (req, res) => {
  const posting = await prisma.jobPosting.findFirst({ where: { id: Number(req.body.jobPostingId), status: "active" } });
  if (!posting) return res.status(404).json({ message: "This OJT posting is no longer available." });
  const user = await prisma.user.findUnique({ where: { id: req.user!.id }, include: { studentProfile: true } });
  const p = user?.studentProfile;
  if (!user || !p?.phone || !p.school || !p.program || !p.studentNumber || !p.resumePath) return res.status(422).json({ message: "Complete your student profile and upload a resume before applying to a posting." });
  const savedForm = await prisma.ojtApplication.findFirst({ where: { userId: user.id, jobPostingId: null, lastName: { not: "" } }, orderBy: { createdAt: "desc" } });
  const existing = await prisma.ojtApplication.findFirst({ where: { userId: user.id, jobPostingId: posting.id, status: { notIn: ["withdrawn", "rejected"] } } });
  if (existing) {
    if (!existing.lastName.trim() && savedForm?.lastName.trim()) await prisma.ojtApplication.update({ where: { id: existing.id }, data: { firstName: savedForm.firstName, lastName: savedForm.lastName } });
    return res.json({ message: "Your application has already been sent to the company.", applicationId: existing.id, alreadyApplied: true });
  }
  const [firstName, ...last] = user.name.split(/\s+/);
  const application = await prisma.ojtApplication.create({ data: { userId: user.id, jobPostingId: posting.id, firstName: savedForm?.firstName || firstName, lastName: savedForm?.lastName || last.join(" "), email: user.email, phone: savedForm?.phone || p.phone, school: savedForm?.school || p.school, program: savedForm?.program || p.program, yearLevel: savedForm?.yearLevel || p.yearLevel || "Not specified", studentIdNumber: savedForm?.studentIdNumber || p.studentNumber, preferredIndustry: savedForm?.preferredIndustry || p.preferredIndustry || "Not specified", requiredHours: posting.requiredHours, preferredStartDate: savedForm?.preferredStartDate || new Date(), skills: savedForm?.skills || p.skills, motivation: text(req.body.motivation) || savedForm?.motivation || "Interested in this OJT opportunity.", resumePath: savedForm?.resumePath || p.resumePath, transcriptPath: savedForm?.transcriptPath || null } });
  res.status(201).json({ message: "Application sent to the company.", applicationId: application.id });
}));

app.get("/api/documents", ...allow("student"), asyncRoute(async (req, res) => {
  const rows = await prisma.document.findMany({ where: { userId: req.user!.id, documentType: { in: ["resume", "transcript"] } }, orderBy: { createdAt: "desc" } });
  const latest = rows.filter((row, index) => rows.findIndex(candidate => candidate.documentType === row.documentType) === index);
  res.json({ documents: latest.map(row => ({ id: row.id, type: row.documentType, name: row.originalName, createdAt: row.createdAt })) });
}));

app.post(["/api/ojt/apply", "/api/ojt/apply.php"], ...allow("student"), upload.fields([{ name: "resume", maxCount: 1 }, { name: "transcript", maxCount: 1 }]), asyncRoute(async (req, res) => {
  const files = req.files as Record<string, Express.Multer.File[]> | undefined, resume = files?.resume?.[0], transcript = files?.transcript?.[0];
  const requiredHours = Number(req.body.hours), startDate = dateOnly(req.body.startDate);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: req.user!.id } });
  const savedDocuments = await prisma.document.findMany({ where: { userId: user.id, documentType: { in: ["resume", "transcript"] } }, orderBy: { createdAt: "desc" } });
  const savedResume = savedDocuments.find(document => document.documentType === "resume");
  const savedTranscript = savedDocuments.find(document => document.documentType === "transcript");
  if ((!resume && !savedResume) || !startDate || !Number.isInteger(requiredHours) || requiredHours < 1) return res.status(422).json({ message: "Complete all required fields and attach or save a resume." });
  const resumePath = resume ? `uploads/${resume.filename}` : savedResume!.storagePath;
  const transcriptPath = transcript ? `uploads/${transcript.filename}` : savedTranscript?.storagePath ?? null;
  const replacedPaths: string[] = [];
  const application = await prisma.$transaction(async tx => {
    await tx.studentProfile.upsert({ where: { userId: user.id }, update: { phone: text(req.body.phone), school: text(req.body.school), program: text(req.body.program), yearLevel: text(req.body.yearLevel) || "4th Year", studentNumber: text(req.body.studentId), skills: text(req.body.skills), preferredIndustry: text(req.body.industry), resumePath }, create: { userId: user.id, phone: text(req.body.phone), school: text(req.body.school), program: text(req.body.program), yearLevel: text(req.body.yearLevel) || "4th Year", studentNumber: text(req.body.studentId), skills: text(req.body.skills), preferredIndustry: text(req.body.industry), resumePath } });
    if (resume) {
      replacedPaths.push(...savedDocuments.filter(document => document.documentType === "resume").map(document => document.storagePath));
      await tx.document.deleteMany({ where: { userId: user.id, documentType: "resume" } });
      await tx.document.create({ data: { userId: user.id, documentType: "resume", originalName: resume.originalname, storagePath: resumePath } });
    }
    if (transcript) {
      replacedPaths.push(...savedDocuments.filter(document => document.documentType === "transcript").map(document => document.storagePath));
      await tx.document.deleteMany({ where: { userId: user.id, documentType: "transcript" } });
      await tx.document.create({ data: { userId: user.id, documentType: "transcript", originalName: transcript.originalname, storagePath: transcriptPath! } });
    }
    return tx.ojtApplication.create({ data: { userId: user.id, firstName: text(req.body.firstName), lastName: text(req.body.lastName), email: user.email, phone: text(req.body.phone), school: text(req.body.school), program: text(req.body.program), yearLevel: text(req.body.yearLevel) || "4th Year", studentIdNumber: text(req.body.studentId), preferredIndustry: text(req.body.industry), requiredHours, preferredStartDate: startDate, skills: text(req.body.skills), motivation: text(req.body.motivation), resumePath, transcriptPath } });
  });
  for (const storagePath of replacedPaths) {
    const storedFile = path.join(uploadsDir, path.basename(storagePath));
    await fs.promises.unlink(storedFile).catch(error => { if ((error as NodeJS.ErrnoException).code !== "ENOENT") console.error("Unable to remove replaced document", error); });
  }
  res.status(201).json({ message: "OJT application submitted.", applicationId: application.id });
}));

app.get(["/api/applications", "/api/applications/index.php"], ...allow("student", "company", "admin"), asyncRoute(async (req, res) => {
  const where = req.user!.role === "student" ? { userId: req.user!.id } : req.user!.role === "company" ? { posting: { companyId: req.user!.id } } : {};
  const rows = await prisma.ojtApplication.findMany({ where, include: { posting: { include: { company: { include: { companyProfile: true } } } } }, orderBy: { createdAt: "desc" } });
  res.json({ applications: rows.map(a => ({ id: a.id, firstName: a.firstName, lastName: a.lastName, email: a.email, phone: a.phone, school: a.school, program: a.program, yearLevel: a.yearLevel, studentId: a.studentIdNumber, preferredIndustry: a.preferredIndustry, requiredHours: a.requiredHours, preferredStartDate: a.preferredStartDate, skills: a.skills, motivation: a.motivation, status: a.status, companyStatus: a.companyStatus, createdAt: a.createdAt, postingId: a.posting?.id ?? null, postingTitle: a.posting?.title ?? null, company: a.posting?.company.companyProfile?.companyName ?? null, hasResume: Boolean(a.resumePath), hasTranscript: Boolean(a.transcriptPath) })) });
}));

app.get("/api/applications/:id/documents/:type", ...allow("student", "company", "admin"), asyncRoute(async (req, res) => {
  const id = Number(req.params.id), type = String(req.params.type);
  if (!Number.isInteger(id) || !["resume", "transcript"].includes(type)) return res.status(400).json({ message: "Invalid document request." });
  const application = await prisma.ojtApplication.findUnique({ where: { id }, include: { posting: true } });
  if (!application) return res.status(404).json({ message: "Application not found." });
  const canView = req.user!.role === "admin" || (req.user!.role === "student" && application.userId === req.user!.id) || (req.user!.role === "company" && application.posting?.companyId === req.user!.id);
  if (!canView) return res.status(403).json({ message: "You do not have permission to view this document." });
  const storagePath = type === "resume" ? application.resumePath : application.transcriptPath;
  if (!storagePath) return res.status(404).json({ message: `${type === "resume" ? "Resume" : "Transcript"} not provided.` });
  const filePath = path.join(uploadsDir, path.basename(storagePath));
  if (!fs.existsSync(filePath)) return res.status(404).json({ message: "The uploaded file could not be found." });
  res.sendFile(filePath);
}));

app.patch("/api/applications/:id", ...allow("student"), asyncRoute(async (req, res) => {
  const id = Number(req.params.id), action = String(req.body.action);
  const application = await prisma.ojtApplication.findFirst({ where: { id, userId: req.user!.id }, include: { placement: true, posting: true } });
  if (!application) return res.status(404).json({ message: "Application not found." });
  if (application.placement || ["approved", "rejected"].includes(application.status)) return res.status(422).json({ message: "This application can no longer be changed." });
  if (action === "withdraw") {
    if (!["pending", "reviewed"].includes(application.status)) return res.status(422).json({ message: "Only an active application can be withdrawn." });
    await prisma.ojtApplication.update({ where: { id }, data: { status: "withdrawn" } });
    return res.json({ message: "Application withdrawn." });
  }
  if (action === "restore") {
    if (application.status !== "withdrawn") return res.status(422).json({ message: "Only a withdrawn application can be restored." });
    if (application.posting && application.posting.status !== "active") return res.status(422).json({ message: "This position is no longer active, so the application cannot be restored." });
    await prisma.ojtApplication.update({ where: { id }, data: { status: "pending", companyStatus: "pending", reviewedBy: null, reviewedAt: null, reviewNotes: null } });
    return res.json({ message: "Application restored." });
  }
  if (action === "edit") {
    if (!["pending", "withdrawn"].includes(application.status)) return res.status(422).json({ message: "Only pending or withdrawn applications can be edited." });
    const requiredHours = Number(req.body.requiredHours), preferredStartDate = dateOnly(req.body.preferredStartDate);
    const requiredText = ["firstName", "lastName", "email", "phone", "school", "program", "yearLevel", "studentId", "preferredIndustry", "motivation"];
    if (requiredText.some(field => !text(req.body[field])) || !/^\S+@\S+\.\S+$/.test(text(req.body.email)) || !Number.isInteger(requiredHours) || requiredHours < 1 || !preferredStartDate) return res.status(422).json({ message: "Complete all required application fields with valid values." });
    const updated = await prisma.ojtApplication.update({ where: { id }, data: { firstName: text(req.body.firstName), lastName: text(req.body.lastName), email: text(req.body.email).toLowerCase(), phone: text(req.body.phone), school: text(req.body.school), program: text(req.body.program), yearLevel: text(req.body.yearLevel), studentIdNumber: text(req.body.studentId), preferredIndustry: text(req.body.preferredIndustry), requiredHours, preferredStartDate, skills: text(req.body.skills) || null, motivation: text(req.body.motivation) } });
    return res.json({ message: "Application updated.", application: updated });
  }
  res.status(422).json({ message: "Unsupported application action." });
}));

app.delete("/api/applications/:id", ...allow("student"), asyncRoute(async (req, res) => {
  const id = Number(req.params.id);
  const application = await prisma.ojtApplication.findFirst({ where: { id, userId: req.user!.id }, include: { placement: true } });
  if (!application) return res.status(404).json({ message: "Application not found." });
  if (application.status !== "withdrawn" || application.placement) return res.status(422).json({ message: "Only a withdrawn application without a placement can be permanently deleted." });
  await prisma.ojtApplication.delete({ where: { id } });
  res.json({ message: "Application permanently deleted." });
}));

app.post(["/api/applications/decision", "/api/applications/decision.php"], ...allow("company", "admin"), asyncRoute(async (req, res) => {
  const id = Number(req.body.applicationId), decision = String(req.body.decision);
  const application = await prisma.ojtApplication.findUnique({ where: { id }, include: { posting: true } });
  if (!application) return res.status(404).json({ message: "Application not found." });
  if (req.user!.role === "company") {
    if (application.posting?.companyId !== req.user!.id) return res.status(403).json({ message: "You can only decide on applicants for your postings." });
    if (!["accepted", "rejected"].includes(decision)) return res.status(422).json({ message: "Company decisions must be accepted or rejected." });
    await prisma.ojtApplication.update({ where: { id }, data: { companyStatus: decision as "accepted" | "rejected", status: decision === "rejected" ? "rejected" : "reviewed", reviewNotes: text(req.body.notes) } });
  } else {
    if (!["approved", "rejected"].includes(decision) || (decision === "approved" && application.companyStatus !== "accepted") || !application.posting?.companyId) return res.status(422).json({ message: "The company must accept the applicant before placement approval." });
    await prisma.$transaction(async tx => { await tx.ojtApplication.update({ where: { id }, data: { status: decision as "approved" | "rejected", reviewedBy: req.user!.id, reviewedAt: new Date(), reviewNotes: text(req.body.notes) } }); if (decision === "approved") await tx.placement.create({ data: { applicationId: id, studentId: application.userId, companyId: application.posting!.companyId, jobPostingId: application.jobPostingId, startDate: application.preferredStartDate, requiredHours: application.requiredHours, status: "active", approvedBy: req.user!.id, approvedAt: new Date() } }); });
  }
  res.json({ message: "Application decision saved." });
}));

app.get(["/api/ojt/my-application", "/api/ojt/my-application.php"], ...allow("student"), asyncRoute(async (req, res) => {
  const application = await prisma.ojtApplication.findFirst({ where: { userId: req.user!.id }, orderBy: { createdAt: "desc" }, select: { id: true, firstName: true, lastName: true, phone: true, school: true, program: true, yearLevel: true } });
  res.json({ application });
}));

app.get(["/api/internships/time-records", "/api/internships/time-records.php"], ...allow("student", "company", "admin"), asyncRoute(async (req, res) => {
  const placementId = Number(req.query.placementId);
  const placement = await prisma.placement.findUnique({ where: { id: placementId } });
  if (!placementId || !placement || (req.user!.role !== "admin" && ![placement.studentId, placement.companyId].includes(req.user!.id))) return res.status(403).json({ message: "You do not have access to this internship." });
  const records = await prisma.timeRecord.findMany({ where: { placementId }, orderBy: { workDate: "desc" } });
  res.json({ records: records.map(r => ({ id: r.id, workDate: r.workDate, clockIn: r.clockIn, clockOut: r.clockOut, hoursWorked: Number(r.hoursWorked), status: r.status, notes: r.notes })) });
}));

app.post(["/api/internships/time-records", "/api/internships/time-records.php"], ...allow("student"), asyncRoute(async (req, res) => {
  const placementId = Number(req.body.placementId), action = String(req.body.action), now = new Date(), workDate = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const placement = await prisma.placement.findFirst({ where: { id: placementId, studentId: req.user!.id, status: "active" } });
  if (!placement) return res.status(403).json({ message: "You do not have access to this internship." });
  if (action === "clock-in") {
    await prisma.timeRecord.upsert({ where: { placementId_workDate: { placementId, workDate } }, update: {}, create: { placementId, workDate, clockIn: now } });
    return res.json({ message: "Clock-in recorded." });
  }
  if (action === "clock-out") {
    const record = await prisma.timeRecord.findUnique({ where: { placementId_workDate: { placementId, workDate } } });
    if (!record?.clockIn) return res.status(422).json({ message: "Clock in before clocking out." });
    const hoursWorked = Math.max(0, Math.round(((now.valueOf() - record.clockIn.valueOf()) / 3600000) * 100) / 100);
    await prisma.timeRecord.update({ where: { id: record.id }, data: { clockOut: now, hoursWorked, status: "submitted" } });
    return res.json({ message: "Clock-out recorded." });
  }
  res.status(422).json({ message: "Unsupported time-record action." });
}));

app.get(["/api/internships/evaluations", "/api/internships/evaluations.php"], ...allow("student", "company", "admin"), asyncRoute(async (req, res) => {
  const placementId = Number(req.query.placementId), placement = await prisma.placement.findUnique({ where: { id: placementId } });
  if (!placement || (req.user!.role !== "admin" && ![placement.studentId, placement.companyId].includes(req.user!.id))) return res.status(403).json({ message: "You do not have access to this internship." });
  const evaluations = await prisma.evaluation.findMany({ where: { placementId }, orderBy: { periodEnd: "desc" } });
  res.json({ evaluations: evaluations.map(e => ({ ...e, overallScore: e.overallScore === null ? null : Number(e.overallScore) })) });
}));

app.post(["/api/internships/evaluations", "/api/internships/evaluations.php"], ...allow("company"), asyncRoute(async (req, res) => {
  const placementId = Number(req.body.placementId), periodType = req.body.periodType, periodStart = dateOnly(req.body.periodStart), periodEnd = dateOnly(req.body.periodEnd);
  const placement = await prisma.placement.findFirst({ where: { id: placementId, companyId: req.user!.id } });
  const scores = [req.body.workQuality, req.body.attendance, req.body.communication].filter(v => v !== undefined && v !== "").map(Number);
  if (!placement || !periodStart || !periodEnd || !["weekly", "monthly", "final"].includes(periodType) || scores.some(v => !Number.isInteger(v) || v < 1 || v > 5)) return res.status(422).json({ message: "Enter a valid evaluation period and scores from 1 to 5." });
  const overallScore = scores.length ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100 : null;
  await prisma.evaluation.upsert({ where: { placementId_periodType_periodStart_periodEnd: { placementId, periodType, periodStart, periodEnd } }, update: { evaluatorId: req.user!.id, workQuality: req.body.workQuality ? Number(req.body.workQuality) : null, attendance: req.body.attendance ? Number(req.body.attendance) : null, communication: req.body.communication ? Number(req.body.communication) : null, overallScore, comments: text(req.body.comments) }, create: { placementId, evaluatorId: req.user!.id, periodType, periodStart, periodEnd, workQuality: req.body.workQuality ? Number(req.body.workQuality) : null, attendance: req.body.attendance ? Number(req.body.attendance) : null, communication: req.body.communication ? Number(req.body.communication) : null, overallScore, comments: text(req.body.comments) } });
  res.status(201).json({ message: "Evaluation saved.", overallScore });
}));

app.get(["/api/admin/reports", "/api/admin/reports.php"], ...allow("admin"), asyncRoute(async (_req, res) => {
  const [students, companies, activePostings, activeInternships, pendingApplications, placements] = await Promise.all([prisma.user.count({ where: { role: "student" } }), prisma.user.count({ where: { role: "company" } }), prisma.jobPosting.count({ where: { status: "active" } }), prisma.placement.count({ where: { status: "active" } }), prisma.ojtApplication.count({ where: { status: "pending" } }), prisma.placement.findMany({ where: { status: "active" }, include: { student: true, company: { include: { companyProfile: true } }, timeRecords: { where: { status: "approved" } } } })]);
  res.json({ summary: { students, companies, activePostings, activeInternships, pendingApplications }, ojtProgress: placements.map(p => ({ placementId: p.id, student: p.student.name, company: p.company.companyProfile?.companyName ?? p.company.name, requiredHours: p.requiredHours, approvedHours: p.timeRecords.reduce((sum, r) => sum + Number(r.hoursWorked), 0) })) });
}));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  console.error(error);
  const code = typeof error === "object" && error && "code" in error ? String(error.code) : "";
  if (code === "P2002") return res.status(409).json({ message: "A record with those details already exists." });
  res.status(500).json({ message: "The server could not process this request." });
});

app.listen(port, () => console.log(`JumpStart API listening on http://localhost:${port}`));

process.on("SIGTERM", () => void prisma.$disconnect());
