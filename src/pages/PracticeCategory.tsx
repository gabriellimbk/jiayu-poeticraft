import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ChevronRight, Heart, Sparkles, ArrowLeft } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { APP_TABLE, mapWork, WorkRow } from "../lib/db";

export default function PracticeCategory() {
  const { workId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkWorkType() {
      if (!workId) return;
      const { data, error } = await supabase
        .from(APP_TABLE)
        .select("*")
        .eq("record_type", "work")
        .eq("id", workId)
        .maybeSingle();

      if (!error && data) {
        const workData = mapWork(data as WorkRow);
        if (workData.type === 'extra-curricular') {
          // Extra-curricular works don't use category splitting
          navigate(`/practice/${workId}/综合鉴赏`, { replace: true });
        }
      }
      setLoading(false);
    }
    checkWorkType();
  }, [workId, navigate]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-8 text-center space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium tracking-tight">正在加载...</p>
      </div>
    );
  }

  const categories = [
    { title: "思想内容", icon: Heart, description: "分析诗人在作品中所表达的情感、思想及社会意义。", color: "text-emerald-700", bg: "bg-emerald-50", border: "border-t-emerald-500" },
    { title: "艺术特色", icon: Sparkles, description: "探讨作品在结构、语言、表达技巧等方面的独特艺术造诣。", color: "text-orange-700", bg: "bg-orange-50", border: "border-t-orange-500" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-12"
    >
      <div className="flex items-center gap-4">
        <Link to="/" className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-full transition-all text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">选择练习维度</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((cat) => (
          <Link
            key={cat.title}
            to={`/practice/${workId}/${cat.title}`}
            className={`group flex flex-col justify-between bg-white rounded-2xl border border-slate-200 p-8 shadow-sm border-t-4 ${cat.border} hover:shadow-xl transition-all duration-300`}
          >
            <div className="space-y-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mb-1 tracking-widest">习题分类</p>
                  <h4 className="text-3xl font-bold text-slate-800">{cat.title}</h4>
                </div>
                <div className={`p-3 ${cat.bg} rounded-xl`}>
                  <cat.icon className={`w-6 h-6 ${cat.color}`} />
                </div>
              </div>
              <p className="text-slate-500 leading-relaxed font-medium">{cat.description}</p>
            </div>
            
            <div className="mt-8 flex items-center gap-2 text-indigo-600 font-bold text-sm">
              <span>进入微技能列表</span>
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
