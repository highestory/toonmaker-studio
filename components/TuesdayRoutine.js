import { useState, useEffect } from 'react';
import { X, CheckSquare, Square, Flame, Sparkles, Save, ChevronRight, ChevronDown } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function TuesdayRoutine({ projectId, checklistData, onUpdate, onClose }) {
    const [tuesdayItems, setTuesdayItems] = useState([]);
    const [activeTab, setActiveTab] = useState('checklist'); // 'checklist' or 'script'
    const [scriptData, setScriptData] = useState({
        opening: '',
        bridge: '',
        closing: '',
        episodes: {} // { episodeId: scriptContent }
    });
    const [episodes, setEpisodes] = useState([]);
    const [loading, setLoading] = useState(false);
    const [polishing, setPolishing] = useState(null); // 'opening', 'closing', or episodeId

    useEffect(() => {
        // Filter for Tuesday items
        const items = checklistData.filter(item => item.id.startsWith('tue-'));
        setTuesdayItems(items);
        fetchScriptData();
    }, [checklistData, projectId]);

    async function fetchScriptData() {
        setLoading(true);
        // Fetch project script data
        const { data: project } = await supabase
            .from('projects')
            .select('script_data')
            .eq('id', projectId)
            .single();

        if (project?.script_data) {
            setScriptData(prev => ({
                ...prev,
                ...project.script_data
            }));
        }

        // Fetch episodes for the week
        const { data: eps } = await supabase
            .from('episodes')
            .select('*')
            .eq('project_id', projectId)
            .order('created_at', { ascending: true });

        if (eps) {
            setEpisodes(eps);
            // Initialize episode scripts if not present in scriptData
            const epScripts = { ...scriptData.episodes };
            eps.forEach(ep => {
                if (!epScripts[ep.id]) {
                    try {
                        const content = JSON.parse(ep.script_content);
                        // Try to find a summary or script part in the content
                        // Workstation saves 'analysis' (Column 2) and 'prompt' (Shorts Script)
                        // We prefer 'prompt' if available, otherwise 'analysis'
                        epScripts[ep.id] = content.prompt || content.analysis || content.script || content.summary || '';
                    } catch {
                        epScripts[ep.id] = '';
                    }
                }
            });
            setScriptData(prev => ({
                ...prev,
                episodes: { ...prev.episodes, ...epScripts }
            }));
        }
        setLoading(false);
    }

    const toggleCheck = (id) => {
        const updatedItems = tuesdayItems.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        setTuesdayItems(updatedItems);

        const globalUpdated = checklistData.map(item => {
            const found = updatedItems.find(u => u.id === item.id);
            return found ? found : item;
        });
        onUpdate(globalUpdated);
    };

    const handleScriptChange = (field, value, episodeId = null) => {
        if (episodeId) {
            setScriptData(prev => ({
                ...prev,
                episodes: {
                    ...prev.episodes,
                    [episodeId]: value
                }
            }));
        } else {
            setScriptData(prev => ({
                ...prev,
                [field]: value
            }));
        }
    };

    const saveScriptData = async () => {
        setLoading(true);
        try {
            // 1. Save project level scripts (Opening, Bridge, Closing)
            await supabase
                .from('projects')
                .update({
                    script_data: {
                        opening: scriptData.opening,
                        bridge: scriptData.bridge,
                        closing: scriptData.closing,
                        // We don't strictly need to save episodes here if we save to episodes table, 
                        // but keeping it as a backup or cache isn't terrible. 
                        // However, to avoid confusion, let's NOT save episodes blob here if we are syncing individual rows.
                        // But for now, let's keep the structure simple.
                    }
                })
                .eq('id', projectId);

            // 2. Save episode level scripts
            // We need to update each episode's script_content
            const updatePromises = Object.entries(scriptData.episodes).map(async ([episodeId, text]) => {
                // First fetch current content to preserve other data
                const { data: currentEp } = await supabase
                    .from('episodes')
                    .select('script_content')
                    .eq('id', episodeId)
                    .single();

                if (currentEp) {
                    let content = {};
                    try {
                        content = JSON.parse(currentEp.script_content || '{}');
                    } catch (e) {
                        console.error('Error parsing script content', e);
                    }

                    // Update the script/prompt field
                    // We'll save it to 'prompt' as that seems to be the "Shorts Script" field, 
                    // or maybe we should standardize on a new field 'final_script'?
                    // Let's use 'prompt' as it's used for the script in Workstation.
                    content.prompt = text;

                    return supabase
                        .from('episodes')
                        .update({ script_content: JSON.stringify(content) })
                        .eq('id', episodeId);
                }
            });

            await Promise.all(updatePromises);
            alert('Scripts saved successfully!');
        } catch (e) {
            console.error('Save error:', e);
            alert('Failed to save scripts');
        } finally {
            setLoading(false);
        }
    };

    const polishScript = async (type, text, context = null, episodeId = null) => {
        if (!text) return;

        setPolishing(episodeId || type);
        try {
            const res = await fetch('/api/polish-script', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ text, type, context })
            });
            const data = await res.json();

            if (data.polishedText) {
                handleScriptChange(type, data.polishedText, episodeId);
            }
        } catch (e) {
            console.error(e);
            alert('Failed to polish script');
        }
        setPolishing(null);
    };

    // Calculate progress
    const total = tuesdayItems.length;
    const checked = tuesdayItems.filter(i => i.checked).length;
    const progress = total > 0 ? Math.round((checked / total) * 100) : 0;

    return (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-[#1a1b26] w-full max-w-6xl h-[90vh] rounded-2xl border border-white/10 shadow-2xl flex flex-col overflow-hidden">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between bg-[#13141c]">
                    <div className="flex items-center gap-4">
                        <div className="bg-orange-500/10 p-2 rounded-lg">
                            <Flame className="text-orange-500" size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-white">화요일 루틴</h2>
                            <p className="text-sm text-gray-400">대본 다듬기 & 오디오 녹음</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-6">
                        {/* Tabs */}
                        <div className="flex bg-black/40 rounded-lg p-1">
                            <button
                                onClick={() => setActiveTab('checklist')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'checklist' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                체크리스트
                            </button>
                            <button
                                onClick={() => setActiveTab('script')}
                                className={`px-4 py-2 rounded-md text-sm font-bold transition-colors ${activeTab === 'script' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                            >
                                대본 에디터
                            </button>
                        </div>

                        <div className="h-8 w-px bg-white/10" />

                        <div className="flex items-center gap-3 w-48">
                            <span className="text-sm text-gray-400">{progress}%</span>
                            <div className="flex-1 h-2 bg-black/40 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-orange-500 rounded-full transition-all duration-500"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-white/10 rounded-lg transition-colors text-gray-400 hover:text-white"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden flex">
                    {/* Left: Checklist (Always visible or toggleable? Let's keep it simple based on tabs for now, or split view) */}
                    {/* Actually, let's make it a split view if space allows, or tabbed. Tabbed is safer for small screens but split is better for workflow. 
                        Let's go with Tabbed for now as requested in plan implies a "Script Editor UI". 
                    */}

                    {activeTab === 'checklist' && (
                        <div className="flex-1 overflow-y-auto p-8 space-y-8">
                            {/* Reusing previous checklist logic */}
                            {['1. 대본 다듬기', '2. 오디오 녹음'].map(section => {
                                const items = tuesdayItems.filter(i => i.subsection === section);
                                if (items.length === 0) return null;

                                return (
                                    <div key={section} className="bg-black/20 rounded-xl p-6 border border-white/5">
                                        <h3 className="text-lg font-bold text-gray-200 mb-4">{section}</h3>
                                        <div className="space-y-3">
                                            {items.map((item) => (
                                                <div
                                                    key={item.id}
                                                    onClick={() => toggleCheck(item.id)}
                                                    className="flex items-center gap-4 p-3 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                                                >
                                                    <div className={`
                                                        w-6 h-6 rounded border-2 flex items-center justify-center transition-colors
                                                        ${item.checked
                                                            ? 'bg-orange-500 border-orange-500 text-white'
                                                            : 'border-gray-600 group-hover:border-orange-400'
                                                        }
                                                    `}>
                                                        {item.checked && <CheckSquare size={16} />}
                                                    </div>
                                                    <span className={`text-lg ${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                        {item.text}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {activeTab === 'script' && (
                        <div className="flex-1 overflow-y-auto p-8 bg-[#0f1014]">
                            <div className="max-w-4xl mx-auto space-y-8">
                                <div className="flex justify-between items-center">
                                    <h3 className="text-xl font-bold text-white">대본 작성 및 수정</h3>
                                    <button
                                        onClick={saveScriptData}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold transition-colors"
                                    >
                                        <Save size={18} />
                                        저장하기
                                    </button>
                                </div>

                                {/* Opening */}
                                <div className="bg-[#1a1b26] rounded-xl p-6 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-indigo-400">1. 오프닝 멘트</h4>
                                        <button
                                            onClick={() => polishScript('opening', scriptData.opening)}
                                            disabled={polishing === 'opening'}
                                            className="flex items-center gap-2 text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-500/30 transition-colors"
                                        >
                                            <Sparkles size={14} />
                                            {polishing === 'opening' ? '다듬는 중...' : 'AI로 다듬기'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={scriptData.opening}
                                        onChange={(e) => handleScriptChange('opening', e.target.value)}
                                        placeholder="시청자의 호기심을 자극하는 첫 마디를 적어보세요."
                                        className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-4 text-white focus:border-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                {/* Episodes */}
                                <div className="space-y-4">
                                    <h4 className="font-bold text-gray-400 px-2">2. 요일별 본문 (7개 작품)</h4>
                                    {episodes.map((ep) => (
                                        <div key={ep.id} className="bg-[#1a1b26] rounded-xl p-6 border border-white/5">
                                            <div className="flex justify-between items-center mb-4">
                                                <div className="flex items-center gap-3">
                                                    <span className="text-xs font-bold bg-gray-700 text-white px-2 py-1 rounded uppercase">
                                                        {ep.title}
                                                    </span>
                                                    <h5 className="font-bold text-white">
                                                        {JSON.parse(ep.script_content || '{}').meta?.webtoonTitle || '제목 없음'}
                                                    </h5>
                                                </div>
                                                <button
                                                    onClick={() => polishScript('episode', scriptData.episodes[ep.id], '웹툰 리뷰', ep.id)}
                                                    disabled={polishing === ep.id}
                                                    className="flex items-center gap-2 text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-500/30 transition-colors"
                                                >
                                                    <Sparkles size={14} />
                                                    {polishing === ep.id ? '다듬는 중...' : 'AI로 다듬기'}
                                                </button>
                                            </div>
                                            <textarea
                                                value={scriptData.episodes[ep.id] || ''}
                                                onChange={(e) => handleScriptChange('episode', e.target.value, ep.id)}
                                                placeholder="이 작품의 핵심 재미 요소를 적어주세요."
                                                className="w-full h-32 bg-black/30 border border-white/10 rounded-lg p-4 text-white focus:border-indigo-500 outline-none resize-y"
                                            />
                                        </div>
                                    ))}
                                </div>

                                {/* Bridge */}
                                <div className="bg-[#1a1b26] rounded-xl p-6 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-orange-400">3. 클라이맥스 빌드업 (브릿지)</h4>
                                        <button
                                            onClick={() => polishScript('bridge', scriptData.bridge)}
                                            disabled={polishing === 'bridge'}
                                            className="flex items-center gap-2 text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-500/30 transition-colors"
                                        >
                                            <Sparkles size={14} />
                                            {polishing === 'bridge' ? '다듬는 중...' : 'AI로 다듬기'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={scriptData.bridge}
                                        onChange={(e) => handleScriptChange('bridge', e.target.value)}
                                        placeholder="AI 필살기(하이라이트)로 넘어가기 전 기대감을 고조시키는 멘트!"
                                        className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-4 text-white focus:border-indigo-500 outline-none resize-none"
                                    />
                                </div>

                                {/* Closing */}
                                <div className="bg-[#1a1b26] rounded-xl p-6 border border-white/5">
                                    <div className="flex justify-between items-center mb-4">
                                        <h4 className="font-bold text-green-400">4. 클로징 멘트</h4>
                                        <button
                                            onClick={() => polishScript('closing', scriptData.closing)}
                                            disabled={polishing === 'closing'}
                                            className="flex items-center gap-2 text-xs bg-indigo-500/20 text-indigo-300 px-3 py-1.5 rounded-full hover:bg-indigo-500/30 transition-colors"
                                        >
                                            <Sparkles size={14} />
                                            {polishing === 'closing' ? '다듬는 중...' : 'AI로 다듬기'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={scriptData.closing}
                                        onChange={(e) => handleScriptChange('closing', e.target.value)}
                                        placeholder="구독, 좋아요 요청과 함께 깔끔한 마무리 인사."
                                        className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-4 text-white focus:border-indigo-500 outline-none resize-none"
                                    />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
