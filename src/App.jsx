import React, { useState, useRef } from "react";
import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import Toast from "./components/Toast.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import RequestOJT from "./pages/RequestOJT.jsx";
import SignIn from "./pages/SignIn.jsx";
import Register from "./pages/Register.jsx";
import StudentDashboard from "./pages/StudentDashboard.jsx";
import CompanyDashboard from "./pages/CompanyDashboard.jsx";
import AdminDashboard from "./pages/AdminDashboard.jsx";

const portalPageByRole = {
  student: "studentDashboard",
  company: "companyDashboard",
  admin: "adminDashboard",
};

const getSavedUser = () => {
  try {
    const value = sessionStorage.getItem("jumpstart_user") || localStorage.getItem("jumpstart_user");
    return value ? JSON.parse(value) : null;
  } catch {
    return null;
  }
};

const FontLoader = () => (
  <style>{`
    @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700;800&family=Inter:wght@400;500;600;700&display=swap');
    .font-display { font-family: 'Poppins', sans-serif; }
    .font-body { font-family: 'Inter', sans-serif; }
  `}</style>
);

export default function App() {
  const [page, setPage] = useState("home");
  const [currentUser, setCurrentUser] = useState(getSavedUser);
  const [toast, setToast] = useState(null);
  const toastTimer = useRef(null);


 
  const notify = (msg) => {
    setToast(msg);
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2600);
  };

  const navigate = (nextPage) => {
    const userPortal = currentUser && portalPageByRole[currentUser.role];
    if (userPortal && nextPage === "home") {
      setPage(userPortal);
      return;
    }
    if (Object.values(portalPageByRole).includes(nextPage)) {
      setPage(userPortal || "signin");
      return;
    }
    if (userPortal && (nextPage === "signin" || nextPage === "register")) {
      setPage(userPortal);
      return;
    }
    setPage(nextPage);
  };

  const handleLogin = (user, rememberMe) => {
    const storage = rememberMe ? localStorage : sessionStorage;
    storage.setItem("jumpstart_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = () => {
    localStorage.removeItem("jumpstart_auth_token");
    sessionStorage.removeItem("jumpstart_auth_token");
    localStorage.removeItem("jumpstart_user");
    sessionStorage.removeItem("jumpstart_user");
    setCurrentUser(null);
    setPage("home");
  };

  const pages = {
    home: <Home setPage={navigate} />,
    about: <About />,
    request: <RequestOJT notify={notify} user={currentUser} setPage={navigate} />,
    signin: <SignIn setPage={navigate} onLogin={handleLogin} />,
    register: <Register setPage={navigate} />,
    studentDashboard: <StudentDashboard notify={notify} user={currentUser} />,
    companyDashboard: <CompanyDashboard notify={notify} user={currentUser} />,
    adminDashboard: <AdminDashboard notify={notify} user={currentUser} />,
  };

  return (
    <div className="font-body min-h-screen bg-white">
      <FontLoader />
      <Navbar page={page} setPage={navigate} user={currentUser} onLogout={handleLogout} />
      {pages[page]}
      <Footer setPage={navigate} user={currentUser} />
      <Toast message={toast} />
    </div>
  );
}
