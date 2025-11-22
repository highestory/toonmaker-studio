import { useState, useEffect } from 'react';
import { X, Search, Sparkles, Play, Mic, Image as ImageIcon, Copy, Scissors, Save } from 'lucide-react';

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

    useEffect(() => {
        if (isOpen) {
            setUrl(initialData?.url || '');
            setImages(initialData?.images || []);
            setScript(initialData?.analysis || '');
            setPrompt(initialData?.prompt || '');
            setMeta(initialData?.meta || {});
            setSelectedImages(initialData?.selectedImages || []);
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

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-6">
            <div className="bg-[#1a1b26] w-full max-w-[1600px] h-[90vh] rounded-2xl border border-white/10 flex flex-col shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="h-14 border-b border-white/10 flex justify-between items-center px-6 bg-[#13141c]">
                    <h2 className="font-bold text-lg flex items-center gap-2">
                        <span className="text-blue-400">{day?.label}</span>
                        <span className="text-gray-500">|</span>
                        <span>Webtoon Video Creator</span>
                    </h2>
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* 3-Column Layout */}
                <div className="flex-1 grid grid-cols-3 divide-x divide-white/10 min-h-0">

                    {/* Column 1: Source & Vision */}
                    <div className="flex flex-col p-4 gap-4 min-h-0">
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
                    </div>

                    {/* Column 2: Script Editor */}
                    <div className="flex flex-col p-4 gap-4 min-h-0">
                        <h3 className="font-bold text-gray-400 text-sm uppercase tracking-wider">Script Editor</h3>

                        <textarea
                            value={script}
                            onChange={(e) => setScript(e.target.value)}
                            placeholder="AI generated script will appear here..."
                            className="flex-1 bg-black/30 border border-white/10 rounded-xl p-4 text-sm text-gray-200 leading-relaxed resize-none focus:border-blue-500 outline-none font-mono"
                        />
                    </div>

                    {/* Column 3: Selected Assets */}
                    <div className="flex flex-col p-4 gap-4 min-h-0">
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
                </div>

                {/* Footer */}
                <div className="h-16 border-t border-white/10 bg-[#13141c] flex justify-end items-center px-6 gap-3">
                    <button onClick={onClose} className="px-4 py-2 text-gray-400 hover:text-white text-sm transition-colors">
                        Cancel
                    </button>
                    <button
                        onClick={() => onSave({ url, images, analysis: script, prompt, meta, selectedImages })}
                        className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-bold shadow-lg flex items-center gap-2 transition-colors"
                    >
                        <Save size={16} />
                        Save & Continue
                    </button>
                </div>
            </div>

            {/* Lightbox for full-size image viewing */}
            {lightboxImage && (
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
            )}
        </div>
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
