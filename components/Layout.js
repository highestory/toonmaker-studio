import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import {
    LayoutDashboard,
    FolderOpen,
    Settings,
    HelpCircle,
    Plus,
    Download,
    CheckCircle2,
    AlertCircle,
    Loader2
} from 'lucide-react';

export default function Layout({ children }) {
    const router = useRouter();
    const [apiStatus, setApiStatus] = useState('Connected'); // Mock status
    const [progress, setProgress] = useState(0); // Mock progress

    const navItems = [
        { icon: LayoutDashboard, label: 'Dashboard', path: '/' },
        { icon: FolderOpen, label: 'Projects', path: '/projects' },
        { icon: Settings, label: 'Settings', path: '/settings' },
    ];

    return (
        <div className="flex h-screen bg-[#0f1014] text-white font-sans overflow-hidden">
            {/* Left Sidebar */}
            <aside className="w-64 bg-[#1a1b26] border-r border-white/5 flex flex-col">
                {/* Logo */}
                <div className="p-6 flex items-center gap-3">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center font-bold text-lg italic">
                        TJ
                    </div>
                    <h1 className="text-xl font-bold tracking-tight">ToonJigi Studio</h1>
                </div>

                {/* Navigation */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    {navItems.map((item) => {
                        const isActive = router.pathname === item.path;
                        return (
                            <Link
                                key={item.path}
                                href={item.path}
                                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive
                                        ? 'bg-blue-600/10 text-blue-400'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-white'
                                    }`}
                            >
                                <item.icon size={18} />
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>

                {/* Bottom Actions */}
                <div className="p-4 border-t border-white/5 space-y-2">
                    <button className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-400 hover:text-white transition-colors w-full">
                        <HelpCircle size={18} />
                        Help & Resources
                    </button>
                </div>
            </aside>

            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Top Toolbar (Optional - can be part of page) */}
                {/* Page Content */}
                <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {children}
                </div>

                {/* Status Bar */}
                <div className="h-8 bg-[#13141c] border-t border-white/5 flex items-center px-4 text-xs text-gray-400 justify-between select-none">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${apiStatus === 'Connected' ? 'bg-green-500' : 'bg-red-500'}`} />
                            <span>API Status: <span className="text-gray-300">{apiStatus}</span> (v2.1.4)</span>
                        </div>
                        <div className="h-3 w-px bg-white/10" />
                        <div className="flex items-center gap-2">
                            <span>Puppeteer:</span>
                            <span className="text-gray-300">Idle</span>
                        </div>
                    </div>

                    {progress > 0 && (
                        <div className="flex items-center gap-3 flex-1 max-w-md mx-4">
                            <span className="whitespace-nowrap">Background Task: Rendering Episode 3</span>
                            <div className="h-1.5 flex-1 bg-white/10 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-blue-500 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="w-8 text-right">{progress}%</span>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <span>12:45 remaining</span>
                    </div>
                </div>
            </main>
        </div>
    );
}
