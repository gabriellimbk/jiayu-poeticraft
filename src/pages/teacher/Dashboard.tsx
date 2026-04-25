import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { Upload, Database, Users, TrendingUp } from "lucide-react";
import { supabase } from "../../lib/supabase";

export default function TeacherDashboard() {
  const [workCount, setWorkCount] = useState("...");
  const [studentCount, setStudentCount] = useState("...");

  useEffect(() => {
    async function fetchStats() {
      const [{ count: works }, { data: submissions }] = await Promise.all([
        supabase.from("works").select("id", { count: "exact", head: true }),
        supabase.from("submissions").select("student_id"),
      ]);

      setWorkCount(String(works ?? 0));
      const uniqueStudents = new Set((submissions || []).map(row => row.student_id).filter(Boolean));
      setStudentCount(String(uniqueStudents.size));
    }

    fetchStats().catch(error => {
      console.error("Failed to fetch teacher stats:", error);
      setWorkCount("0");
      setStudentCount("0");
    });
  }, []);

  const stats = [
    { label: "已上传作品", value: workCount, icon: TrendingUp, color: "text-green-500", bg: "bg-green-50" },
    { label: "活跃学生", value: studentCount, icon: Users, color: "text-blue-500", bg: "bg-blue-50" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="space-y-12"
    >
      <div className="space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">教师管理中心</h1>
        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Manage works and coordinate exercises</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/teacher/upload-inclass"
          className="group relative p-8 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-2xl transition-all overflow-hidden shadow-sm"
        >
          <div className="relative z-10 space-y-4">
            <div className="w-14 h-14 bg-indigo-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 transition-all duration-300">
              <Upload className="w-7 h-7 text-indigo-600 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">上传课内作品</h3>
              <p className="text-slate-500 text-xs leading-relaxed">上传文学讲义，AI 解析生成具体的微技能习题。</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
        </Link>

        <Link
          to="/teacher/upload-extra"
          className="group relative p-8 bg-white rounded-2xl border border-slate-200 hover:border-emerald-200 hover:shadow-2xl transition-all overflow-hidden shadow-sm"
        >
          <div className="relative z-10 space-y-4">
            <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-600 transition-all duration-300">
              <Upload className="w-7 h-7 text-emerald-600 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">上传课外作品</h3>
              <p className="text-slate-500 text-xs leading-relaxed">上传课外诗歌分析，AI 生成匿名标题的鉴赏练习。</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50/50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
        </Link>

        <Link
          to="/teacher/management"
          className="group relative p-8 bg-white rounded-2xl border border-slate-200 hover:border-slate-400 hover:shadow-2xl transition-all overflow-hidden shadow-sm"
        >
          <div className="relative z-10 space-y-4">
            <div className="w-14 h-14 bg-slate-50 rounded-2xl flex items-center justify-center group-hover:scale-110 group-hover:bg-slate-800 transition-all duration-300">
              <Database className="w-7 h-7 text-slate-400 group-hover:text-white transition-colors" />
            </div>
            <div className="space-y-1">
              <h3 className="text-xl font-bold text-slate-800">题库管理</h3>
              <p className="text-slate-500 text-xs leading-relaxed">管理已录入的作品、微技能、例句及其评价标准。</p>
            </div>
          </div>
          <div className="absolute top-0 right-0 w-24 h-24 bg-slate-100/50 rounded-bl-full -mr-12 -mt-12 group-hover:scale-150 transition-transform duration-700" />
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-6">
        {stats.map((item) => (
          <div key={item.label} className="p-8 bg-white rounded-2xl border border-slate-200 flex items-center gap-8 shadow-sm">
            <div className={`w-14 h-14 ${item.bg} rounded-2xl flex items-center justify-center`}>
              <item.icon className={`w-7 h-7 ${item.color}`} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{item.label}</p>
              <p className="text-3xl font-extrabold text-slate-800">{item.value}</p>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}
