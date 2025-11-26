import { useState, useEffect } from 'react';
import { X, Search, Sparkles, Play, Mic, Image as ImageIcon, Copy, Scissors, Save, Plus } from 'lucide-react';

export default function Workstation({ isOpen, onClose, day, initialData, onSave }) {
    const [url, setUrl] = useState(initialData?.url || '');
    const [images, setImages] = useState(initialData?.images || []);
    const [script, setScript] = useState(initialData?.analysis || '');
    const [prompt, setPrompt] = useState(initialData?.prompt || '');
    const [meta, setMeta] = useState(initialData?.meta || {});
    const [selectedImages, setSelectedImages] = useState(initialData?.selectedImages || []);
    const [loading, setLoading] = useState(false);
    const [analyzing, setAnalyzing] = useState(false);
    const [generatingScript, setGeneratingScript] = useState(false);
    const [lightboxImage, setLightboxImage] = useState(null);

    // Storyboard State
    const [viewMode, setViewMode] = useState('script'); // 'script' | 'storyboard'
    const [storyboard, setStoryboard] = useState(initialData?.storyboard || []);
    const [guideText, setGuideText] = useState(initialData?.guideText || '');
    const [showGuide, setShowGuide] = useState(true);

    useEffect(() => {
        if (isOpen) {
            setUrl(initialData?.url || '');
            setImages(initialData?.images || []);
            setScript(initialData?.analysis || '');
            setPrompt(initialData?.prompt || '');
            setMeta(initialData?.meta || {});
            setSelectedImages(initialData?.selectedImages || []);
            setStoryboard(initialData?.storyboard || []);
            setGuideText(initialData?.guideText || '');
        }
    }, [initialData, isOpen]);

    const toggleSelection = (img) => {
        setSelectedImages(prev =>
            prev.includes(img)
                ? prev.filter(i => i !== img)
                : [...prev, img]
        );
    };

    const handleDownloadSelected = async () => {
        if (selectedImages.length === 0) return alert('No images selected');

        for (let i = 0; i < selectedImages.length; i++) {
            const imgUrl = selectedImages[i];
            try {
                // Use proxy to bypass CORS
                const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`);
                if (!response.ok) throw new Error('Download failed');

                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `image_${i + 1}.jpg`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            } catch (e) {
                console.error('Download failed', e);
                alert(`Failed to download image ${i + 1}`);
            }
        }
    };

    const handleGenerateShorts = async () => {
        if (!script) return alert('Please generate the main analysis first (Column 2).');
        setGeneratingScript(true);
        try {
            const apiKey = localStorage.getItem('GEMINI_API_KEY');
            const res = await fetch('/api/generate-shorts', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-api-key': apiKey || ''
                },
                body: JSON.stringify({
                    summary: script,
                    selectedImages: selectedImages,
                    referer: url
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Server error');
            if (data.script) setPrompt(data.script);
        } catch (e) {
            console.error(e);
            alert(`Error: ${e.message}`);
        } finally {
            setGeneratingScript(false);
        }
    };

    // Column 1: Source
    const handleScrape = async () => {
        if (!url) return;
        setLoading(true);
        try {
            const res = await fetch('/api/webtoon?url=' + encodeURIComponent(url));
            const data = await res.json();
            if (data.images) setImages(data.images);
            if (data.meta) setMeta(data.meta);
        } catch (e) {
            console.error(e);
            alert('Failed to scrape images');
        } finally {
            setLoading(false);
        }
    };

    // Column 2: Script
    const handleAnalyze = async () => {
        if (images.length === 0) return;
        setAnalyzing(true);
        try {
            const apiKey = localStorage.getItem('GEMINI_API_KEY');
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-gemini-api-key': apiKey || ''
                },
                body: JSON.stringify({ imageUrls: images, referer: url })
            });
            const data = await res.json();
            if (data.analysis) setScript(data.analysis);
        } catch (e) {
            console.error(e);
            alert('Failed to analyze');
        } finally {
            setAnalyzing(false);
        }
    };

    // Storyboard Functions
    const addScene = () => {
        setStoryboard(prev => [
            ...prev,
            {
                id: crypto.randomUUID(),
                time: '',
                dialogue: '',
                images: [],
                direction: ''
            }
        ]);
    };

    const updateScene = (id, field, value) => {
        setStoryboard(prev => prev.map(scene =>
            scene.id === id ? { ...scene, [field]: value } : scene
        ));
    };

    const deleteScene = (id) => {
        setStoryboard(prev => prev.filter(scene => scene.id !== id));
    };

    const addSceneImage = (sceneId, imgUrl) => {
        setStoryboard(prev => prev.map(scene => {
            if (scene.id === sceneId) {
                const currentImages = scene.images || [];
                if (currentImages.includes(imgUrl)) return scene;
                return { ...scene, images: [...currentImages, imgUrl] };
            }
            return scene;
        }));
    };

    const removeSceneImage = (sceneId, index) => {
        setStoryboard(prev => prev.map(scene => {
            if (scene.id === sceneId) {
                const newImages = [...(scene.images || [])];
                newImages.splice(index, 1);
                return { ...scene, images: newImages };
            }
            return scene;
        }));
    };

    const formatTime = (input) => {
        // Handle "5" -> "00:05"
        // Handle "5-9" or "5~9" -> "00:05 ~ 00:09"
        if (!input) return '';

        const formatSingle = (val) => {
            val = val.trim().replace(/[^0-9]/g, '');
            if (!val) return '';
            const num = parseInt(val, 10);
            const mins = Math.floor(num / 60).toString().padStart(2, '0');
            const secs = (num % 60).toString().padStart(2, '0');
            return `${mins}:${secs}`;
        };

        if (input.includes('~') || input.includes('-')) {
            const parts = input.split(/[~-]/);
            return `${formatSingle(parts[0])} ~ ${formatSingle(parts[1])}`;
        } else {
            return formatSingle(input);
        }
    };

    const parseSceneText = (text) => {
        // Parse format:
        // 05~09초 (4초): "남주가 영화 보자고 해놓고..."
        // 화면: ...
        // 연출: ...
        // 효과: ...

        const lines = text.split('\n');
        const scene = {
            id: crypto.randomUUID(),
            time: '',
            dialogue: '',
            images: [],
            direction: ''
        };

        lines.forEach(line => {
            line = line.trim();
            if (!line) return;

            if (line.match(/^[0-9]/)) {
                // Time & Dialogue line
                const timeMatch = line.match(/^([0-9~-]+)초?/);
                if (timeMatch) {
                    scene.time = formatTime(timeMatch[1]);
                }

                const dialogueMatch = line.match(/"([^"]+)"/);
                if (dialogueMatch) {
                    scene.dialogue = dialogueMatch[1];
                }
            } else if (line.startsWith('화면:')) {
                // Image hint (can't auto-select image easily without ID, but we can store it or ignore)
                // For now, maybe put it in direction if it's text description?
            } else if (line.startsWith('연출:')) {
                scene.direction = line.replace('연출:', '').trim();
            }
        });

        return scene;
    };

    const handleSmartPaste = async () => {
        try {
            const text = await navigator.clipboard.readText();
            if (!text) return;

            // Heuristic: If text contains multiple blocks, split them?
            // For now, assume one scene per paste or split by double newlines
            const blocks = text.split(/\n\s*\n/);
            const newScenes = blocks.map(block => parseSceneText(block)).filter(s => s.time || s.dialogue);

            if (newScenes.length > 0) {
                setStoryboard(prev => [...prev, ...newScenes]);
            } else {
                alert('Could not parse scene data from clipboard.');
            }
        } catch (e) {
            console.error('Paste failed', e);
            alert('Failed to read clipboard. Please allow permissions.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-0 md:p-6">
            <div className="bg-[#1a1b26] w-full max-w-[1600px] h-full md:h-[90vh] rounded-none md:rounded-2xl border-0 md:border border-white/10 flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="h-14 border-b border-white/10 flex justify-between items-center px-4 md:px-6 bg-[#13141c] shrink-0">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-blue-400 truncate max-w-[100px] md:max-w-none">{day?.label}</span>
                        <span className="text-gray-500">|</span>
                        <span className="hidden md:inline">Webtoon Video Creator</span>
                        <span className="md:hidden">Creator</span>
                    </h2>

                    {/* View Toggle */}
                    <div className="flex bg-black/40 rounded-lg p-1">
                        <button
                            onClick={() => setViewMode('script')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'script' ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Script Editor
                        </button>
                        <button
                            onClick={() => setViewMode('storyboard')}
                            className={`px-3 py-1.5 rounded-md text-xs font-bold transition-colors ${viewMode === 'storyboard' ? 'bg-indigo-600 text-white' : 'text-gray-400 hover:text-white'}`}
                        >
                            Storyboard
                        </button>
                    </div>

                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* 3-Column Layout */}
                <div className="flex-1 grid grid-cols-1 lg:grid-cols-3 divide-y lg:divide-y-0 lg:divide-x divide-white/10 min-h-0 overflow-y-auto lg:overflow-hidden">

                    {/* Column 1: Source & Vision (Script Mode) or Selected Images (Storyboard Mode) */}
                    <div className="flex flex-col p-4 gap-4 min-h-[500px] lg:min-h-0">
                        {viewMode === 'script' ? (
                            <>
                                <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Source & Gemini Vision</h3>

                                {meta.thumbnail && (
                                    <div className="flex gap-3 bg-black/20 p-2 rounded-lg border border-white/5 mb-2">
                                        <img src={meta.thumbnail} alt="Thumbnail" className="w-16 h-16 object-cover rounded-md" />
                                        <div className="flex flex-col justify-center overflow-hidden">
                                            <h4 className="text-sm font-bold text-white truncate">{meta.webtoonTitle || 'Webtoon'}</h4>
                                            <p className="text-xs text-gray-400 truncate">{meta.episodeTitle || meta.title}</p>
                                        </div>
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={url}
                                        onChange={(e) => setUrl(e.target.value)}
                                        placeholder="https://comic.naver.com/..."
                                        className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-blue-500 outline-none"
                                    />
                                    <button
                                        onClick={handleScrape}
                                        disabled={loading}
                                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors disabled:opacity-50"
                                    >
                                        {loading ? '...' : 'Scrape'}
                                    </button>
                                </div>

                                <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-y-auto flex flex-col">
                                    {images.map((img, i) => (
                                        <div
                                            key={i}
                                            onClick={() => toggleSelection(img)}
                                            draggable
                                            onDragStart={(e) => e.dataTransfer.setData('text/plain', img)}
                                            className={`w-full relative group cursor-pointer transition-all ${selectedImages.includes(img) ? 'ring-2 ring-blue-500 z-10' : ''}`}
                                        >
                                            <img src={img} alt={`Panel ${i}`} className="w-full h-auto block" loading="lazy" />
                                            <div className={`absolute inset-0 bg-blue-500/20 transition-opacity flex items-center justify-center border-y border-blue-500 ${selectedImages.includes(img) ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                                                <span className="text-xs font-bold text-white drop-shadow-md">
                                                    {selectedImages.includes(img) ? 'Selected' : 'Select'}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                    {images.length === 0 && (
                                        <div className="col-span-3 h-40 flex items-center justify-center text-gray-600 text-sm">
                                            No images loaded
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={handleAnalyze}
                                    disabled={analyzing || images.length === 0}
                                    className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    <Sparkles size={20} />
                                    {analyzing ? 'Analyzing Scene...' : 'AI Script Generation'}
                                </button>
                            </>
                        ) : (
                            <>
                                <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Selected Images ({selectedImages.length})</h3>
                                <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-y-auto p-4 block">
                                    <div className="grid grid-cols-2 gap-4">
                                        {selectedImages.map((img, i) => {
                                            const isUsed = storyboard.some(scene => scene.images && scene.images.includes(img));
                                            return (
                                                <div
                                                    key={i}
                                                    className={`relative group bg-gray-800 rounded-lg overflow-hidden border shadow-lg cursor-grab active:cursor-grabbing transition-all ${isUsed ? 'border-green-500 ring-1 ring-green-500/50' : 'border-white/10'}`}
                                                    draggable
                                                    onDragStart={(e) => e.dataTransfer.setData('text/plain', img)}
                                                    onClick={() => setLightboxImage(img)}
                                                >
                                                    <img
                                                        src={img}
                                                        alt={`Selected ${i}`}
                                                        className={`w-full h-auto block transition-opacity ${isUsed ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}`}
                                                    />
                                                    <div className="absolute top-2 right-2 flex gap-2">
                                                        <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                                                            #{i + 1}
                                                        </span>
                                                    </div>
                                                    {isUsed && (
                                                        <div className="absolute inset-0 bg-green-500/10 pointer-events-none flex items-center justify-center">
                                                            <span className="bg-green-600 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-lg">
                                                                Used
                                                            </span>
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    {selectedImages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm gap-2 opacity-50">
                                            <ImageIcon size={32} />
                                            <span>No images selected</span>
                                            <button
                                                onClick={() => setViewMode('script')}
                                                className="text-blue-400 hover:underline mt-2"
                                            >
                                                Go to Script Mode to select
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </>
                        )}
                    </div>

                    {/* View Mode Content */}
                    {viewMode === 'script' ? (
                        <>
                            {/* Column 2: Script Editor */}
                            <div className="flex flex-col p-4 gap-4 min-h-[500px] lg:min-h-0">
                                <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Script Editor</h3>

                                <textarea
                                    value={script}
                                    onChange={(e) => setScript(e.target.value)}
                                    placeholder="AI generated script will appear here..."
                                    className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-200 leading-relaxed resize-none focus:border-blue-500 outline-none font-mono"
                                />
                            </div>

                            {/* Column 3: Selected Assets */}
                            <div className="flex flex-col p-4 gap-4 min-h-[500px] lg:min-h-0">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Selected Images ({selectedImages.length})</h3>
                                    <button
                                        onClick={handleDownloadSelected}
                                        disabled={selectedImages.length === 0}
                                        className="text-xs bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <Save size={12} />
                                        Download
                                    </button>
                                </div>

                                <div className="flex-1 bg-black/20 rounded-xl border border-white/5 overflow-y-auto p-4 block">
                                    <div className="columns-2 gap-4 space-y-4">
                                        {selectedImages.map((img, i) => (
                                            <div key={i} className="relative group bg-gray-800 rounded-lg overflow-hidden border border-white/10 shadow-lg break-inside-avoid">
                                                <img
                                                    src={img}
                                                    alt={`Selected ${i}`}
                                                    className="w-full h-auto block cursor-pointer"
                                                    onClick={() => setLightboxImage(img)}
                                                />
                                                <div className="absolute top-2 right-2 flex gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                                    <span className="bg-black/60 text-white text-[10px] px-2 py-1 rounded-full backdrop-blur-md">
                                                        #{i + 1}
                                                    </span>
                                                    <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            toggleSelection(img);
                                                        }}
                                                        className="bg-red-500 hover:bg-red-600 text-white p-1.5 rounded-full shadow-md transition-colors"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    {selectedImages.length === 0 && (
                                        <div className="h-full flex flex-col items-center justify-center text-gray-600 text-sm gap-2 opacity-50">
                                            <ImageIcon size={32} />
                                            <span>Select images from the left panel</span>
                                        </div>
                                    )}
                                </div>

                                <div className="flex-1 bg-black/20 rounded-xl border border-white/5 p-4 flex flex-col gap-3">
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs font-bold text-indigo-400">Shorts Script Generator</span>
                                        <button
                                            onClick={handleGenerateShorts}
                                            disabled={generatingScript || !script}
                                            className="text-[10px] bg-indigo-600 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50 flex items-center gap-1"
                                        >
                                            <Sparkles size={10} />
                                            {generatingScript ? 'Generating...' : 'Generate Script'}
                                        </button>
                                    </div>
                                    <textarea
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        className="flex-1 bg-black/30 rounded-lg p-3 text-xs text-gray-300 resize-none outline-none font-mono leading-relaxed"
                                        placeholder="Generated 30s Shorts script will appear here..."
                                    />
                                    <div className="flex items-center gap-2">
                                        <input type="checkbox" id="trans" className="rounded bg-white/10 border-white/20" defaultChecked />
                                        <label htmlFor="trans" className="text-xs text-gray-400">Include Hooking Elements</label>
                                    </div>
                                    <button
                                        onClick={() => navigator.clipboard.writeText(prompt)}
                                        className="w-full bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 py-2 rounded-lg text-xs flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <Copy size={14} />
                                        Copy Script
                                    </button>
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            {/* Storyboard View (Spans 2 columns) */}
                            <div className="col-span-1 lg:col-span-2 flex flex-col p-4 gap-4 min-h-[500px] lg:min-h-0 bg-[#0f1014]">
                                <div className="flex justify-between items-center">
                                    <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Storyboard</h3>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={handleSmartPaste}
                                            className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-2 rounded-lg text-xs font-bold flex items-center gap-2 transition-colors"
                                            title="Paste formatted text"
                                        >
                                            <Copy size={14} />
                                            Smart Paste
                                        </button>
                                        <button
                                            onClick={addScene}
                                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors"
                                        >
                                            <Plus size={16} />
                                            Add Scene
                                        </button>
                                    </div>
                                </div>

                                {/* Editing Guide Area */}
                                <div className="bg-[#1a1b26] border border-white/10 rounded-xl p-4 flex flex-col gap-2">
                                    <div className="flex justify-between items-center cursor-pointer" onClick={() => setShowGuide(!showGuide)}>
                                        <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-2">
                                            <span className="bg-blue-600 w-2 h-2 rounded-full"></span>
                                            Editing Guide / Memo
                                        </label>
                                        <span className="text-xs text-gray-500">{showGuide ? 'Hide' : 'Show'}</span>
                                    </div>
                                    {showGuide && (
                                        <textarea
                                            value={guideText}
                                            onChange={(e) => setGuideText(e.target.value)}
                                            placeholder="Paste your editing guide or notes here..."
                                            className="w-full h-48 bg-black/30 border border-white/10 rounded-lg p-3 text-sm text-gray-300 font-mono leading-relaxed resize-y focus:border-indigo-500 outline-none"
                                        />
                                    )}
                                </div>

                                <div className="flex-1 overflow-y-auto space-y-4 pr-2">
                                    {storyboard.map((scene, index) => (
                                        <div key={scene.id} className="bg-[#1a1b26] border border-white/10 rounded-xl p-4 flex gap-4 group">
                                            {/* Image Area (Multi-select) */}
                                            <div className="w-48 flex flex-col gap-2 shrink-0">
                                                <div
                                                    className="flex-1 min-h-[112px] bg-black/40 rounded-lg border border-white/10 flex flex-col items-center justify-center relative overflow-hidden cursor-pointer hover:border-indigo-500 transition-colors"
                                                    onClick={() => alert('Drag and drop images from the left panel here!')}
                                                    onDragOver={(e) => e.preventDefault()}
                                                    onDrop={(e) => {
                                                        e.preventDefault();
                                                        const imgUrl = e.dataTransfer.getData('text/plain');
                                                        if (imgUrl) addSceneImage(scene.id, imgUrl);
                                                    }}
                                                >
                                                    {scene.images && scene.images.length > 0 ? (
                                                        <div className="grid grid-cols-2 gap-1 w-full h-full p-1 overflow-y-auto">
                                                            {scene.images.map((img, i) => (
                                                                <div key={i} className="relative group/img aspect-square">
                                                                    <img src={img} alt={`Scene ${index} - ${i}`} className="w-full h-full object-cover rounded-sm" />
                                                                    <button
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeSceneImage(scene.id, i);
                                                                        }}
                                                                        className="absolute top-0.5 right-0.5 bg-red-500/80 text-white p-0.5 rounded-full opacity-0 group-hover/img:opacity-100 transition-opacity"
                                                                    >
                                                                        <X size={10} />
                                                                    </button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="text-center p-2">
                                                            <ImageIcon className="mx-auto text-gray-600 mb-1" size={24} />
                                                            <span className="text-[10px] text-gray-500 block">Drop Images Here</span>
                                                        </div>
                                                    )}
                                                    {/* Overlay count if many images */}
                                                    {scene.images && scene.images.length > 0 && (
                                                        <div className="absolute bottom-0 right-0 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded-tl-md">
                                                            {scene.images.length}
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="text-[10px] text-gray-500 text-center">
                                                    {scene.images?.length || 0} images selected
                                                </div>
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 space-y-3">
                                                <div className="flex items-center gap-2">
                                                    <span className="bg-gray-700 text-white text-xs font-bold px-2 py-1 rounded">#{index + 1}</span>
                                                    <input
                                                        type="text"
                                                        placeholder="00:00 ~ 00:05"
                                                        value={scene.time}
                                                        onChange={(e) => updateScene(scene.id, 'time', e.target.value)}
                                                        onBlur={(e) => updateScene(scene.id, 'time', formatTime(e.target.value))}
                                                        className="bg-black/30 border border-white/10 rounded px-2 py-1 text-xs text-white w-32 text-center focus:border-indigo-500 outline-none"
                                                    />
                                                    <div className="flex-1" />
                                                    <button
                                                        onClick={() => deleteScene(scene.id)}
                                                        className="text-gray-500 hover:text-red-400 p-1 opacity-0 group-hover:opacity-100 transition-all"
                                                    >
                                                        <X size={16} />
                                                    </button>
                                                </div>

                                                <div className="grid grid-cols-2 gap-4">
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">대본</label>
                                                        <textarea
                                                            value={scene.dialogue}
                                                            onChange={(e) => updateScene(scene.id, 'dialogue', e.target.value)}
                                                            placeholder="대본을 입력하세요..."
                                                            className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white resize-none focus:border-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-[10px] text-gray-500 uppercase font-bold block mb-1">연출</label>
                                                        <textarea
                                                            value={scene.direction}
                                                            onChange={(e) => updateScene(scene.id, 'direction', e.target.value)}
                                                            placeholder="예: 줌인, 팬..."
                                                            className="w-full h-24 bg-black/30 border border-white/10 rounded-lg p-2 text-sm text-white resize-none focus:border-indigo-500 outline-none"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}

                                    {storyboard.length === 0 && (
                                        <div className="h-64 flex flex-col items-center justify-center text-gray-500 border-2 border-dashed border-white/10 rounded-xl">
                                            <p className="mb-4">No scenes yet</p>
                                            <div className="flex gap-3">
                                                <button
                                                    onClick={handleSmartPaste}
                                                    className="bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                                >
                                                    <Copy size={16} />
                                                    Smart Paste
                                                </button>
                                                <button
                                                    onClick={addScene}
                                                    className="bg-white/5 hover:bg-white/10 text-white px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center gap-2"
                                                >
                                                    <Plus size={16} />
                                                    Create Empty Scene
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="h-16 border-t border-white/10 bg-[#13141c] flex justify-end items-center px-6 gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave({ url, images, analysis: script, prompt, meta, selectedImages, storyboard, guideText })}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-colors"
                    >
                        <Save size={16} />
                        Save & Continue
                    </button>
                </div>
            </div>

            {/* Lightbox for full-size image viewing */}
            {
                lightboxImage && (
                    <div
                        className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 backdrop-blur-sm"
                        onClick={() => setLightboxImage(null)}
                    >
                        <button
                            onClick={() => setLightboxImage(null)}
                            className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 text-white p-2 rounded-full transition-colors z-10"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={lightboxImage}
                            alt="Full size"
                            className="max-w-full max-h-full object-contain rounded-lg shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                )
            }
        </div >
    );
}

function StatusItem({ label, status, color, icon: Icon }) {
    return (
        <div className="flex items-center justify-between text-[10px]">
            <div className="flex items-center gap-1.5">
                <Icon size={12} className={color} />
                <span className="text-gray-400">{label}</span>
            </div>
            <span className={`${color} font-medium`}>{status}</span>
        </div>
    );
}
