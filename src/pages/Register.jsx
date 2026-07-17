import { useState } from "react";
import { GraduationCap } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function Register({ setPage }) {
  const [form, setForm] = useState({ name: "", email: "", password: "", confirmPassword: "", role: "student" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register.php`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: form.name, email: form.email, password: form.password, role: form.role }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || `Registration service returned an error (HTTP ${response.status}).`);

      setSuccess("Account created. You can now sign in.");
      setForm({ name: "", email: "", password: "", confirmPassword: "", role: "student" });
    } catch (requestError) {
      setError(requestError.message || "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="min-h-[80vh] bg-gradient-to-b from-blue-50 to-cyan-50 flex items-center justify-center py-16">
      <div className="w-full max-w-sm px-5">
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-3"><GraduationCap className="w-7 h-7 text-white" /></div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Create your account</h1>
          <p className="font-body text-sm text-slate-500 mt-1">Join Jump Start to manage your OJT journey</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <label htmlFor="name" className="block text-sm font-body font-medium text-slate-700 mb-1">Full name</label>
          <input id="name" name="name" value={form.name} onChange={updateField} autoComplete="name" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-4 bg-white text-slate-900" />
          <label htmlFor="register-email" className="block text-sm font-body font-medium text-slate-700 mb-1">Email address</label>
          <input id="register-email" name="email" type="email" value={form.email} onChange={updateField} autoComplete="email" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-4 bg-white text-slate-900" />
          <label htmlFor="register-role" className="block text-sm font-body font-medium text-slate-700 mb-1">Account type</label>
          <select id="register-role" name="role" value={form.role} onChange={updateField} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-4 bg-white text-slate-900">
            <option value="student">Student</option>
            <option value="company">Company</option>
          </select>
          <label htmlFor="register-password" className="block text-sm font-body font-medium text-slate-700 mb-1">Password</label>
          <input id="register-password" name="password" type="password" value={form.password} onChange={updateField} autoComplete="new-password" minLength="8" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-4 bg-white text-slate-900" />
          <label htmlFor="confirm-password" className="block text-sm font-body font-medium text-slate-700 mb-1">Confirm password</label>
          <input id="confirm-password" name="confirmPassword" type="password" value={form.confirmPassword} onChange={updateField} autoComplete="new-password" minLength="8" required className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-4 bg-white text-slate-900" />
          {error && <p role="alert" className="mb-4 text-xs font-body text-red-600">{error}</p>}
          {success && <p role="status" className="mb-4 text-xs font-body text-emerald-600">{success}</p>}
          <button type="submit" disabled={isSubmitting} className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-body font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60">{isSubmitting ? "Creating account…" : "Create Account"}</button>
          <p className="text-center text-xs font-body text-slate-500 mt-3">Already have an account? <button type="button" onClick={() => setPage("signin")} className="text-blue-600 font-medium">Sign in</button></p>
        </form>
      </div>
    </section>
  );
}
