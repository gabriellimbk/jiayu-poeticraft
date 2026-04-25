import { useState, useEffect } from "react";
import { Work } from "../types";
import { Link } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronRight, BookOpen, AlertCircle, RefreshCw, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { APP_TABLE, mapWork, WorkRow } from "../lib/db";

export default function Home() {
  const [works, setWorks] = useState<Work[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWorks = async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase
        .from(APP_TABLE)
        .select("*")
        .eq("record_type", "work")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setWorks(((data || []) as WorkRow[]).map(mapWork));
    } catch (err: any) {
      console.error("Error fetching works:", err);
      setError(err.message || "无法连接至数据库，请检查网络或刷新页面");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWorks();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-8"
    >
      <div className="text-center space-y-4">
        <h1 className="text-4xl font-extrabold tracking-tight text-slate-800">选择练习作品</h1>
        <p className="text-slate-500 font-medium uppercase tracking-widest text-xs">Pick a classic work to begin analysis</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-slate-400 font-medium">作品正在赶来的路上...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-100 p-8 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto" />
          <div className="space-y-2">
            <h3 className="text-lg font-bold text-red-900">同步出错啦</h3>
            <p className="text-red-700">{error}</p>
          </div>
          <button 
            onClick={fetchWorks}
            className="px-6 py-2 bg-white text-red-600 rounded-xl font-bold border border-red-200 hover:bg-red-50 transition-colors shadow-sm"
          >
            重试
          </button>
        </div>
      ) : works.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <BookOpen className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">当前暂无可见作品</p>
          <p className="text-slate-300 text-sm mt-2">提示教师登录后台并上传作品</p>
        </div>
      ) : (
        <div className="space-y-12">
          {/* In-class Works Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-200">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">课内作品 · 循序渐进</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {works.filter(w => !w.type || w.type === 'in-class').map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
            </div>
          </section>

          {/* Extra-curricular Works Section */}
          <section className="space-y-6">
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 bg-emerald-600 rounded-lg flex items-center justify-center shadow-lg shadow-emerald-200">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">课外作品 · 独立鉴赏</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {works.filter(w => w.type === 'extra-curricular').map((work) => (
                <WorkCard key={work.id} work={work} />
              ))}
              {works.filter(w => w.type === 'extra-curricular').length === 0 && (
                <div className="col-span-full py-12 bg-slate-50 border border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-slate-400">
                   <p className="text-xs font-bold uppercase tracking-widest">暂无课外练习作品</p>
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </motion.div>
  );
}

function WorkCard({ work }: { work: Work }) {
  return (
    <Link
      to={`/practice/${work.id}`}
      className="group relative p-8 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-xl transition-all duration-300 shadow-sm"
    >
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <div className={`px-2 py-1 border rounded-lg inline-block ${work.type === 'extra-curricular' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
              <p className="text-[10px] font-bold uppercase tracking-tight">{work.author}</p>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
            {work.title}
          </h3>
        </div>
        <div className="w-10 h-10 bg-slate-50 rounded-full flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-300">
          <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
        </div>
      </div>
    </Link>
  );
}
