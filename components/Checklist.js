import { useState, useEffect } from 'react';

const ROUTINE = {
  '월요일': [
    { id: 'm1', text: '작품 7개 선정 & AI 특집 1개 (출퇴근/취침 전)' },
    { id: 'm2', text: '대본 키워드 초안 작성 (30-60분)' },
  ],
  '화요일': [
    { id: 't1', text: '대본 다듬기 & 오프닝/클로징 추가 (30분)' },
    { id: 't2', text: '오디오 녹음 (조용한 방/차 안)' },
  ],
  '수요일': [
    { id: 'w1', text: 'AI 이미지 생성 & 비디오 변환 (50분)' },
    { id: 'w2', text: '웹툰 캡처 폴더 정리 (10분)' },
  ],
  '목요일': [
    { id: 'th1', text: '영상 편집: 오디오 + 컷 + 이미지 (60분)' },
  ],
  '금요일': [
    { id: 'f1', text: '자동 자막 (Vrew) + BGM (30분)' },
    { id: 'f2', text: '썸네일 제작 (20분)' },
    { id: 'f3', text: '월요일 오후 6시 업로드 예약 (10분)' },
  ]
};

export default function Checklist() {
  const [checked, setChecked] = useState({});

  useEffect(() => {
    const saved = localStorage.getItem('toonChecklist');
    if (saved) setChecked(JSON.parse(saved));
  }, []);

  const toggleCheck = (id) => {
    const newChecked = { ...checked, [id]: !checked[id] };
    setChecked(newChecked);
    localStorage.setItem('toonChecklist', JSON.stringify(newChecked));
  };

  return (
    <div className="glass-panel p-6 rounded-2xl">
      <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-400 to-emerald-600 bg-clip-text text-transparent">
        5일 루틴 체크리스트
      </h2>
      <div className="space-y-6">
        {Object.entries(ROUTINE).map(([day, tasks]) => (
          <div key={day} className="relative pl-4 border-l-2 border-white/10">
            <h3 className="text-lg font-semibold text-white/90 mb-3">{day}</h3>
            <div className="space-y-2">
              {tasks.map(task => (
                <label key={task.id} className="flex items-start gap-3 group cursor-pointer">
                  <div className="relative flex items-center">
                    <input
                      type="checkbox"
                      className="peer sr-only"
                      checked={!!checked[task.id]}
                      onChange={() => toggleCheck(task.id)}
                    />
                    <div className="w-5 h-5 border-2 border-white/30 rounded transition-colors peer-checked:bg-green-500 peer-checked:border-green-500" />
                    <svg className="absolute w-3 h-3 text-white left-1 top-1 opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6L5 9L10 3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <span className={`text-sm text-white/70 transition-all group-hover:text-white/90 ${checked[task.id] ? 'line-through opacity-50' : ''}`}>
                    {task.text}
                  </span>
                </label>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
