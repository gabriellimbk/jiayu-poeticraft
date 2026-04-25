/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Link, Navigate, Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { AnimatePresence, motion } from "motion/react";
import { BookOpen, GraduationCap, KeyRound, LockKeyhole, LogOut, Mail, ShieldCheck, X } from "lucide-react";
import { isRiTeacherEmail, supabase } from "./lib/supabase";
import { StudentIdentity } from "./types";

import Home from "./pages/Home";
import PracticeCategory from "./pages/PracticeCategory";
import PracticeSkill from "./pages/PracticeSkill";
import PracticeExercise from "./pages/PracticeExercise";
import TeacherDashboard from "./pages/teacher/Dashboard";
import TeacherUpload from "./pages/teacher/Upload";
import TeacherManagement from "./pages/teacher/Management";

type AppRole = "student" | "teacher" | null;

const EMPTY_STUDENT_IDENTITY: StudentIdentity = { id: "", name: "" };

function getStudentIdentityFromSearch(search: string): StudentIdentity | null {
  const params = new URLSearchParams(search);
  const id = params.get("id")?.trim();
  if (!id) return null;
  return { id, name: id };
}

function getStudentIdentityFromUrl(): StudentIdentity | null {
  return getStudentIdentityFromSearch(window.location.search);
}

function Header({
  role,
  studentIdentity,
  teacherEmail,
  isTeacher,
  onLogout,
}: {
  role: AppRole;
  studentIdentity: StudentIdentity;
  teacherEmail: string | null;
  isTeacher: boolean;
  onLogout: () => void;
}) {
  const homePath = role === "teacher" && isTeacher ? "/teacher" : "/";

  return (
    <header className="fixed top-0 left-0 right-0 h-16 bg-white border-b border-slate-200 z-50 flex items-center justify-between px-8 shrink-0 shadow-sm">
      <Link to={homePath} className="flex items-center gap-3">
        <div className="w-10 h-10 bg-indigo-600 rounded-lg flex items-center justify-center">
          <BookOpen className="w-6 h-6 text-white" />
        </div>
        <span className="font-bold text-xl tracking-tight text-slate-800">PoetiCraft AI</span>
      </Link>

      <div className="flex items-center gap-4">
        {role === "teacher" && isTeacher && (
          <Link
            to="/teacher"
            className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors"
          >
            教师后台
          </Link>
        )}

        {role && (
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-slate-600">
              {role === "teacher" ? teacherEmail : studentIdentity.name}
            </span>
            <button
              onClick={onLogout}
              className="p-2 text-slate-400 hover:text-red-600 transition-colors"
              title="退出"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </header>
  );
}

function AccessRequired({
  studentIdentity,
  onStudent,
  onTeacher,
}: {
  studentIdentity: StudentIdentity | null;
  onStudent: () => void;
  onTeacher: () => void;
}) {
  const hasStudentIdentity = Boolean(studentIdentity?.id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto space-y-10"
    >
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto">
          <LockKeyhole className="w-8 h-8 text-slate-400" />
        </div>
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">Access Required</h1>
        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">
          Open this page from Canvas using your LMS link
        </p>
        <p className="max-w-xl mx-auto text-sm text-slate-500 leading-relaxed">
          Student access requires a URL like <span className="font-mono text-slate-700">/?id=YOUR_LOGIN_ID</span>.
          The value of <span className="font-mono text-slate-700">id</span> will be used as your current name.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <button
          onClick={onStudent}
          disabled={!hasStudentIdentity}
          className="group p-8 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:shadow-none disabled:hover:border-slate-200"
        >
          <div className="space-y-6">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:bg-indigo-600 transition-all group-disabled:group-hover:bg-indigo-50">
              <GraduationCap className="w-7 h-7 text-indigo-600 group-hover:text-white group-disabled:group-hover:text-indigo-600 transition-colors" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">学生</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                {hasStudentIdentity
                  ? `Continue as ${studentIdentity!.name}.`
                  : "Open from Canvas with ?id=YOUR_LOGIN_ID to enable student access."}
              </p>
            </div>
          </div>
        </button>

        <button
          onClick={onTeacher}
          className="group p-8 bg-white rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-xl transition-all text-left"
        >
          <div className="space-y-6">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:bg-emerald-600 transition-all">
              <ShieldCheck className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-slate-800">教师</h2>
              <p className="text-sm text-slate-500 leading-relaxed">
                Teachers can verify access with an @ri.edu.sg email OTP.
              </p>
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
}

function TeacherOtpModal({
  onClose,
  onSuccess,
}: {
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState<"email" | "otp">("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const normalizedEmail = email.trim().toLowerCase();

  const handleSendOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (!isRiTeacherEmail(normalizedEmail)) {
      setError("请使用 @ri.edu.sg 教师邮箱。");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithOtp({
      email: normalizedEmail,
      options: {
        shouldCreateUser: true,
      },
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    setStep("otp");
  };

  const handleVerifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError("请输入六位验证码。");
      return;
    }

    setLoading(true);
    const { data, error } = await supabase.auth.verifyOtp({
      email: normalizedEmail,
      token: otp,
      type: "email",
    });
    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    if (!isRiTeacherEmail(data.user?.email)) {
      await supabase.auth.signOut();
      setError("该邮箱没有教师访问权限。");
      return;
    }

    onSuccess();
  };

  return (
    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[60] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.98, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden"
      >
        <header className="p-6 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
              {step === "email" ? <Mail className="w-5 h-5 text-emerald-600" /> : <KeyRound className="w-5 h-5 text-emerald-600" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-800">教师验证</h2>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Supabase Email OTP</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-50 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={step === "email" ? handleSendOtp : handleVerifyOtp} className="p-6 space-y-5">
          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">教师邮箱</label>
            <input
              required
              type="email"
              value={email}
              disabled={step === "otp"}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="name@ri.edu.sg"
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-medium"
            />
          </div>

          {step === "otp" && (
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">六位验证码</label>
              <input
                required
                inputMode="numeric"
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, "").slice(0, 6))}
                placeholder="000000"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/5 outline-none transition-all font-bold tracking-[0.4em] text-center text-lg"
              />
            </div>
          )}

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-emerald-600 text-white rounded-xl font-bold hover:bg-emerald-700 disabled:opacity-50 transition-all flex items-center justify-center gap-3 shadow-lg shadow-emerald-100"
          >
            {loading && <span className="w-5 h-5 border-2 border-white/20 border-t-white rounded-full animate-spin" />}
            {step === "email" ? "发送验证码" : "验证并进入后台"}
          </button>
        </form>
      </motion.div>
    </div>
  );
}

function AppShell() {
  const location = useLocation();
  const navigate = useNavigate();
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>(null);
  const [studentIdentity, setStudentIdentity] = useState<StudentIdentity>(() => getStudentIdentityFromUrl() || EMPTY_STUDENT_IDENTITY);
  const [loading, setLoading] = useState(true);
  const [showTeacherLogin, setShowTeacherLogin] = useState(false);

  const isTeacher = isRiTeacherEmail(session?.user.email);
  const hasStudentAccess = role === "student" && Boolean(studentIdentity.id);
  const currentUrlStudentIdentity = getStudentIdentityFromSearch(location.search);

  useEffect(() => {
    const urlIdentity = getStudentIdentityFromSearch(location.search);
    if (urlIdentity && !isTeacher) {
      setStudentIdentity(urlIdentity);
      setRole("student");
    }
  }, [location.search, isTeacher]);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;

      const nextSession = data.session;
      const urlIdentity = getStudentIdentityFromUrl();

      if (isRiTeacherEmail(nextSession?.user.email)) {
        setSession(nextSession);
        setRole("teacher");
      } else {
        if (nextSession) {
          await supabase.auth.signOut();
        }

        if (urlIdentity) {
          setStudentIdentity(urlIdentity);
          setRole("student");
        } else {
          setStudentIdentity(EMPTY_STUDENT_IDENTITY);
          setRole(null);
        }
      }

      setLoading(false);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;

      if (isRiTeacherEmail(nextSession?.user.email)) {
        setSession(nextSession);
        setRole("teacher");
        return;
      }

      setSession(null);
      if (nextSession) {
        void supabase.auth.signOut();
      }
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const enterStudent = () => {
    const urlIdentity = getStudentIdentityFromSearch(location.search);
    if (!urlIdentity) return;
    setStudentIdentity(urlIdentity);
    setRole("student");
    navigate(`/${location.search}`);
  };

  const enterTeacher = () => {
    setShowTeacherLogin(false);
    setRole("teacher");
    navigate("/teacher");
  };

  const handleLogout = async () => {
    setRole(null);
    setSession(null);
    const urlIdentity = getStudentIdentityFromSearch(location.search);
    setStudentIdentity(urlIdentity || EMPTY_STUDENT_IDENTITY);
    await supabase.auth.signOut();
    navigate(`/${location.search}`);
  };

  const accessRequired = (
    <AccessRequired
      studentIdentity={currentUrlStudentIdentity}
      onStudent={enterStudent}
      onTeacher={() => setShowTeacherLogin(true)}
    />
  );

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 bg-indigo-600 rounded-2xl flex items-center justify-center animate-pulse">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <p className="text-slate-400 font-medium tracking-widest text-xs uppercase">PoetiCraft AI Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      <Header
        role={role}
        studentIdentity={studentIdentity}
        teacherEmail={session?.user.email || null}
        isTeacher={isTeacher}
        onLogout={handleLogout}
      />

      <main className="pt-24 pb-12 px-6 max-w-5xl mx-auto">
        <AnimatePresence mode="wait">
          <Routes>
            <Route
              path="/"
              element={role === "teacher" && isTeacher ? <Navigate to="/teacher" replace /> : hasStudentAccess ? <Home /> : accessRequired}
            />
            <Route path="/practice/:workId" element={hasStudentAccess ? <PracticeCategory /> : accessRequired} />
            <Route path="/practice/:workId/:category" element={hasStudentAccess ? <PracticeSkill /> : accessRequired} />
            <Route
              path="/practice/:workId/:category/:skillId"
              element={hasStudentAccess ? <PracticeExercise studentIdentity={studentIdentity} /> : accessRequired}
            />

            <Route path="/teacher" element={isTeacher ? <TeacherDashboard /> : accessRequired} />
            <Route path="/teacher/upload-inclass" element={isTeacher ? <TeacherUpload /> : accessRequired} />
            <Route path="/teacher/upload-extra" element={isTeacher ? <TeacherUpload isExtra /> : accessRequired} />
            <Route path="/teacher/management" element={isTeacher ? <TeacherManagement /> : accessRequired} />
          </Routes>
        </AnimatePresence>
      </main>

      <footer className="py-8 text-center border-t border-slate-200">
        <div className="max-w-xs mx-auto p-4 bg-slate-100 rounded-xl border border-dashed border-slate-300">
          <p className="text-[10px] leading-relaxed text-slate-500 font-medium">
            &copy; 2026 PoetiCraft AI<br />
            Supabase 同步中
          </p>
        </div>
      </footer>

      {showTeacherLogin && <TeacherOtpModal onClose={() => setShowTeacherLogin(false)} onSuccess={enterTeacher} />}
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}
