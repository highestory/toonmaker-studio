import { useState } from 'react';

const DAYS = [
    { id: 'mon', label: '월요일' },
    { id: 'tue', label: '화요일' },
    { id: 'wed', label: '수요일' },
    { id: 'thu', label: '목요일' },
    { id: 'fri', label: '금요일' },
    { id: 'sat', label: '토요일' },
    { id: 'sun', label: '일요일' },
];

export default function Downloader() {
    const [dayStates, setDayStates] = useState(
        DAYS.reduce((acc, day) => ({
            ...acc,
            [day.id]: { url: '', images: [], meta: null, loading: false, status: '' }
        }), {})
    );

    const updateDayState = (dayId, updates) => {
        setDayStates(prev => ({
            ...prev,
            [dayId]: { ...prev[dayId], ...updates }
        }));
    };

    const fetchImages = async (dayId) => {
        const state = dayStates[dayId];
        if (!state.url) return;

        updateDayState(dayId, { loading: true, status: '스캔 중...', images: [], meta: null });

        try {
            const res = await fetch('/api/webtoon?url=' + encodeURIComponent(state.url));
            const data = await res.json();

            if (data.error) throw new Error(data.error);

            updateDayState(dayId, {
                images: data.images || [],
                meta: data.meta || null,
                status: `이미지 ${data.images?.length || 0}장 발견`,
                loading: false
            });
        } catch (e) {
            updateDayState(dayId, { status: '에러: ' + e.message, loading: false });
        }
    };

    const downloadImage = async (imgUrl, index, folderName, customFilename, referer) => {
        const filename = customFilename || `webtoon_image_${String(index + 1).padStart(3, '0')}.jpg`;
        const res = await fetch('/api/save-image', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                imageUrl: imgUrl,
                referer,
                filename,
                folderName
            })
        });
        if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || '저장 실패');
        }
        return res.json();
    };

    const downloadDay = async (dayId) => {
        const state = dayStates[dayId];
        if (!state.images.length) return;

        let folderName = '';
        if (state.meta && state.meta.episodeNo && state.meta.webtoonTitle) {
            folderName = `${state.meta.episodeNo} ${state.meta.webtoonTitle}`;
            if (state.meta.episodeTitle) folderName += ` - ${state.meta.episodeTitle}`;
        } else {
            folderName = `webtoon_download_${dayId}_` + Date.now();
        }
        folderName = folderName.replace(/[/\\?%*:|"<>]/g, '-');

        updateDayState(dayId, { status: '다운로드 중...' });
        let successCount = 0;

        try {
            // Download Thumbnail
            if (state.meta && state.meta.thumbnail) {
                await downloadImage(state.meta.thumbnail, -1, folderName, 'thumbnail.jpg', state.url);
            }

            for (let i = 0; i < state.images.length; i++) {
                await downloadImage(state.images[i], i, folderName, null, state.url);
                successCount++;
                if (i % 5 === 0) updateDayState(dayId, { status: `${i + 1}/${state.images.length} 저장 중...` });
                await new Promise(r => setTimeout(r, 100));
            }
            updateDayState(dayId, { status: `완료! (${successCount}장)` });
        } catch (e) {
            updateDayState(dayId, { status: `오류: ${e.message}` });
        }
    };

    const downloadAllWeekly = async () => {
        for (const day of DAYS) {
            if (dayStates[day.id].images.length > 0) {
                await downloadDay(day.id);
            }
        }
    };

    return (
        <div className="glass-panel p-6 rounded-2xl h-full flex flex-col max-h-screen overflow-y-auto">
            <div className="flex justify-between items-center mb-6 sticky top-0 bg-[#1a1b26] z-10 py-2 border-b border-white/10">
                <h2 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-600 bg-clip-text text-transparent">
                    주간 웹툰 다운로더
                </h2>
                <button
                    onClick={downloadAllWeekly}
                    className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded-lg text-sm font-bold transition-colors shadow-lg"
                >
                    전체 다운로드 (준비된 항목)
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2 gap-4 pb-4">
                {DAYS.map(day => {
                    const state = dayStates[day.id];
                    return (
                        <div key={day.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col gap-3 hover:border-white/20 transition-colors">
                            <div className="flex justify-between items-center">
                                <h3 className="font-bold text-white/90">{day.label}</h3>
                                <span className={`text-xs px-2 py-0.5 rounded-full ${state.images.length > 0 ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white/40'}`}>
                                    {state.images.length > 0 ? '준비됨' : '대기'}
                                </span>
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    value={state.url}
                                    onChange={(e) => updateDayState(day.id, { url: e.target.value })}
                                    placeholder="URL 입력..."
                                    className="flex-1 bg-black/20 border border-white/10 rounded px-2 py-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                                />
                                <button
                                    onClick={() => fetchImages(day.id)}
                                    disabled={state.loading || !state.url}
                                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs rounded transition-colors disabled:opacity-50"
                                >
                                    {state.loading ? '...' : '확인'}
                                </button>
                            </div>

                            {state.meta && (
                                <div className="text-xs text-white/70 truncate" title={state.meta.title}>
                                    {state.meta.webtoonTitle} - {state.meta.episodeNo}화
                                </div>
                            )}

                            <div className="flex justify-between items-end mt-auto pt-2">
                                <span className="text-[10px] text-white/40 font-mono truncate max-w-[60%]">
                                    {state.status}
                                </span>
                                {state.images.length > 0 && (
                                    <button
                                        onClick={() => downloadDay(day.id)}
                                        className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                                    >
                                        다운로드
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
