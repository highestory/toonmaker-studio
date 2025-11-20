import Head from 'next/head';
import Checklist from '@/components/Checklist';
import Downloader from '@/components/Downloader';

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-8 font-sans selection:bg-green-500/30">
      <Head>
        <title>ToonMaker - 5-Day Routine</title>
        <meta name="description" content="Naver Webtoon Content Creation Tool" />
      </Head>

      <main className="max-w-7xl mx-auto">
        <header className="mb-12 text-center">
          <h1 className="text-5xl font-extrabold mb-4 bg-gradient-to-r from-green-400 via-emerald-500 to-teal-500 bg-clip-text text-transparent tracking-tight">
            ToonMaker Studio
          </h1>
          <p className="text-white/50 text-lg">
            Weekday 5-Day Completion Strategy for Webtoon Creators
          </p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Checklist (7 cols) */}
          <div className="lg:col-span-7">
            <Checklist />
          </div>

          {/* Right Column: Downloader (5 cols) */}
          <div className="lg:col-span-5">
            <div className="sticky top-8">
              <Downloader />

              {/* Tips Section */}
              <div className="mt-6 glass-panel p-6 rounded-2xl">
                <h3 className="text-lg font-bold mb-3 text-white/90">Pro Tips</h3>
                <ul className="space-y-3 text-sm text-white/60">
                  <li className="flex gap-2">
                    <span className="text-green-400">💡</span>
                    <span>Use commute time for Monday's selection.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">⚡️</span>
                    <span>Thursday is for assembly only. Don't edit assets.</span>
                  </li>
                  <li className="flex gap-2">
                    <span className="text-green-400">👶</span>
                    <span>Family first. If baby wakes up, stop immediately.</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
