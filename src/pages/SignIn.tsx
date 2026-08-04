import { useState } from "react";
import { GraduationCap } from "lucide-react";

const roleMap = {
  student: "studentDashboard",
  company: "companyDashboard",
  admin: "adminDashboard",
};

const API_URL = import.meta.env.VITE_API_URL ?? "";

export default function SignIn({ setPage, onLogin }) {
  const [role, setRole] = useState("Student");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          role: role.toLowerCase(),
          rememberMe,
        }),
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || "Unable to sign in. Please check your credentials.");
      }

      if (data.token) {
        const storage = rememberMe ? localStorage : sessionStorage;
        storage.setItem("jumpstart_auth_token", data.token);
      }

      const returnedRole = (data.user?.role || data.role || role).toLowerCase();
      if (!roleMap[returnedRole]) throw new Error("This account does not have a recognized portal role.");
      onLogin(data.user, rememberMe);
      setPage(returnedRole === "student" ? "request" : roleMap[returnedRole]);
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
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center mx-auto mb-3">
            <GraduationCap className="w-7 h-7 text-white" />
          </div>
          <h1 className="font-display font-bold text-2xl text-slate-900">Welcome to Jump Start</h1>
          <p className="font-body text-sm text-slate-500 mt-1">Sign in to access your portal</p>
        </div>
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
          <div className="flex bg-slate-100 rounded-lg p-1 mb-5">
            {["Student", "Company", "Admin"].map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => setRole(item)}
                className={`flex-1 text-xs font-body font-semibold py-1.5 rounded-md transition-colors ${role === item ? "bg-white shadow-sm text-blue-600" : "text-slate-500"}`}
              >
                {item}
              </button>
            ))}
          </div>
          <label htmlFor="email" className="block text-sm font-body font-medium text-slate-700 mb-1">Email Address</label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={`${role.toLowerCase()}@email.com`}
            autoComplete="email"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-4 bg-white text-slate-900"
          />
          <label htmlFor="password" className="block text-sm font-body font-medium text-slate-700 mb-1">Password</label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            autoComplete="current-password"
            required
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm font-body mb-4 bg-white text-slate-900"
          />
          <div className="flex items-center justify-between text-xs font-body mb-5">
            <label className="flex items-center gap-1.5 text-slate-500">
              <input type="checkbox" checked={rememberMe} onChange={(event) => setRememberMe(event.target.checked)} />
              Remember me
            </label>
            <span className="text-blue-600 cursor-pointer">Forgot password?</span>
          </div>
          {error && <p role="alert" className="mb-4 text-xs font-body text-red-600">{error}</p>}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-body font-semibold py-2.5 rounded-lg hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? "Signing in…" : `Sign In as ${role}`}
          </button>
          <p className="text-center text-xs font-body text-slate-500 mt-3">Don't have an account? <button type="button" onClick={() => setPage("register")} className="text-blue-600 font-medium">Register here</button></p>
        </form>
        <p className="text-center text-xs font-body text-slate-400 mt-5">By signing in, you agree to our Terms of Service and Privacy Policy</p>
      </div>
    </section>
  );
}
