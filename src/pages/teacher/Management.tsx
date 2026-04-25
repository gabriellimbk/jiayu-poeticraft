import { useState, useEffect } from "react";
import { Work, Skill, Exercise, Category } from "../../types";
import { motion, AnimatePresence } from "motion/react";
import { Trash2, Edit2, Plus, ChevronRight, Save, X, Book, Target, ArrowLeft, BookOpen, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { supabase } from "../../lib/supabase";
import { ExerciseRow, mapExercise, mapSkill, mapWork, SkillRow, WorkRow } from "../../lib/db";

export default function TeacherManagement() {
  const navigate = useNavigate();
  const [works, setWorks] = useState<Work[]>([]);
  const [selectedWorkId, setSelectedWorkId] = useState<string | null>(null);
  const [selectedSkillId, setSelectedSkillId] = useState<string | null>(null);
  const [skills, setSkills] = useState<Skill[]>([]);
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [editingSkillId, setEditingSkillId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingExercise, setIsAddingExercise] = useState(false);
  const [isAddingSkill, setIsAddingSkill] = useState(false);
  const [newExercise, setNewExercise] = useState({ excerpt: "", referenceAnalysis: "" });
  const [newSkill, setNewSkill] = useState<{ name: string; category: Category; rubric: string }>({
    name: "",
    category: "思想内容",
    rubric: ""
  });
  const selectedWork = works.find(w => w.id === selectedWorkId);
  const categoryOptions: Category[] = selectedWork?.type === "extra-curricular"
    ? ["综合鉴赏"]
    : ["思想内容", "艺术特色"];

  // Fetch works on load
  useEffect(() => {
    async function fetchWorks() {
      try {
        const { data, error } = await supabase
          .from("works")
          .select("*")
          .order("created_at", { ascending: false });

        if (error) throw error;

        const works = ((data || []) as WorkRow[]).map(mapWork);
        setWorks(works);
        if (works.length > 0) setSelectedWorkId(works[0].id);
      } catch (err: any) {
        setError(`读取作品失败: ${err.message}`);
      } finally {
        setLoading(false);
      }
    }
    fetchWorks();
  }, []);

  useEffect(() => {
    if (selectedWork?.type === "extra-curricular" && newSkill.category !== "综合鉴赏") {
      setNewSkill(prev => ({ ...prev, category: "综合鉴赏" }));
    }
    if (selectedWork?.type !== "extra-curricular" && newSkill.category === "综合鉴赏") {
      setNewSkill(prev => ({ ...prev, category: "思想内容" }));
    }
  }, [selectedWork?.type, newSkill.category]);

  // Fetch skills and exercises when work changes
  useEffect(() => {
    if (!selectedWorkId) return;
    async function fetchData() {
      try {
        const { data: skillRows, error: skillError } = await supabase
          .from("skills")
          .select("*")
          .eq("work_id", selectedWorkId)
          .order("created_at", { ascending: true });
        if (skillError) throw skillError;

        const sData = ((skillRows || []) as SkillRow[]).map(mapSkill);
        setSkills(sData);

        const { data: exerciseRows, error: exerciseError } = await supabase
          .from("exercises")
          .select("*")
          .eq("work_id", selectedWorkId);
        if (exerciseError) throw exerciseError;

        const eData = ((exerciseRows || []) as ExerciseRow[]).map(mapExercise);
        setExercises(eData);
        
        if (selectedSkillId && !sData.find(s => s.id === selectedSkillId)) {
          setSelectedSkillId(null);
        }
      } catch (err) {
        console.error("Error fetching data:", err);
      }
    }
    fetchData();
  }, [selectedWorkId]);

  const handleDeleteWork = async (id: string) => {
    setActionLoading(`work-${id}`);
    setError(null);
    try {
      const { error } = await supabase.from("works").delete().eq("id", id);
      if (error) throw error;
      setWorks(works.filter(w => w.id !== id));
      if (selectedWorkId === id) {
        const remaining = works.filter(w => w.id !== id);
        setSelectedWorkId(remaining[0]?.id || null);
      }
    } catch (err: any) {
      console.error("Delete work error:", err);
      setError(`删除作品失败: ${err.message || '权限不足'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteSkill = async (id: string) => {
    setActionLoading(`skill-${id}`);
    setError(null);
    try {
      const { error } = await supabase.from("skills").delete().eq("id", id);
      if (error) throw error;
      setSkills(skills.filter(s => s.id !== id));
      if (selectedSkillId === id) setSelectedSkillId(null);
    } catch (err: any) {
      console.error("Delete skill error:", err);
      setError(`删除微技能失败: ${err.message || '权限不足'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddSkill = async () => {
    if (!newSkill.name || !newSkill.rubric) {
      setError("请填写微技能名称和评分标准");
      return;
    }

    setActionLoading("add-skill");
    try {
      const { data, error } = await supabase
        .from("skills")
        .insert({
          work_id: selectedWorkId!,
          category: newSkill.category,
          name: newSkill.name,
          rubric: newSkill.rubric,
        })
        .select("*")
        .single();

      if (error) throw error;

      setSkills(prev => [...prev, mapSkill(data as SkillRow)]);
      setIsAddingSkill(false);
      setNewSkill({ name: "", category: categoryOptions[0], rubric: "" });
    } catch (err: any) {
      setError(`添加微技能失败: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateSkill = async (skill: Skill) => {
    setActionLoading(`save-skill-${skill.id}`);
    try {
      const { error } = await supabase
        .from("skills")
        .update({
          category: skill.category,
          name: skill.name,
          rubric: skill.rubric,
        })
        .eq("id", skill.id);

      if (error) throw error;
      setEditingSkillId(null);
    } catch (err: any) {
      setError(`保存修改失败: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleAddExercise = async () => {
    if (!newExercise.excerpt || !newExercise.referenceAnalysis) {
      setError("请填写完整例句和参考分析");
      return;
    }

    setActionLoading(`add-ex-${selectedSkillId}`);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .insert({
          work_id: selectedWorkId!,
          skill_id: selectedSkillId!,
          excerpt: newExercise.excerpt,
          reference_analysis: newExercise.referenceAnalysis,
        })
        .select("*")
        .single();

      if (error) throw error;

      setExercises(prev => [...prev, mapExercise(data as ExerciseRow)]);
      setIsAddingExercise(false);
      setNewExercise({ excerpt: "", referenceAnalysis: "" });
    } catch (err: any) {
      setError(`添加例句失败: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteExercise = async (id: string) => {
    setActionLoading(`ex-${id}`);
    setError(null);
    try {
      const { error } = await supabase.from("exercises").delete().eq("id", id);
      if (error) throw error;
      setExercises(prev => prev.filter(e => e.id !== id));
    } catch (err: any) {
      console.error("Delete exercise error:", err);
      setError(`删除习题失败: ${err.message || '权限不足'}`);
    } finally {
      setActionLoading(null);
    }
  };

  const currentSkill = skills.find(s => s.id === selectedSkillId);

  if (loading) return <div className="text-center py-20 text-gray-400">加载中...</div>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex flex-col gap-6 h-[calc(100vh-12rem)]"
    >
      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4" />
            <span className="text-sm font-medium">{error}</span>
          </div>
          <button onClick={() => setError(null)} className="p-1 hover:bg-red-100 rounded-lg transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      <div className="flex-1 flex gap-8 min-h-0">
        {/* Works Sidebar */}
        <aside className="w-80 flex flex-col gap-6 shrink-0">
          <div className="flex items-center gap-4">
            <Link to="/teacher" className="w-10 h-10 flex items-center justify-center hover:bg-white hover:border border-slate-200 rounded-full transition-all text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h2 className="text-2xl font-extrabold tracking-tight text-slate-800">题库工坊</h2>
          </div>

          <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-4 shadow-sm flex flex-col overflow-hidden">
            <header className="px-2 pb-4 mb-2 border-b border-slate-100">
              <h3 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">作品索引</h3>
            </header>
            <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
              {works.map((work) => (
                <button
                  key={work.id}
                  disabled={!!actionLoading}
                  onClick={() => {
                    setSelectedWorkId(work.id);
                    setSelectedSkillId(null);
                  }}
                  className={`w-full p-4 rounded-xl text-left transition-all flex items-center justify-between group ${
                    selectedWorkId === work.id 
                      ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" 
                      : "text-slate-600 hover:bg-slate-50 border border-transparent hover:border-slate-200"
                  }`}
                >
                  <div className="space-y-0.5 truncate pr-2">
                    <div className="flex items-center gap-2">
                      <p className="font-bold truncate">{work.title}</p>
                      <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded-full border ${work.type === 'extra-curricular' ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-indigo-50 border-indigo-100 text-indigo-600'}`}>
                        {work.type === 'extra-curricular' ? '课外' : '课内'}
                      </span>
                    </div>
                    <p className={`text-[10px] font-medium uppercase tracking-widest ${selectedWorkId === work.id ? "text-indigo-200" : "text-slate-400"}`}>
                      {work.author}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {selectedWorkId === work.id && (
                      <button
                        type="button"
                        disabled={actionLoading === `work-${work.id}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteWork(work.id);
                        }}
                        className="p-2.5 hover:bg-red-500/20 rounded-lg transition-colors text-indigo-200 hover:text-white disabled:opacity-50"
                        title="删除作品"
                      >
                        {actionLoading === `work-${work.id}` ? <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                    )}
                    <Book className={`w-4 h-4 ${selectedWorkId === work.id ? "text-indigo-300" : "text-slate-200"}`} />
                  </div>
                </button>
              ))}
            </div>

            <footer className="mt-4 pt-4 border-t border-slate-100 px-2 flex flex-col gap-2">
               <button
                  onClick={() => navigate("/teacher/upload-inclass")}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-indigo-600 hover:bg-indigo-50 py-3 rounded-xl transition-all border border-transparent hover:border-indigo-100"
                >
                  <Plus className="w-4 h-4" />
                  <span>录入课内作品</span>
                </button>
               <button
                  onClick={() => navigate("/teacher/upload-extra")}
                  className="w-full flex items-center justify-center gap-2 text-xs font-bold text-emerald-600 hover:bg-emerald-50 py-3 rounded-xl transition-all border border-transparent hover:border-emerald-100"
                >
                  <Plus className="w-4 h-4" />
                  <span>录入课外作品</span>
                </button>
            </footer>
          </div>
        </aside>

      {/* Main Management Area */}
      <div className="flex-1 overflow-hidden">
        {!selectedWorkId ? (
          <div className="h-full flex flex-col items-center justify-center bg-white rounded-3xl border border-dashed border-slate-200 text-slate-300 gap-4">
             <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mb-2">
              <BookOpen className="w-10 h-10 text-slate-200" />
            </div>
            <p className="font-bold uppercase tracking-widest text-xs">请选择左侧作品开始管理</p>
          </div>
        ) : (
          <div className="h-full flex gap-6">
            {/* Skills Column */}
            <div className={`flex flex-col gap-6 transition-all duration-300 ${selectedSkillId ? "w-1/3" : "w-full"}`}>
              <div className="grid grid-cols-2 gap-4 shrink-0">
                {categoryOptions.map((cat) => (
                  <div 
                    key={cat} 
                    className={`bg-white rounded-2xl border border-slate-200 px-4 py-3 shadow-sm border-t-2 ${
                      cat === "思想内容" ? "border-t-emerald-500" : cat === "艺术特色" ? "border-t-orange-500" : "border-t-indigo-500"
                    }`}
                  >
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{cat}</p>
                    <span className="text-lg font-extrabold text-slate-800">{skills.filter(s => s.category === cat).length}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col overflow-hidden">
                <header className="p-4 border-b border-slate-100 shrink-0 bg-slate-50/50 flex items-center justify-between">
                  <h3 className="font-bold text-slate-800 uppercase tracking-tight text-xs">微技能列表</h3>
                  {!isAddingSkill && (
                    <button 
                      onClick={() => setIsAddingSkill(true)}
                      className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>新增</span>
                    </button>
                  )}
                </header>
                <div className="flex-1 overflow-y-auto p-4 space-y-2">
                   {isAddingSkill && (
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="bg-indigo-50/50 p-4 rounded-xl border border-indigo-100 space-y-4 mb-4"
                     >
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-indigo-600 uppercase">技能名称</label>
                           <input 
                              type="text"
                              value={newSkill.name}
                              onChange={(e) => setNewSkill({...newSkill, name: e.target.value})}
                              placeholder="如：意象分析、情感主旨"
                              className="w-full p-2 bg-white rounded-lg border border-indigo-100 text-sm outline-none focus:ring-2 ring-indigo-500/20"
                           />
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-indigo-600 uppercase">所属范畴</label>
                           <div className="flex gap-2">
                              {categoryOptions.map(cat => (
                                 <button
                                    key={cat}
                                    onClick={() => setNewSkill({...newSkill, category: cat as Category})}
                                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
                                       newSkill.category === cat 
                                          ? "bg-indigo-600 text-white" 
                                          : "bg-white text-slate-400 border border-slate-100"
                                    }`}
                                 >
                                    {cat}
                                 </button>
                              ))}
                           </div>
                        </div>
                        <div className="space-y-2">
                           <label className="text-[10px] font-bold text-indigo-600 uppercase">AI 评分标准（要点）</label>
                           <textarea 
                              value={newSkill.rubric}
                              onChange={(e) => setNewSkill({...newSkill, rubric: e.target.value})}
                              placeholder="输入评分标准内容..."
                              rows={3}
                              className="w-full p-2 bg-white rounded-lg border border-indigo-100 text-xs outline-none focus:ring-2 ring-indigo-500/20"
                           />
                        </div>
                        <div className="flex justify-end gap-2 pt-2">
                           <button 
                              onClick={() => setIsAddingSkill(false)} 
                              className="p-2 text-xs font-bold text-slate-400"
                           >
                              取消
                           </button>
                           <button 
                              onClick={handleAddSkill}
                              disabled={actionLoading === 'add-skill'}
                              className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-2"
                           >
                              {actionLoading === 'add-skill' ? <span className="w-3 h-3 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                              创建技能
                           </button>
                        </div>
                     </motion.div>
                   )}
                   {skills.map((skill) => (
                    <button
                      key={skill.id}
                      onClick={() => setSelectedSkillId(skill.id)}
                      className={`w-full p-4 rounded-xl border text-left transition-all group flex items-center justify-between ${
                        selectedSkillId === skill.id
                          ? "bg-indigo-50 border-indigo-200 ring-2 ring-indigo-500/5"
                          : "bg-white border-slate-100 hover:border-indigo-100"
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                           <span className={`w-1.5 h-1.5 rounded-full ${skill.category === '思想内容' ? 'bg-emerald-500' : skill.category === '艺术特色' ? 'bg-orange-500' : 'bg-indigo-500'}`} />
                           <p className={`font-bold transition-colors ${selectedSkillId === skill.id ? "text-indigo-700" : "text-slate-700"}`}>
                            {skill.name}
                          </p>
                        </div>
                        <p className="text-[10px] text-slate-400 font-medium">
                          包含 {exercises.filter(e => e.skillId === skill.id).length} 个例句
                        </p>
                      </div>
                      <ChevronRight className={`w-4 h-4 transition-all ${selectedSkillId === skill.id ? "text-indigo-400 translate-x-1" : "text-slate-200"}`} />
                    </button>
                   ))}
                </div>
              </div>
            </div>

            {/* Exercise Details Column */}
            <AnimatePresence mode="wait">
              {selectedSkillId && currentSkill ? (
                <motion.div
                  key="details"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="flex-1 bg-white rounded-2xl border border-indigo-100 shadow-xl shadow-indigo-500/5 flex flex-col overflow-hidden"
                >
                  <header className="p-6 border-b border-indigo-50 flex items-center justify-between bg-indigo-50/20">
                    <div className="space-y-1">
                       <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase ${
                        currentSkill.category === '思想内容' ? 'bg-emerald-100 text-emerald-700' : currentSkill.category === '艺术特色' ? 'bg-orange-100 text-orange-700' : 'bg-indigo-100 text-indigo-700'
                      }`}>
                        {currentSkill.category}
                      </span>
                      <h3 className="text-xl font-extrabold text-slate-800 tracking-tight">{currentSkill.name}</h3>
                    </div>
                    <div className="flex items-center gap-2">
                       <button 
                        type="button"
                        onClick={() => setEditingSkillId(currentSkill.id)}
                        className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button 
                        type="button"
                        disabled={actionLoading === `skill-${currentSkill.id}`}
                        onClick={() => handleDeleteSkill(currentSkill.id)}
                        className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-white rounded-lg transition-all disabled:opacity-50"
                      >
                        {actionLoading === `skill-${currentSkill.id}` ? <span className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
                      </button>
                      <button 
                        onClick={() => setSelectedSkillId(null)}
                        className="p-2 text-slate-300 hover:text-slate-600 hover:bg-white rounded-lg transition-all ml-2"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  </header>

                  <div className="flex-1 overflow-y-auto p-8 space-y-10">
                    {/* Rubric Section */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">AI 评分标准（学生不可见）</label>
                         {editingSkillId === currentSkill.id && (
                           <button onClick={() => handleUpdateSkill(currentSkill)} className="text-[10px] font-bold text-indigo-600 flex items-center gap-1">
                             <Save className="w-3 h-3" /> 保存修改
                           </button>
                         )}
                      </div>
                      {editingSkillId === currentSkill.id ? (
                        <textarea
                          className="w-full p-4 bg-slate-50 rounded-xl border border-indigo-100 outline-none focus:bg-white focus:border-indigo-400 transition-all text-sm leading-relaxed"
                          value={currentSkill.rubric}
                          rows={4}
                          onChange={(e) => setSkills(skills.map(s => s.id === currentSkill.id ? { ...s, rubric: e.target.value } : s))}
                        />
                      ) : (
                        <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100 text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">
                          {currentSkill.rubric}
                        </div>
                      )}
                    </section>

                    {/* Exercises Pool */}
                    <section className="space-y-4">
                      <div className="flex items-center justify-between px-1">
                        <label className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">练习题库 (学生将随机从中抽取)</label>
                        {!isAddingExercise && (
                          <button 
                            onClick={() => setIsAddingExercise(true)}
                            className="flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                          >
                            <Plus className="w-4 h-4" />
                            <span>添加例句</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-4">
                        {isAddingExercise && (
                          <motion.div 
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-6 bg-indigo-50/50 border border-indigo-100 rounded-2xl space-y-4"
                          >
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-indigo-600 uppercase">例句内容</label>
                              <textarea
                                value={newExercise.excerpt}
                                onChange={(e) => setNewExercise({...newExercise, excerpt: e.target.value})}
                                placeholder="输入待分析的作品例句..."
                                className="w-full p-4 bg-white rounded-xl border border-indigo-100 outline-none focus:ring-2 ring-indigo-500/20 text-sm"
                                rows={2}
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-bold text-indigo-600 uppercase">参考分析 (AI 评分依据之一)</label>
                              <textarea
                                value={newExercise.referenceAnalysis}
                                onChange={(e) => setNewExercise({...newExercise, referenceAnalysis: e.target.value})}
                                placeholder="输入参考答案或分析要点..."
                                className="w-full p-4 bg-white rounded-xl border border-indigo-100 outline-none focus:ring-2 ring-indigo-500/20 text-sm"
                                rows={3}
                              />
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                              <button 
                                onClick={() => {
                                  setIsAddingExercise(false);
                                  setNewExercise({ excerpt: "", referenceAnalysis: "" });
                                }}
                                className="px-4 py-2 text-xs font-bold text-slate-400 hover:text-slate-600"
                              >
                                取消
                              </button>
                              <button 
                                onClick={handleAddExercise}
                                disabled={actionLoading?.startsWith('add-ex')}
                                className="px-5 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                              >
                                {actionLoading?.startsWith('add-ex') ? (
                                  <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                                ) : <Plus className="w-3.5 h-3.5" />}
                                确认添加
                              </button>
                            </div>
                          </motion.div>
                        )}

                        {exercises.filter(e => e.skillId === currentSkill.id).length === 0 && !isAddingExercise ? (
                           <div className="py-12 border-2 border-dashed border-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-300 italic text-xs">
                             暂无习题，请点击上方添加
                           </div>
                        ) : (
                          exercises.filter(e => e.skillId === currentSkill.id).map((ex, idx) => (
                            <div key={ex.id} className="group p-5 bg-white border border-slate-100 rounded-2xl hover:border-indigo-100 transition-all relative">
                              <div className="flex items-start gap-4 pr-10">
                                <div className="w-6 h-6 shrink-0 bg-slate-50 rounded-lg flex items-center justify-center text-[10px] font-bold text-slate-400">
                                  #{idx + 1}
                                </div>
                                <div className="space-y-3">
                                   <p className="font-bold text-slate-800 text-sm italic whitespace-pre-wrap">“{ex.excerpt}”</p>
                                   <p className="text-[11px] text-slate-500 leading-relaxed pl-3 border-l-2 border-indigo-100">
                                     <span className="font-bold text-[10px] text-indigo-300 uppercase block mb-1">参考分析</span>
                                     {ex.referenceAnalysis}
                                   </p>
                                </div>
                              </div>
                              <button 
                                type="button"
                                disabled={actionLoading === `ex-${ex.id}`}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteExercise(ex.id);
                                }}
                                className="absolute top-4 right-4 p-3 text-slate-400 opacity-60 hover:opacity-100 hover:text-red-500 transition-all rounded-xl hover:bg-red-50 z-10 disabled:opacity-50"
                                title="删除习题"
                              >
                                {actionLoading === `ex-${ex.id}` ? <span className="w-5 h-5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin" /> : <Trash2 className="w-5 h-5" />}
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </section>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        )}
      </div>
      </div>
    </motion.div>
  );
}
