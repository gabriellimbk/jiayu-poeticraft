import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Skill } from "../types";
import { motion } from "motion/react";
import { ChevronRight, ArrowLeft, Target } from "lucide-react";
import { supabase } from "../lib/supabase";
import { APP_TABLE, mapSkill, SkillRow } from "../lib/db";

export default function PracticeSkill() {
  const { workId, category } = useParams();
  const [skills, setSkills] = useState<Skill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSkills() {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from(APP_TABLE)
          .select("*")
          .eq("record_type", "skill")
          .eq("work_id", workId)
          .order("created_at", { ascending: true });

        if (error) throw error;

        let skills = ((data || []) as SkillRow[]).map(mapSkill);
        
        // Filter by category client-side to ensure maximum compatibility
        if (category) {
          skills = skills.filter(s => s.category === category);
        }
        
        setSkills(skills);
      } catch (err) {
        console.error("Error fetching skills:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchSkills();
  }, [workId, category]);

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-8"
    >
      <div className="flex items-center gap-4">
        <Link to={`/practice/${workId}`} className="w-10 h-10 flex items-center justify-center hover:bg-white hover:shadow-md rounded-full transition-all text-slate-400">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-slate-800">
            {category === '综合鉴赏' ? '选择鉴赏小练习' : '选择练习微技能'}
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
            {category === '综合鉴赏' ? '课外作品' : category}
          </p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400">加载中...</div>
      ) : skills.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-slate-200">
          <Target className="w-12 h-12 text-slate-200 mx-auto mb-4" />
          <p className="text-slate-400 font-medium">该维度暂无微技能习题</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3">
          {skills.map((skill) => (
            <Link
              key={skill.id}
              to={`/practice/${workId}/${category}/${skill.id}`}
              className="group p-5 bg-white rounded-2xl border border-slate-200 hover:border-indigo-200 hover:shadow-lg hover:shadow-indigo-500/5 transition-all flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-indigo-600 transition-all duration-300">
                  <Target className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600">{skill.name}</h3>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-400 group-hover:translate-x-1 transition-all" />
            </Link>
          ))}
        </div>
      )}
    </motion.div>
  );
}
