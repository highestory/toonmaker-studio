import { useState, useEffect } from 'react';
import { CheckSquare, Square, ChevronDown, ChevronRight, Star } from 'lucide-react';

const DEFAULT_CHECKLIST = [
    // 월요일
    { id: 'mon-1-1', section: '🌕 월요일', subsection: '1. 작품 선정', text: '월요일 원픽 선정 완료', hasInput: false },
    { id: 'mon-1-2', section: '🌕 월요일', subsection: '1. 작품 선정', text: '화요일 원픽 선정 완료', hasInput: false },
    { id: 'mon-1-3', section: '🌕 월요일', subsection: '1. 작품 선정', text: '수요일 원픽 선정 완료', hasInput: false },
    { id: 'mon-1-4', section: '🌕 월요일', subsection: '1. 작품 선정', text: '목요일 원픽 선정 완료', hasInput: false },
    { id: 'mon-1-5', section: '🌕 월요일', subsection: '1. 작품 선정', text: '금요일 원픽 선정 완료', hasInput: false },
    { id: 'mon-1-6', section: '🌕 월요일', subsection: '1. 작품 선정', text: '토요일 원픽 선정 완료', hasInput: false },
    { id: 'mon-1-7', section: '🌕 월요일', subsection: '1. 작품 선정', text: '일요일 원픽 선정 완료', hasInput: false },
    { id: 'mon-1-8', section: '🌕 월요일', subsection: '1. 작품 선정', text: '★ 이번 주 AI 필살기 대상 선정', hasInput: false },

    { id: 'mon-2-1', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: '월요일 작품 초안 작성', hasInput: false },
    { id: 'mon-2-2', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: '화요일 작품 초안 작성', hasInput: false },
    { id: 'mon-2-3', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: '수요일 작품 초안 작성', hasInput: false },
    { id: 'mon-2-4', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: '목요일 작품 초안 작성', hasInput: false },
    { id: 'mon-2-5', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: '금요일 작품 초안 작성', hasInput: false },
    { id: 'mon-2-6', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: '토요일 작품 초안 작성', hasInput: false },
    { id: 'mon-2-7', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: '일요일 작품 초안 작성', hasInput: false },
    { id: 'mon-2-8', section: '🌕 월요일', subsection: '2. 대본 초안 작성', text: 'AI 필살기 소개 멘트 초안 작성', hasInput: false },

    // 화요일
    { id: 'tue-1-1', section: '🔥 화요일', subsection: '1. 대본 다듬기', text: '오프닝 멘트 (인사 + 이번 주 테마 한 줄)', hasInput: false },
    { id: 'tue-1-2', section: '🔥 화요일', subsection: '1. 대본 다듬기', text: '요일별 본문 (7개 작품) 매끄럽게 수정', hasInput: false },
    { id: 'tue-1-3', section: '🔥 화요일', subsection: '1. 대본 다듬기', text: '클라이맥스 (AI 필살기) 빌드업 멘트 수정', hasInput: false },
    { id: 'tue-1-4', section: '🔥 화요일', subsection: '1. 대본 다듬기', text: '클로징 멘트 (구독/좋아요 + 숏폼 언급)', hasInput: false },

    { id: 'tue-2-1', section: '🔥 화요일', subsection: '2. 오디오 녹음', text: '전체 통으로 녹음 완료', hasInput: false },
    { id: 'tue-2-2', section: '🔥 화요일', subsection: '2. 오디오 녹음', text: '녹음 파일 PC로 전송 완료', hasInput: false },

    // 수요일
    { id: 'wed-1-1', section: '💧 수요일', subsection: '1. AI 필살기 제작', text: '프롬프트 작성 및 이미지 생성', hasInput: false },
    { id: 'wed-1-2', section: '💧 수요일', subsection: '1. AI 필살기 제작', text: 'Best 이미지 1장 선정 및 보정', hasInput: false },
    { id: 'wed-1-3', section: '💧 수요일', subsection: '1. AI 필살기 제작', text: '이미지 → 영상 변환 완료', hasInput: false },
    { id: 'wed-1-4', section: '💧 수요일', subsection: '1. AI 필살기 제작', text: '(선택) Suno AI로 BGM 생성', hasInput: false },

    { id: 'wed-2-1', section: '💧 수요일', subsection: '2. 웹툰 자료 정리', text: '01_월 ~ 07_일 폴더 생성', hasInput: false },
    { id: 'wed-2-2', section: '💧 수요일', subsection: '2. 웹툰 자료 정리', text: '각 폴더에 캡처 이미지 분류 완료', hasInput: false },
    { id: 'wed-2-3', section: '💧 수요일', subsection: '2. 웹툰 자료 정리', text: '99_AI 폴더에 완성된 AI 영상 저장', hasInput: false },

    // 목요일
    { id: 'thu-1-1', section: '🌲 목요일', subsection: '1. 프로젝트 세팅', text: '편집 프로그램 실행 & 템플릿 활용', hasInput: false },
    { id: 'thu-1-2', section: '🌲 목요일', subsection: '1. 프로젝트 세팅', text: '오디오 파일 배치 & 컷 편집', hasInput: false },

    { id: 'thu-2-1', section: '🌲 목요일', subsection: '2. 영상 얹기', text: '오디오에 맞춰 웹툰 캡처 이미지 배치', hasInput: false },
    { id: 'thu-2-2', section: '🌲 목요일', subsection: '2. 영상 얹기', text: 'AI 필살기 영상 배치', hasInput: false },
    { id: 'thu-2-3', section: '🌲 목요일', subsection: '2. 영상 얹기', text: '화면 전환 효과 확인', hasInput: false },
    { id: 'thu-2-4', section: '🌲 목요일', subsection: '2. 영상 얹기', text: '1차 가편집 영상 재생 & 수정', hasInput: false },

    // 금요일
    { id: 'fri-1-1', section: '🍺 금요일', subsection: '1. 후반 작업', text: '자동 자막 생성 & 오타 수정', hasInput: false },
    { id: 'fri-1-2', section: '🍺 금요일', subsection: '1. 후반 작업', text: '배경음악(BGM) 배치', hasInput: false },
    { id: 'fri-1-3', section: '🍺 금요일', subsection: '1. 후반 작업', text: '효과음 삽입', hasInput: false },

    { id: 'fri-2-1', section: '🍺 금요일', subsection: '2. 썸네일 & 업로드', text: '썸네일 제작', hasInput: false },
    { id: 'fri-2-2', section: '🍺 금요일', subsection: '2. 썸네일 & 업로드', text: '유튜브 스튜디오 접속 & 영상 업로드', hasInput: false },
    { id: 'fri-2-3', section: '🍺 금요일', subsection: '2. 썸네일 & 업로드', text: '제목/설명란/태그 작성', hasInput: false },
    { id: 'fri-2-4', section: '🍺 금요일', subsection: '2. 썸네일 & 업로드', text: '[예약] 월요일 오후 6시로 설정', hasInput: false },
    { id: 'fri-2-5', section: '🍺 금요일', subsection: '2. 썸네일 & 업로드', text: '저장 버튼 클릭! (미션 완료 🎉)', hasInput: false },
];

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
