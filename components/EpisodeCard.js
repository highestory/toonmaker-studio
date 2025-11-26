import { Edit2, Plus, Star, CheckSquare, Square, ListChecks, Film, FileText, Sparkles, Save, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function EpisodeCard({ 
    day, 
    data, 
    onEdit, 
    onFeaturedChange, 
    checklistItems = [], 
    onToggleCheck,
    scriptData,
    onProjectScriptUpdate,
    onEpisodeScriptUpdate,
    onPolish,
    isPolishing,
    onSave
}) {
    // data is now an array of episodes
    const episodes = Array.isArray(data) ? data : [];
    const [activeTab, setActiveTab] = useState('episodes'); // 'episodes' | 'checklist' | 'script'

    const handleToggleFeatured = async (e, episodeId, currentStatus) => {
        e.stopPropagation(); // Prevent card click

        // Toggle featured status
        await supabase
            .from('episodes')
            .update({ is_featured: !currentStatus })
            .eq('id', episodeId);

        // Notify parent to refresh data
        if (onFeaturedChange) onFeaturedChange();
    };

    const toggleCheck = (id) => {
        if (!onToggleCheck) return;
        onToggleCheck(id); 
    };

    return (
        <div className="bg-[#1a1b26] border border-white/5 rounded-xl p-3 flex flex-col gap-3 h-full">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-400 text-sm">{day.label}</span>
                    {day.link && (
                        <a 
                            href={day.link} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-gray-600 hover:text-green-500 transition-colors"
                            title="Open Naver Webtoon"
                        >
                            <ExternalLink size={12} />
                        </a>
                    )}
                </div>
                <div className="flex bg-black/40 rounded-lg p-0.5">
                    <button
                        onClick={() => setActiveTab('episodes')}
                        className={`p-1 rounded-md transition-colors ${activeTab === 'episodes' ? 'bg-gray-700 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Episodes"
                    >
                        <Film size={12} />
                    </button>
                    <button
                        onClick={() => setActiveTab('checklist')}
                        className={`p-1 rounded-md transition-colors ${activeTab === 'checklist' ? 'bg-blue-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Checklist"
                    >
                        <ListChecks size={12} />
                    </button>
                    <button
                        onClick={() => setActiveTab('script')}
                        className={`p-1 rounded-md transition-colors ${activeTab === 'script' ? 'bg-indigo-600 text-white' : 'text-gray-500 hover:text-gray-300'}`}
                        title="Script"
                    >
                        <FileText size={12} />
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
                {activeTab === 'episodes' ? (
                    <>
                        {episodes.map((ep, i) => (
                            <div
                                key={ep.id || i}
                                onClick={() => onEdit(day.id, ep)}
                                className="bg-black/20 hover:bg-white/5 border border-white/5 hover:border-blue-500/50 rounded-lg p-2 cursor-pointer transition-all group relative"
                            >
                                {/* Featured Star Button */}
                                <button
                                    onClick={(e) => handleToggleFeatured(e, ep.id, ep.is_featured)}
                                    className={`absolute top-2 right-2 p-1 rounded transition-all z-10 ${ep.is_featured
                                            ? 'bg-yellow-500 text-white'
                                            : 'bg-gray-700/50 text-gray-500 hover:bg-yellow-500/20 hover:text-yellow-400'
                                        }`}
                                    title={ep.is_featured ? '원픽 해제' : '원픽 설정'}
                                >
                                    <Star size={14} fill={ep.is_featured ? 'currentColor' : 'none'} />
                                </button>

                                <div className="flex gap-3">
                                    {/* Thumbnail */}
                                    <div className="w-16 h-16 bg-black/40 rounded-md overflow-hidden flex-shrink-0 relative">
                                        {ep.meta?.thumbnail ? (
                                            <img src={ep.meta.thumbnail} alt="Thumb" className="w-full h-full object-cover" />
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center text-[10px] text-gray-600">No Img</div>
                                        )}
                                    </div>

                                    {/* Info */}
                                    <div className="flex-1 min-w-0 flex flex-col justify-center pr-6">
                                        <h4 className="text-xs font-bold text-gray-200 truncate group-hover:text-blue-400 transition-colors">
                                            {ep.meta?.title || 'Untitled Episode'}
                                        </h4>
                                        <p className="text-[10px] text-gray-500 truncate">{ep.url || 'No URL'}</p>
                                        <div className="flex gap-2 mt-1">
                                            {ep.is_featured && (
                                                <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-1.5 rounded font-bold flex items-center gap-1">
                                                    <Star size={8} fill="currentColor" />
                                                    원픽
                                                </span>
                                            )}
                                            {ep.analysis && (
                                                <span className="text-[10px] bg-green-500/10 text-green-500 px-1 rounded">Script</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}

                        {episodes.length === 0 && (
                            <div className="flex-1 flex items-center justify-center text-gray-700 text-xs border border-dashed border-white/5 rounded-lg">
                                Empty
                            </div>
                        )}
                        
                        {/* Add Button */}
                        <button
                            onClick={() => onEdit(day.id, null)}
                            className="w-full bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-500 text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-bold border border-blue-500/20 hover:border-blue-500 shrink-0"
                        >
                            <Plus size={14} />
                            Add Episode
                        </button>
                    </>
                ) : activeTab === 'script' ? (
                    <div className="space-y-4">
                        {/* Save Button */}
                        <div className="flex justify-end">
                            <button
                                onClick={onSave}
                                className="flex items-center gap-1 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all border border-blue-500/30"
                            >
                                <Save size={12} />
                                Save Scripts
                            </button>
                        </div>

                        {/* Project Level Scripts */}
                        {day.id === 'mon' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-indigo-400">Opening Mente</span>
                                    <button
                                        onClick={() => onPolish('opening', scriptData?.opening)}
                                        disabled={isPolishing === 'opening'}
                                        className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/30"
                                    >
                                        <Sparkles size={10} />
                                        {isPolishing === 'opening' ? '...' : 'AI'}
                                    </button>
                                </div>
                                <textarea
                                    value={scriptData?.opening || ''}
                                    onChange={(e) => onProjectScriptUpdate('opening', e.target.value)}
                                    placeholder="Opening..."
                                    className="w-full h-20 bg-black/30 border border-white/10 rounded p-2 text-xs text-white focus:border-indigo-500 outline-none resize-none"
                                />
                            </div>
                        )}

                        {day.id === 'thu' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-orange-400">Bridge (Climax)</span>
                                    <button
                                        onClick={() => onPolish('bridge', scriptData?.bridge)}
                                        disabled={isPolishing === 'bridge'}
                                        className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/30"
                                    >
                                        <Sparkles size={10} />
                                        {isPolishing === 'bridge' ? '...' : 'AI'}
                                    </button>
                                </div>
                                <textarea
                                    value={scriptData?.bridge || ''}
                                    onChange={(e) => onProjectScriptUpdate('bridge', e.target.value)}
                                    placeholder="Bridge..."
                                    className="w-full h-20 bg-black/30 border border-white/10 rounded p-2 text-xs text-white focus:border-indigo-500 outline-none resize-none"
                                />
                            </div>
                        )}

                        {day.id === 'sun' && (
                            <div className="space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs font-bold text-green-400">Closing Mente</span>
                                    <button
                                        onClick={() => onPolish('closing', scriptData?.closing)}
                                        disabled={isPolishing === 'closing'}
                                        className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/30"
                                    >
                                        <Sparkles size={10} />
                                        {isPolishing === 'closing' ? '...' : 'AI'}
                                    </button>
                                </div>
                                <textarea
                                    value={scriptData?.closing || ''}
                                    onChange={(e) => onProjectScriptUpdate('closing', e.target.value)}
                                    placeholder="Closing..."
                                    className="w-full h-20 bg-black/30 border border-white/10 rounded p-2 text-xs text-white focus:border-indigo-500 outline-none resize-none"
                                />
                            </div>
                        )}

                        {/* Episode Scripts */}
                        {episodes.length > 0 ? (
                            episodes.map(ep => {
                                let content = {};
                                try { content = JSON.parse(ep.script_content || '{}'); } catch {}
                                const scriptText = content.prompt || ''; // Using 'prompt' as script field

                                return (
                                    <div key={ep.id} className="space-y-2 pt-2 border-t border-white/5 first:border-0 first:pt-0">
                                        <div className="flex justify-between items-center">
                                            <span className="text-xs font-bold text-gray-300 truncate max-w-[120px]">
                                                {ep.meta?.title || 'Untitled'}
                                            </span>
                                            <button
                                                onClick={() => onPolish('episode', scriptText, 'Webtoon Review', ep.id)}
                                                disabled={isPolishing === ep.id}
                                                className="text-[10px] flex items-center gap-1 bg-indigo-500/20 text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/30"
                                            >
                                                <Sparkles size={10} />
                                                {isPolishing === ep.id ? '...' : 'AI'}
                                            </button>
                                        </div>
                                        <textarea
                                            value={scriptText}
                                            onChange={(e) => onEpisodeScriptUpdate(ep.id, e.target.value)}
                                            placeholder="Episode Script..."
                                            className="w-full h-24 bg-black/30 border border-white/10 rounded p-2 text-xs text-white focus:border-blue-500 outline-none resize-y"
                                        />
                                    </div>
                                );
                            })
                        ) : (
                            <div className="text-center py-4 text-gray-600 text-xs">
                                No episodes to script
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="space-y-2">
                        {checklistItems.length > 0 ? (
                            checklistItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => toggleCheck(item.id)}
                                    className="flex items-start gap-2 p-2 rounded-lg hover:bg-white/5 cursor-pointer group transition-colors"
                                >
                                    <button className="mt-0.5 text-gray-500 group-hover:text-blue-400 transition-colors">
                                        {item.checked ? <CheckSquare size={14} className="text-green-500" /> : <Square size={14} />}
                                    </button>
                                    <span className={`text-xs ${item.checked ? 'text-gray-500 line-through' : 'text-gray-300'}`}>
                                        {item.text}
                                    </span>
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-8 text-gray-600 text-xs">
                                No tasks for this day
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
