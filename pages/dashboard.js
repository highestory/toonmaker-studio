import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { supabase } from '@/lib/supabase';
import { Plus, Calendar, CheckCircle2, Clock, Image } from 'lucide-react';

export default function Dashboard() {
  const router = useRouter();
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  async function fetchProjects() {
    const { data } = await supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      // Fetch episode counts for each project
      const projectsWithProgress = await Promise.all(
        data.map(async (project) => {
          const { data: episodes } = await supabase
            .from('episodes')
            .select('id, script_content')
            .eq('project_id', project.id);

          const totalEpisodes = episodes?.length || 0;
          const completedEpisodes = episodes?.filter(ep => {
            try {
              const content = JSON.parse(ep.script_content);
              return content.analysis && content.selectedImages && content.selectedImages.length > 0;
            } catch {
              return false;
            }
          }).length || 0;

          return {
            ...project,
            totalEpisodes,
            completedEpisodes,
            progress: totalEpisodes > 0 ? Math.round((completedEpisodes / totalEpisodes) * 100) : 0
          };
        })
      );

      setProjects(projectsWithProgress);
    }
  }

  const handleCreateProject = async () => {
    const title = prompt('Enter project title:');
    if (!title) return;

    const { data, error } = await supabase
      .from('projects')
      .insert({ title })
      .select()
      .single();

    if (error) {
      alert('Error: ' + error.message);
    } else {
      router.push(`/?projectId=${data.id}`);
      fetchProjects();
    }
  };

  const handleProjectClick = (projectId) => {
    router.push(`/project/${projectId}`);
  };

  return (
    <div className="flex flex-col h-full gap-6">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <h2 className="text-2xl font-bold text-white mb-1">Projects</h2>
          <p className="text-sm text-gray-500">Manage your webtoon video projects</p>
        </div>
        <button
          onClick={handleCreateProject}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg shadow-blue-900/20"
        >
          <Plus size={16} />
          New Project
        </button>
      </div>

      {/* Project Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {projects.map((project) => (
          <div
            key={project.id}
            onClick={() => handleProjectClick(project.id)}
            className="bg-[#1a1b26] border border-white/5 rounded-xl p-5 hover:border-blue-500/50 transition-all cursor-pointer group"
          >
            {/* Project Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-bold text-white text-lg mb-1 group-hover:text-blue-400 transition-colors line-clamp-2">
                  {project.title}
                </h3>
                <p className="text-xs text-gray-500 flex items-center gap-1">
                  <Calendar size={12} />
                  {new Date(project.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="flex justify-between text-xs mb-2">
                <span className="text-gray-400">Progress</span>
                <span className="text-blue-400 font-bold">{project.progress}%</span>
              </div>
              <div className="w-full bg-black/40 rounded-full h-2 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-blue-600 to-indigo-500 rounded-full transition-all duration-500"
                  style={{ width: `${project.progress}%` }}
                />
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                <div className="flex items-center gap-1 mb-1">
                  <Image size={12} className="text-gray-500" />
                  <span className="text-[10px] text-gray-500">Episodes</span>
                </div>
                <span className="text-sm font-bold text-white">{project.totalEpisodes}</span>
              </div>

              <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                <div className="flex items-center gap-1 mb-1">
                  <CheckCircle2 size={12} className="text-green-500" />
                  <span className="text-[10px] text-gray-500">Done</span>
                </div>
                <span className="text-sm font-bold text-green-400">{project.completedEpisodes}</span>
              </div>

              <div className="bg-black/20 rounded-lg p-2 border border-white/5">
                <div className="flex items-center gap-1 mb-1">
                  <Clock size={12} className="text-orange-500" />
                  <span className="text-[10px] text-gray-500">Pending</span>
                </div>
                <span className="text-sm font-bold text-orange-400">{project.totalEpisodes - project.completedEpisodes}</span>
              </div>
            </div>

            {/* Status Badge */}
            <div className="mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${project.progress === 100 ? 'bg-green-500' : project.progress > 0 ? 'bg-yellow-500' : 'bg-gray-600'}`} />
                <span className="text-xs text-gray-400">
                  {project.progress === 100 ? 'Completed' : project.progress > 0 ? 'In Progress' : 'Not Started'}
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Empty State */}
        {projects.length === 0 && (
          <div className="col-span-full flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/10 rounded-xl">
            <Plus size={48} className="text-gray-600 mb-4" />
            <h3 className="text-lg font-bold text-gray-400 mb-2">No Projects Yet</h3>
            <p className="text-sm text-gray-600 mb-4">Create your first project to get started</p>
            <button
              onClick={handleCreateProject}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
            >
              Create Project
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
