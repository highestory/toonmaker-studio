import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, ListChecks } from 'lucide-react';
import EpisodeCard from '@/components/EpisodeCard';
import Workstation from '@/components/Workstation';
import WeeklyChecklist from '@/components/WeeklyChecklist';

import { DEFAULT_CHECKLIST } from '@/lib/constants';

const DAYS = [
    { id: 'mon', label: 'MON', link: 'https://comic.naver.com/webtoon?tab=mon' },
    { id: 'tue', label: 'TUE', link: 'https://comic.naver.com/webtoon?tab=tue' },
    { id: 'wed', label: 'WED', link: 'https://comic.naver.com/webtoon?tab=wed' },
    { id: 'thu', label: 'THU', link: 'https://comic.naver.com/webtoon?tab=thu' },
    { id: 'fri', label: 'FRI', link: 'https://comic.naver.com/webtoon?tab=fri' },
    { id: 'sat', label: 'SAT', link: 'https://comic.naver.com/webtoon?tab=sat' },
    { id: 'sun', label: 'SUN', link: 'https://comic.naver.com/webtoon?tab=sun' },
];

export default function ProjectDetail() {
    const router = useRouter();
    const { projectId } = router.query;
    const [projectTitle, setProjectTitle] = useState('Loading...');
    const [checklistData, setChecklistData] = useState([]);
    const [scriptData, setScriptData] = useState({
        opening: '',
        bridge: '',
        closing: ''
    });
    const [polishing, setPolishing] = useState(null);
    const [showChecklist, setShowChecklist] = useState(false);

    const [weekData, setWeekData] = useState({
        mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: []
    });
    const [featuredEpisodes, setFeaturedEpisodes] = useState([]);
    const [aiSpecialId, setAiSpecialId] = useState(null);

    useEffect(() => {
        if (projectId) {
            fetchProjectData();
        }
    }, [projectId]);

    async function fetchProjectData() {
        if (!projectId) return;

        // Fetch project details (title, script_data, checklist_data, ai_special_episode_id)
        const { data: project, error: projectError } = await supabase
            .from('projects')
            .select('title, checklist_data, ai_special_episode_id, script_data')
            .eq('id', projectId)
            .single();

        if (projectError) {
            console.error('Error fetching project data:', projectError);
            return;
        }

        if (project) {
            setProjectTitle(project.title);
            setAiSpecialId(project.ai_special_episode_id);
            if (Array.isArray(project.checklist_data)) {
                setChecklistData(project.checklist_data);
            }
            if (project.script_data) {
                setScriptData(prev => ({ ...prev, ...project.script_data }));
            }
        }

        const { data: episodes, error: episodesError } = await supabase.from('episodes').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
        
        if (episodesError) {
            console.error('Error fetching episodes:', episodesError);
            return;
        }

        const newWeekData = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
        const featured = [];

        if (episodes) {
            episodes.forEach(ep => {
                // Use ep.title as the day ID (legacy schema)
                const dayId = ep.title;
                
                if (dayId && newWeekData[dayId]) {
                    try {
                        const content = JSON.parse(ep.script_content || '{}');
                        const episodeData = { 
                            ...content, 
                            id: ep.id, 
                            is_featured: ep.is_featured, 
                            day: dayId,
                            script_content: ep.script_content // Preserve raw script content
                        };
                        newWeekData[dayId].push(episodeData);

                        // Collect featured episodes
                        if (ep.is_featured) {
                            featured.push({
                                id: ep.id,
                                day: dayId,
                                title: content.meta?.webtoonTitle || content.meta?.title || 'Untitled'
                            });
                        }
                    } catch (e) {
                        console.error(`Error parsing script content for episode ${ep.id}:`, e);
                    }
                } else {
                    console.warn(`Episode ${ep.id} has invalid or missing day ID in title: ${dayId}`);
                }
            });
        }
        setWeekData(newWeekData);
        setFeaturedEpisodes(featured);
    }

    const [isWorkstationOpen, setIsWorkstationOpen] = useState(false);
    const [activeDayId, setActiveDayId] = useState(null);
    const [activeEpisodeId, setActiveEpisodeId] = useState(null);

    const handleEdit = (dayId, episode = null) => {
        setActiveDayId(dayId);
        setActiveEpisodeId(episode ? episode.id : null);
        setIsWorkstationOpen(true);
    };

    const handleSaveWork = async (data) => {
        if (!projectId) {
            alert('Please select a project first.');
            return;
        }

        const content = {
            ...data,
            meta: data.meta || {}
        };

        setIsWorkstationOpen(false);

        if (activeEpisodeId) {
            // Update existing
            await supabase.from('episodes').update({
                script_content: JSON.stringify(content),
                status: 'draft'
            }).eq('id', activeEpisodeId);
        } else {
            // Create new
            await supabase.from('episodes').insert({
                project_id: projectId,
                title: activeDayId, // Use 'title' column for day ID
                script_content: JSON.stringify(content)
            });
        }

        fetchProjectData(); // Refresh data
    };

    const handleChecklistUpdate = async (updatedChecklist) => {
        setChecklistData(updatedChecklist);
        
        // Save to Supabase
        const { error } = await supabase
            .from('projects')
            .update({ checklist_data: updatedChecklist })
            .eq('id', projectId);

        if (error) {
            console.error('Error saving checklist:', error);
        }
    };

    const handleChecklistToggle = (itemId) => {
        const currentList = Array.isArray(checklistData) && checklistData.length > 0 ? checklistData : DEFAULT_CHECKLIST;
        const updatedList = currentList.map(item => 
            item.id === itemId ? { ...item, checked: !item.checked } : item
        );
        handleChecklistUpdate(updatedList);
    };

    const handleProjectScriptUpdate = (field, value) => {
        const newScriptData = { ...scriptData, [field]: value };
        setScriptData(newScriptData);
        // Local update only
    };

    const handleEpisodeScriptUpdate = (episodeId, value) => {
        // Optimistic update (Local only)
        const newWeekData = { ...weekData };
        let found = false;
        
        for (const dayId in newWeekData) {
            const eps = newWeekData[dayId];
            const epIndex = eps.findIndex(e => e.id === episodeId);
            if (epIndex >= 0) {
                const ep = eps[epIndex];
                let content = {};
                try {
                    content = JSON.parse(ep.script_content || '{}');
                } catch {}
                
                content.prompt = value; 
                
                newWeekData[dayId][epIndex] = {
                    ...ep,
                    script_content: JSON.stringify(content)
                };
                found = true;
                break;
            }
        }
        
        if (found) setWeekData(newWeekData);
    };

    const handleSaveScripts = async () => {
        if (!projectId) return;

        // 1. Save Project Level Scripts
        const { error: projectError } = await supabase
            .from('projects')
            .update({
                script_data: scriptData
            })
            .eq('id', projectId);

        if (projectError) {
            console.error('Error saving project scripts:', projectError);
            alert('Failed to save project scripts');
            return;
        }

        // 2. Save Episode Scripts
        // We need to iterate through all episodes in weekData and update them.
        // To be efficient, we could only update changed ones, but tracking changes is complex.
        // For now, let's update all episodes that have content.
        // Or better, we can just update the ones in the current view if we passed a dayId?
        // But the user might have edited multiple days.
        // Let's iterate all days.
        
        const updates = [];
        Object.values(weekData).flat().forEach(ep => {
            updates.push({
                id: ep.id,
                script_content: ep.script_content
            });
        });

        if (updates.length > 0) {
            const { error: episodesError } = await supabase
                .from('episodes')
                .upsert(updates, { onConflict: 'id' }); // upsert is good for batch updates if ID matches

            if (episodesError) {
                console.error('Error saving episode scripts:', episodesError);
                alert('Failed to save episode scripts');
            } else {
                alert('All scripts saved successfully!');
            }
        } else {
            alert('Scripts saved successfully!');
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
                if (episodeId) {
                    handleEpisodeScriptUpdate(episodeId, data.polishedText);
                } else {
                    handleProjectScriptUpdate(type, data.polishedText);
                }
            }
        } catch (e) {
            console.error(e);
            alert('Failed to polish script');
        }
        setPolishing(null);
    };
    
    const handleAiSpecialChange = async (episodeId) => {
        setAiSpecialId(episodeId);

        // Save to DB
        await supabase
            .from('projects')
            .update({ ai_special_episode_id: episodeId })
            .eq('id', projectId);
    };

    return (
        <div className="flex flex-col h-full gap-6">
            {/* Header */}
            <div className="flex justify-between items-end">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => router.push('/dashboard')}
                        className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                    >
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h2 className="text-2xl font-bold text-white mb-1">{projectTitle}</h2>
                        <p className="text-sm text-gray-500">Weekly Episode Management</p>
                    </div>
                </div>
                <button
                    onClick={() => setShowChecklist(!showChecklist)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-colors ${showChecklist
                        ? 'bg-green-600 hover:bg-green-500 text-white'
                        : 'bg-white/5 hover:bg-white/10 text-gray-400'
                        }`}
                >
                    <ListChecks size={16} />
                    {showChecklist ? 'Hide Checklist' : 'Show Checklist'}
                </button>

            </div>

            {/* Checklist Panel */}
            {showChecklist && (
                <div className="mt-4">
                    <WeeklyChecklist
                        projectId={projectId}
                        initialData={checklistData}
                        featuredEpisodes={featuredEpisodes}
                        aiSpecialId={aiSpecialId}
                        onUpdate={handleChecklistUpdate}
                        onAiSpecialChange={handleAiSpecialChange}
                    />
                </div>
            )}

            {/* Kanban Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4 flex-1 min-h-0">
                {DAYS.map((day) => (
                    <div key={day.id} className="min-h-[300px]">
                        <EpisodeCard
                            day={day}
                            data={weekData[day.id]}
                            onEdit={handleEdit}
                            onFeaturedChange={fetchProjectData}
                            checklistItems={Array.isArray(checklistData) && checklistData.length > 0
                                ? checklistData.filter(item => item.id.startsWith(`${day.id}-`))
                                : DEFAULT_CHECKLIST.filter(item => item.id.startsWith(`${day.id}-`))
                            }
                            onToggleCheck={handleChecklistToggle}
                            scriptData={scriptData}
                            onProjectScriptUpdate={handleProjectScriptUpdate}
                            onEpisodeScriptUpdate={handleEpisodeScriptUpdate}
                            onPolish={polishScript}
                            isPolishing={polishing}
                            onSave={handleSaveScripts}
                        />
                    </div>
                ))}
            </div>

            {/* Workstation Modal */}
            <Workstation
                isOpen={isWorkstationOpen}
                onClose={() => setIsWorkstationOpen(false)}
                day={DAYS.find(d => d.id === activeDayId)}
                initialData={activeEpisodeId ? weekData[activeDayId].find(e => e.id === activeEpisodeId) : null}
                onSave={handleSaveWork}
            />

        </div>
    );
}
