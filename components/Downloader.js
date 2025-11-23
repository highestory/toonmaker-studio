import { useState } from 'react';
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

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
            [day.id]: {
                url: '',
                images: [],
                meta: null,
                loading: false,
                status: '',
                analysis: null,
                analyzing: false,
                savingToDrive: false,
                driveLink: null
            }
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

        updateDayState(dayId, { loading: true, status: '스캔 중...', images: [], meta: null, analysis: null, driveLink: null });

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

        updateDayState(dayId, { status: '다운로드 준비 중...' });

        try {
            const zip = new JSZip();
            const folder = zip.folder(folderName);
            let successCount = 0;

            // Download Thumbnail
            if (state.meta && state.meta.thumbnail) {
                try {
                    const thumbRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(state.meta.thumbnail)}`);
                    if (thumbRes.ok) {
                        const thumbBlob = await thumbRes.blob();
                        folder.file('thumbnail.jpg', thumbBlob);
                    }
                } catch (e) {
                    console.error('Thumbnail download failed', e);
                }
            }

            // Download Images
            const totalImages = state.images.length;
            for (let i = 0; i < totalImages; i++) {
                const imgUrl = state.images[i];
                const filename = `webtoon_image_${String(i + 1).padStart(3, '0')}.jpg`;

                updateDayState(dayId, { status: `${i + 1}/${totalImages} 이미지 가져오는 중...` });

                try {
                    // Use proxy to bypass CORS
                    const res = await fetch(`/api/proxy-image?url=${encodeURIComponent(imgUrl)}`);
                    if (!res.ok) throw new Error('Fetch failed');

                    const blob = await res.blob();
                    folder.file(filename, blob);
                    successCount++;
                } catch (e) {
                    console.error(`Failed to download image ${i}`, e);
                }

                // Add a small delay to prevent overwhelming the server/proxy
                await new Promise(r => setTimeout(r, 50));
            }

            updateDayState(dayId, { status: 'ZIP 파일 생성 중...' });
            const content = await zip.generateAsync({ type: 'blob' });

            saveAs(content, `${folderName}.zip`);

            updateDayState(dayId, { status: `완료! (${successCount}장)` });

        } catch (e) {
            console.error('Download error:', e);
            updateDayState(dayId, { status: `오류: ${e.message}` });
        }
    };

    const analyzeEpisode = async (dayId) => {
        const state = dayStates[dayId];
        if (!state.images.length) return;

        updateDayState(dayId, { analyzing: true, status: 'AI 분석 중... (시간이 걸릴 수 있습니다)' });

        try {
            const res = await fetch('/api/analyze', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    imageUrls: state.images,
                    referer: state.url
                })
            });

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            updateDayState(dayId, {
                analysis: data.analysis,
                analyzing: false,
                status: '분석 완료!'
            });
        } catch (e) {
            updateDayState(dayId, {
                analyzing: false,
                status: '분석 실패: ' + e.message
            });
        }
    };

    const saveToDrive = async (dayId) => {
        const state = dayStates[dayId];
        if (!state.analysis) return;

        updateDayState(dayId, { savingToDrive: true, status: '드라이브 저장 중...' });

        try {
            const title = state.meta
                ? `${state.meta.webtoonTitle} ${state.meta.episodeNo}화 분석`
                : `웹툰 분석 ${new Date().toISOString()}`;

            let contentToSave = state.analysis;
            if (state.images && state.images.length > 0) {
                contentToSave += '\n\n' + '='.repeat(20) + '\n';
                contentToSave += '## 🔗 이미지 링크 목록\n';
                contentToSave += state.images.join('\n');
            }

            const res = await fetch('/api/save-to-drive', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    content: contentToSave
                })
            });

            if (res.status === 401) {
                updateDayState(dayId, {
                    savingToDrive: false,
                    status: '로그인 필요',
                    needsLogin: true
                });
                return;
            }

            const data = await res.json();
            if (data.error) throw new Error(data.error);

            updateDayState(dayId, {
                savingToDrive: false,
                driveLink: data.link,
                status: '드라이브 저장 완료!',
                needsLogin: false
            });
        } catch (e) {
            updateDayState(dayId, {
                savingToDrive: false,
                status: '저장 실패: ' + e.message
            });
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

                            {state.analysis && (
                                <div className="bg-black/30 rounded p-3 text-xs text-white/80 whitespace-pre-wrap max-h-40 overflow-y-auto border border-white/5">
                                    <div className="flex justify-between items-center mb-2">
                                        <strong className="text-indigo-400">✨ AI 분석 결과</strong>
                                        {state.driveLink ? (
                                            <a href={state.driveLink} target="_blank" rel="noopener noreferrer" className="text-[10px] text-green-400 hover:underline flex items-center gap-1">
                                                <span>📄 드라이브에서 보기</span>
                                            </a>
                                        ) : state.needsLogin ? (
                                            <a
                                                href="/api/auth/login"
                                                className="text-[10px] bg-blue-600 hover:bg-blue-500 text-white px-2 py-0.5 rounded transition-colors flex items-center gap-1"
                                            >
                                                <span>🔑 구글 로그인</span>
                                            </a>
                                        ) : (
                                            <button
                                                onClick={() => saveToDrive(day.id)}
                                                disabled={state.savingToDrive}
                                                className="text-[10px] bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded transition-colors"
                                            >
                                                {state.savingToDrive ? '저장 중...' : '💾 드라이브 저장'}
                                            </button>
                                        )}
                                    </div>
                                    {state.analysis}
                                </div>
                            )}

                            <div className="flex justify-between items-end mt-auto pt-2">
                                <span className="text-[10px] text-white/40 font-mono truncate max-w-[40%]">
                                    {state.status}
                                </span>
                                <div className="flex gap-2">
                                    {state.images.length > 0 && (
                                        <>
                                            <button
                                                onClick={() => analyzeEpisode(day.id)}
                                                disabled={state.analyzing}
                                                className="text-xs bg-indigo-600/80 hover:bg-indigo-500 text-white px-2 py-1 rounded transition-colors disabled:opacity-50"
                                            >
                                                {state.analyzing ? '분석 중...' : 'AI 분석'}
                                            </button>
                                            <button
                                                onClick={() => downloadDay(day.id)}
                                                className="text-xs bg-white/10 hover:bg-white/20 text-white px-2 py-1 rounded transition-colors"
                                            >
                                                다운로드
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
