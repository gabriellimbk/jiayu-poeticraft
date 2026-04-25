import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Skill, Exercise, StudentIdentity } from "../types";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, Send, Sparkles, CheckCircle2, AlertCircle } from "lucide-react";
import { getStudentFeedback } from "../lib/gemini";
import Markdown from "react-markdown";
import { supabase } from "../lib/supabase";
import { ExerciseRow, mapExercise, mapSkill, SkillRow } from "../lib/db";

export default function PracticeExercise({ studentIdentity }: { studentIdentity: StudentIdentity }) {
  const { workId, skillId, category } = useParams();
  const [skill, setSkill] = useState<Skill | null>(null);
  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [studentContent, setStudentContent] = useState("");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const { data: skillData, error: skillError } = await supabase
          .from("skills")
          .select("*")
          .eq("id", skillId)
          .maybeSingle();

        if (skillError) throw skillError;
        if (skillData) {
          setSkill(mapSkill(skillData as SkillRow));
        }

        const { data: exerciseData, error: exerciseError } = await supabase
          .from("exercises")
          .select("*")
          .eq("skill_id", skillId);

        if (exerciseError) throw exerciseError;

        const exercises = ((exerciseData || []) as ExerciseRow[]).map(mapExercise);
        if (exercises.length > 0) {
          // Pick a random exercise from the pool
          const randomIndex = Math.floor(Math.random() * exercises.length);
          setExercise(exercises[randomIndex]);
        }
      } catch (err) {
        console.error("Error fetching exercise data:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [skillId]);

  const handleSubmit = async () => {
    if (!studentContent.trim() || !exercise || !skill) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const aiFeedback = await getStudentFeedback(studentContent, exercise.excerpt, skill.rubric);
      setFeedback(aiFeedback);

      const { error } = await supabase.from("submissions").insert({
        exercise_id: exercise.id,
        student_id: studentIdentity.id,
        student_name: studentIdentity.name,
        student_content: studentContent,
        feedback: aiFeedback,
      });

      if (error) throw error;

    } catch (error) {
      console.error("Failed to get feedback or save submission", error);
      setSubmitError(error instanceof Error ? error.message : "提交失败，请稍后重试");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;
  if (!skill || !exercise) return <div className="text-center py-20 text-gray-400">未查询到习题</div>;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="max-w-4xl mx-auto space-y-10 pb-32"
    >
      <div className="flex items-center gap-4">
        <Link to={`/practice/${workId}/${category}`} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-full transition-all text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {category === '综合鉴赏' ? skill.name : `${skill.name} · 写作练习`}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {category === '综合鉴赏' ? '课外作品鉴赏' : category}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left: Exercise & Writing */}
        <div className="space-y-8">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
            <header className="p-4 border-b border-slate-100 bg-slate-50/50">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">诗歌例句</label>
            </header>
            <div className="p-8 italic text-slate-700 font-medium leading-relaxed bg-slate-50/20 text-xl whitespace-pre-wrap">
              “{exercise.excerpt}”
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">你的反馈文字</label>
              <span className="text-[10px] font-bold text-slate-300">{studentContent.length} 字</span>
            </div>
            <textarea
              value={studentContent}
              onChange={(e) => setStudentContent(e.target.value)}
              placeholder="在此撰写你的文学分析段落..."
              className="w-full h-64 p-6 bg-white rounded-2xl border border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all resize-none shadow-sm text-sm leading-relaxed"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !studentContent.trim()}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-100"
            >
              {submitting ? (
                <span className="animate-spin h-5 w-5 border-2 border-white/20 border-t-white rounded-full" />
              ) : (
                <Send className="w-4 h-4" />
              )}
              {submitting ? "AI 老师打分中..." : "提交分析"}
            </button>
            {submitError && (
              <div className="p-3 bg-red-50 border border-red-100 rounded-xl text-sm text-red-600 font-medium flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Feedback Area */}
        <div className="sticky top-24">
          <AnimatePresence mode="wait">
            {!feedback ? (
              <motion.div 
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-12 border-2 border-dashed border-slate-200 rounded-2xl flex flex-col items-center justify-center text-center gap-4 bg-slate-50/50"
              >
                <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
                  <Sparkles className="w-6 h-6 text-slate-200" />
                </div>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest leading-loose">
                  提交后<br/>AI 老师将为你生成建议
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="feedback"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm border-t-4 border-t-emerald-500 overflow-hidden"
              >
                <header className="p-5 border-b border-slate-100 flex justify-between items-center bg-emerald-50/30">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-600" />
                    <h3 className="font-bold text-slate-800 text-sm">AI 详细反馈</h3>
                  </div>
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                </header>
                <div className="p-8 space-y-6">
                  <div className="markdown-feedback prose prose-slate prose-sm max-w-none prose-p:leading-relaxed prose-p:mb-4 text-slate-700">
                    <Markdown>{feedback}</Markdown>
                  </div>
                  <div className="pt-4 border-t border-slate-100 flex items-center justify-center p-4 bg-emerald-50/50 rounded-xl">
                    <p className="text-[10px] font-bold text-emerald-800 uppercase tracking-widest text-center">
                      AI 老师已基于评分标准<br/>为你生成改进意见
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
