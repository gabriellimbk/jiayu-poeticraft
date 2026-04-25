import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { ArrowLeft, Wand2, FileText, CheckCircle } from "lucide-react";
import { generateSkillsAndExercises } from "../../lib/gemini";
import { supabase } from "../../lib/supabase";
import { APP_TABLE } from "../../lib/db";

export default function TeacherUpload({ isExtra = false }: { isExtra?: boolean }) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    author: "",
    content: "",
    analysisText: "",
  });
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProcessing(true);
    setError(null);

    try {
      // 1. Save Work
      const { data: workData, error: workError } = await supabase
        .from(APP_TABLE)
        .insert({
          record_type: "work",
          title: formData.title,
          author: formData.author,
          content: formData.content,
          analysis_text: formData.analysisText,
          work_type: isExtra ? "extra-curricular" : "in-class",
        })
        .select("id")
        .single();

      if (workError) throw workError;

      const workId = workData.id as string;

      // 2. Generate Skills via Gemini
      const aiResult = await generateSkillsAndExercises(formData.title, formData.content, formData.analysisText, isExtra);
      
      if (!aiResult || !aiResult.skills) {
        throw new Error("AI 生成内容格式错误或为空");
      }

      // 3. Save Skills and Exercises
      for (const skillData of aiResult.skills) {
        const { data: skillRow, error: skillError } = await supabase
          .from(APP_TABLE)
          .insert({
            record_type: "skill",
            work_id: workId,
            category: skillData.category,
            name: skillData.name,
            rubric: skillData.rubric,
          })
          .select("id")
          .single();

        if (skillError) throw skillError;

        if (skillData.exercises && Array.isArray(skillData.exercises)) {
          const exerciseRows = skillData.exercises.map((exData: any) => ({
            record_type: "exercise",
            work_id: workId,
            skill_id: skillRow.id,
            excerpt: exData.excerpt,
            reference_analysis: exData.referenceAnalysis,
          }));

          if (exerciseRows.length > 0) {
            const { error: exerciseError } = await supabase.from(APP_TABLE).insert(exerciseRows);
            if (exerciseError) throw exerciseError;
          }
        }
      }

      setSuccess(true);
      setTimeout(() => navigate("/teacher/management"), 2000);
    } catch (err: any) {
      console.error("Upload failed", err);
      setError(err?.message || "上传失败，请检查网络或 AI 配置");
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="h-[60vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-10 h-10 text-green-600 animate-bounce" />
        </div>
        <h2 className="text-2xl font-serif font-bold">习题生成成功！</h2>
        <p className="text-gray-500">正在前往管理页面...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-8 pb-20"
    >
      <div className="flex items-center gap-4">
        <Link to="/teacher" className="w-10 h-10 flex items-center justify-center hover:bg-white hover:border border-slate-200 rounded-full transition-all text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
          上传{isExtra ? "课外" : "课内"}作品
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 gap-8">
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">作品标题</label>
              <input
                required
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：行路难"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-medium text-slate-700"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">作者姓名</label>
              <input
                required
                type="text"
                value={formData.author}
                onChange={(e) => setFormData({ ...formData, author: e.target.value })}
                placeholder="例如：李白"
                className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-medium text-slate-700"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">诗歌全文内容</label>
            <textarea
              required
              rows={5}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              placeholder="请准确输入诗歌正文..."
              className="w-full p-4 bg-slate-50 rounded-xl border border-slate-200 focus:bg-white focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all resize-none text-slate-700 leading-relaxed font-medium"
            />
          </div>
        </div>

        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-indigo-50 rounded-lg flex items-center justify-center">
              <FileText className="w-4 h-4 text-indigo-600" />
            </div>
            <label className="text-xs font-bold text-slate-800 uppercase tracking-tight">
              {isExtra ? "两个分析题目及参考答案" : "文学分析讲义 (AI 数据源)"}
            </label>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed font-medium">
            {isExtra 
              ? "请在此处输入两个大题的题目及其对应的参考答案。AI 将以此为蓝本，拆解出多道微型鉴赏练习题。" 
              : "在此处输入或粘贴文学分析讲义原文。AI 将以此为基石，通过深度自然语言处理技术提取知识点，并转化成阶梯式的教学练习。"}
          </p>
          <textarea
            required
            rows={12}
            value={formData.analysisText}
            onChange={(e) => setFormData({ ...formData, analysisText: e.target.value })}
            placeholder={isExtra ? "输入题目及参考答案..." : "粘贴讲义文本内容于此..."}
            className="w-full p-6 bg-slate-900 text-indigo-100 rounded-2xl border-0 focus:ring-4 focus:ring-indigo-500/20 outline-none transition-all font-mono text-xs leading-relaxed"
          />
        </div>

        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-center gap-3 text-red-600 animate-in fade-in slide-in-from-top-2">
            <span className="text-xs font-bold uppercase tracking-tight">错误：</span>
            <span className="text-sm font-medium">{error}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={processing}
          className="w-full py-5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-4 shadow-xl shadow-indigo-100"
        >
          {processing ? (
            <span className="animate-spin h-6 w-6 border-4 border-white/20 border-t-white rounded-full" />
          ) : (
            <Wand2 className="w-5 h-5" />
          )}
          <span className="tracking-tight">{processing ? "AI 深度解析讲义并生成习题中..." : "开始 AI 智析并生成习题库"}</span>
        </button>
      </form>
    </motion.div>
  );
}
