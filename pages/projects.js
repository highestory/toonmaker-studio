import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Folder } from 'lucide-react';
import Link from 'next/link';

export default function Projects() {
    const [projects, setProjects] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProjects();
    }, []);

    async function fetchProjects() {
        setLoading(true);
        const { data, error } = await supabase
            .from('projects')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching projects:', error);
        } else {
            setProjects(data || []);
        }
        setLoading(false);
    }

    async function createProject() {
        const title = prompt('Project Title:');
        if (!title) return;

        const { data, error } = await supabase
            .from('projects')
            .insert([{ title }])
            .select();

        if (error) {
            alert(`Error creating project: ${error.message}`);
            console.error(error);
        } else {
            setProjects([data[0], ...projects]);
        }
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-2xl font-bold text-white">Projects</h1>
                <button
                    onClick={createProject}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors"
                >
                    <Plus size={16} />
                    New Project
                </button>
            </div>

            {loading ? (
                <div className="text-gray-400">Loading projects...</div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {projects.map(project => (
                        <Link href={`/?projectId=${project.id}`} key={project.id}>
                            <div className="bg-[#1a1b26] p-6 rounded-xl border border-white/10 hover:border-blue-500/50 transition-colors cursor-pointer group">
                                <div className="flex items-start justify-between mb-4">
                                    <Folder className="text-blue-500 group-hover:text-blue-400" size={24} />
                                    <span className="text-xs text-gray-500">{new Date(project.created_at).toLocaleDateString()}</span>
                                </div>
                                <h3 className="font-bold text-lg text-gray-200 group-hover:text-white mb-2">{project.title}</h3>
                                <p className="text-sm text-gray-500 line-clamp-2">{project.description || 'No description'}</p>
                            </div>
                        </Link>
                    ))}
                    {projects.length === 0 && (
                        <div className="col-span-full text-center py-12 text-gray-500">
                            No projects found. Create one to get started.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
