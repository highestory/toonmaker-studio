import { useState, useEffect } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronRight, Star } from 'lucide-react';

import { DEFAULT_CHECKLIST } from '@/lib/constants';

export default function WeeklyChecklist({ projectId, initialData, featuredEpisodes = [], aiSpecialId, onUpdate, onAiSpecialChange }) {
    const [checklist, setChecklist] = useState(DEFAULT_CHECKLIST);
    const [collapsedSections, setCollapsedSections] = useState({});

    useEffect(() => {
        // Always use DEFAULT_CHECKLIST structure, but merge in saved values
        if (initialData && initialData.length > 0) {
            const merged = DEFAULT_CHECKLIST.map(defaultItem => {
                const savedItem = initialData.find(saved => saved.id === defaultItem.id);
                return {
                    ...defaultItem, // Use default structure
                    checked: savedItem?.checked || false, // But keep saved checked state
                    input: savedItem?.input || '' // And saved input values
                };
            });
            setChecklist(merged);
        } else {
            setChecklist(DEFAULT_CHECKLIST);
        }
    }, [initialData]);

    const toggleCheck = (id) => {
        const updated = checklist.map(item =>
            item.id === id ? { ...item, checked: !item.checked } : item
        );
        setChecklist(updated);
        onUpdate(updated);
    };

    const updateInput = (id, value) => {
        const updated = checklist.map(item =>
            item.id === id ? { ...item, input: value } : item
        );
        setChecklist(updated);
        onUpdate(updated);
    };

    const toggleSection = (section) => {
        setCollapsedSections(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    // Group by section
    const sections = checklist.reduce((acc, item) => {
        if (!acc[item.section]) acc[item.section] = [];
        acc[item.section].push(item);
        return acc;
    }, {});

    // Calculate progress per section
    const getSectionProgress = (items) => {
        const total = items.length;
        const checked = items.filter(i => i.checked).length;
        return total > 0 ? Math.round((checked / total) * 100) : 0;
    };

    return (
        <div className="bg-[#1a1b26] border border-white/5 rounded-xl p-4 max-h-[800px] overflow-y-auto">
            <h3 className="text-lg font-bold text-white mb-4 sticky top-0 bg-[#1a1b26] pb-2 border-b border-white/10">
                ✅ [툰지기] 주간 영상 제작 체크리스트
            </h3>
            <p className="text-xs text-gray-500 mb-6">(목표: 월요일 저녁 6시 업로드)</p>

            {/* Featured Episodes Summary */}
            {featuredEpisodes.length > 0 && (
                <div className="mb-6 bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-yellow-400 mb-3 flex items-center gap-2">
                        <Star size={16} fill="currentColor" />
                        이번 주 원픽 작품 ({featuredEpisodes.length}/7)
                    </h4>
                    <div className="space-y-2">
                        {featuredEpisodes.map((ep) => (
                            <div key={ep.id} className="flex items-center justify-between bg-black/20 rounded px-3 py-2">
                                <div className="flex items-center gap-2">
                                    <span className="text-xs text-gray-400 uppercase">{ep.day}</span>
                                    <span className="text-sm text-white">{ep.title}</span>
                                </div>
                                {aiSpecialId === ep.id && (
                                    <span className="text-xs bg-indigo-600 text-white px-2 py-0.5 rounded font-bold">
                                        AI 필살기
                                    </span>
                                )}
                            </div>
                        ))}
                    </div>

                    {/* AI Special Selection */}
                    <div className="mt-4 pt-4 border-t border-yellow-500/20">
                        <label className="text-xs text-gray-400 mb-2 block">★ AI 필살기 대상 선정:</label>
                        <select
                            value={aiSpecialId || ''}
                            onChange={(e) => onAiSpecialChange(e.target.value || null)}
                            className="w-full bg-black/30 border border-white/10 rounded px-3 py-2 text-sm text-white focus:border-indigo-500 outline-none"
                        >
                            <option value="">-- 선택하세요 --</option>
                            {featuredEpisodes.map((ep) => (
                                <option key={ep.id} value={ep.id}>
                                    [{ep.day.toUpperCase()}] {ep.title}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            )}

            {Object.entries(sections).map(([sectionName, items]) => {
                const progress = getSectionProgress(items);
                const isCollapsed = collapsedSections[sectionName];

                // Group by subsection
                const subsections = items.reduce((acc, item) => {
                    if (!acc[item.subsection]) acc[item.subsection] = [];
                    acc[item.subsection].push(item);
                    return acc;
                }, {});

                return (
                    <div key={sectionName} className="mb-6 border border-white/5 rounded-lg overflow-hidden">
                        {/* Section Header */}
                        <div
                            onClick={() => toggleSection(sectionName)}
                            className="bg-black/20 p-3 cursor-pointer hover:bg-black/30 transition-colors flex items-center justify-between"
                        >
                            <div className="flex items-center gap-2">
                                {isCollapsed ? <ChevronRight size={16} /> : <ChevronDown size={16} />}
                                <h4 className="font-bold text-white">{sectionName}</h4>
                            </div>
                            <div className="flex items-center gap-3">
                                <span className="text-xs text-gray-400">{progress}%</span>
                                <div className="w-20 bg-black/40 rounded-full h-1.5">
                                    <div
                                        className="h-full bg-blue-500 rounded-full transition-all"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Section Content */}
                        {!isCollapsed && (
                            <div className="p-4 space-y-4">
                                {Object.entries(subsections).map(([subsectionName, subItems]) => (
                                    <div key={subsectionName}>
                                        <h5 className="text-sm font-semibold text-gray-300 mb-2">{subsectionName}</h5>
                                        <div className="space-y-2">
                                            {subItems.map((item) => (
                                                <div key={item.id} className="flex items-start gap-2 group">
                                                    <button
                                                        onClick={() => toggleCheck(item.id)}
                                                        className="mt-0.5 flex-shrink-0 text-gray-500 hover:text-blue-400 transition-colors"
                                                    >
                                                        {item.checked ? <CheckSquare size={18} className="text-green-500" /> : <Square size={18} />}
                                                    </button>
                                                    <div className="flex-1">
                                                        <span className={`text-sm ${item.checked ? 'text-gray-500 line-through' : 'text-gray-200'}`}>
                                                            {item.text}
                                                        </span>
                                                        {item.hasInput && (
                                                            <input
                                                                type="text"
                                                                value={item.input || ''}
                                                                onChange={(e) => updateInput(item.id, e.target.value)}
                                                                placeholder={item.inputPlaceholder}
                                                                className="mt-1 w-full bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white focus:border-blue-500 outline-none"
                                                            />
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
