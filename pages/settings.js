import { useState, useEffect } from 'react';
import { Save, Key, MessageSquare } from 'lucide-react';

export default function Settings() {
    const [geminiKey, setGeminiKey] = useState('');
    const [systemPrompt, setSystemPrompt] = useState('');

    const [message, setMessage] = useState('');

    useEffect(() => {
        // Load from localStorage on mount
        const savedKey = localStorage.getItem('GEMINI_API_KEY');
        const savedPrompt = localStorage.getItem('SYSTEM_PROMPT');

        if (savedKey) setGeminiKey(savedKey);
        if (savedPrompt) setSystemPrompt(savedPrompt);
        else setSystemPrompt("You are ToonJigi, a 1-million subscriber YouTuber specializing in engaging webtoon content. Your goal is to create dynamic and entertaining video scripts based on provided comic panels, focusing on pacing, humor, and audience engagement.");
    }, []);

    const handleSave = () => {
        localStorage.setItem('GEMINI_API_KEY', geminiKey);
        localStorage.setItem('SYSTEM_PROMPT', systemPrompt);

        setMessage('Settings Saved!');
        setTimeout(() => setMessage(''), 3000);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-8">
            <div className="flex justify-between items-center border-b border-white/10 pb-6">
                <div>
                    <h1 className="text-2xl font-bold text-white">Application Settings</h1>
                    <p className="text-gray-400 text-sm mt-1">Manage API keys and AI personas</p>
                </div>
                <div className="flex items-center gap-4">
                    {message && <span className="text-green-400 text-sm font-bold animate-pulse">{message}</span>}
                    <button
                        onClick={handleSave}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
                    >
                        <Save size={16} />
                        Save Changes
                    </button>
                </div>
            </div>

            {/* API Configuration */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Key size={20} className="text-blue-400" />
                    API Configuration
                </h2>
                <div className="bg-[#1a1b26] border border-white/10 rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Gemini API Key</label>
                        <div className="flex gap-2">
                            <input
                                type="password"
                                value={geminiKey}
                                onChange={(e) => setGeminiKey(e.target.value)}
                                placeholder="Enter your Gemini API Key..."
                                className="flex-1 bg-black/30 border border-white/10 rounded-lg px-4 py-2 text-white focus:border-blue-500 outline-none font-mono text-sm"
                            />
                            <button className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm text-gray-300 transition-colors">
                                Verify
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">
                            Your API key is stored locally in your browser.
                        </p>
                    </div>

                    <div className="pt-4 border-t border-white/10">
                        <label className="block text-sm font-medium text-gray-300 mb-2">Replicate API Configuration</label>
                        <p className="text-xs text-green-400 font-mono bg-green-500/10 inline-block px-2 py-1 rounded">
                            ✓ Managed by Server (.env.local)
                        </p>
                    </div>
                </div>
            </section>

            {/* AI Persona */}
            <section className="space-y-4">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <MessageSquare size={20} className="text-purple-400" />
                    AI Persona & Prompt
                </h2>
                <div className="bg-[#1a1b26] border border-white/10 rounded-xl p-6 space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Gemini System Prompt</label>
                        <textarea
                            value={systemPrompt}
                            onChange={(e) => setSystemPrompt(e.target.value)}
                            rows={6}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-4 py-3 text-white focus:border-blue-500 outline-none text-sm leading-relaxed resize-none"
                        />
                    </div>
                </div>
            </section>
        </div>
    );
}
