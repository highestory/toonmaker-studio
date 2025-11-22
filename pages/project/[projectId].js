import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { ArrowLeft, Plus, ListChecks } from 'lucide-react';
import EpisodeCard from '@/components/EpisodeCard';
import Workstation from '@/components/Workstation';
import WeeklyChecklist from '@/components/WeeklyChecklist';

const DAYS = [
    { id: 'mon', label: 'MON' },
    { id: 'tue', label: 'TUE' },
    { id: 'wed', label: 'WED' },
    { id: 'thu', label: 'THU' },
    { id: 'fri', label: 'FRI' },
    { id: 'sat', label: 'SAT' },
    { id: 'sun', label: 'SUN' },
];

export default function ProjectDetail() {
    const router = useRouter();
    const { projectId } = router.query;
    const [projectTitle, setProjectTitle] = useState('Loading...');
    const [checklistData, setChecklistData] = useState([]);
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
        const { data: project } = await supabase.from('projects').select('title, checklist_data, ai_special_episode_id').eq('id', projectId).single();
        if (project) {
            setProjectTitle(project.title);
            setAiSpecialId(project.ai_special_episode_id);
            if (project.checklist_data) {
                setChecklistData(project.checklist_data);
            }
        }

        const { data: episodes } = await supabase.from('episodes').select('*').eq('project_id', projectId).order('created_at', { ascending: true });
        const newWeekData = { mon: [], tue: [], wed: [], thu: [], fri: [], sat: [], sun: [] };
        const featured = [];

        if (episodes) {
            episodes.forEach(ep => {
                if (newWeekData[ep.title]) {
                    try {
                        const content = JSON.parse(ep.script_content);
                        const episodeData = { ...content, id: ep.id, is_featured: ep.is_featured };
                        newWeekData[ep.title].push(episodeData);

                        // Collect featured episodes
                        if (ep.is_featured) {
                            featured.push({
                                id: ep.id,
                                day: ep.title,
                                title: content.meta?.webtoonTitle || content.meta?.title || 'Untitled'
                            });
                        }
                    } catch (e) {
                        console.error('Error parsing script content', e);
                    }
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
                title: activeDayId,
                script_content: JSON.stringify(content)
            });
        }

        fetchProjectData(); // Refresh data
    };

    const handleChecklistUpdate = async (updatedChecklist) => {
        setChecklistData(updatedChecklist);

        // Save to DB
        await supabase
            .from('projects')
            .update({ checklist_data: updatedChecklist })
            .eq('id', projectId);
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
                        onClick={() => router.push('/')}
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
            <div className="grid grid-cols-4 xl:grid-cols-7 gap-4 flex-1 min-h-0">
                {DAYS.map((day) => (
                    <div key={day.id} className="min-h-[300px]">
                        <EpisodeCard
                            day={day}
                            data={weekData[day.id]}
                            onEdit={handleEdit}
                            onFeaturedChange={fetchProjectData}
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
