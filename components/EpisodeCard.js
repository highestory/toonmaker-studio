import { Edit2, Plus, Star } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useState } from 'react';

export default function EpisodeCard({ day, data, onEdit, onFeaturedChange }) {
    // data is now an array of episodes
    const episodes = Array.isArray(data) ? data : [];

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

    return (
        <div className="bg-[#1a1b26] border border-white/5 rounded-xl p-3 flex flex-col gap-3 h-full">
            {/* Header */}
            <div className="flex justify-between items-center">
                <span className="font-bold text-gray-400 text-sm">{day.label}</span>
                <span className="text-xs text-gray-600 font-mono">{episodes.length} Episodes</span>
            </div>

            {/* Episode List */}
            <div className="flex-1 flex flex-col gap-3 overflow-y-auto min-h-0">
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
            </div>

            {/* Add Button */}
            <button
                onClick={() => onEdit(day.id, null)}
                className="w-full bg-blue-600/10 hover:bg-blue-600 hover:text-white text-blue-500 text-xs py-2 rounded-lg flex items-center justify-center gap-2 transition-all font-bold border border-blue-500/20 hover:border-blue-500"
            >
                <Plus size={14} />
                Add Episode
            </button>
        </div>
    );
}
