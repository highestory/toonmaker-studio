import { useEffect } from 'react';
import { useRouter } from 'next/router';
import { parse } from 'cookie';
import { LayoutDashboard } from 'lucide-react';

export default function LandingPage() {
    const router = useRouter();

    useEffect(() => {
        // Check if already logged in
        const cookies = parse(document.cookie || '');
        if (cookies.google_auth_token) {
            router.push('/dashboard');
        }
    }, [router]);

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1014] text-white p-6">
            <div className="max-w-md w-full bg-[#1a1b26] border border-white/5 rounded-2xl p-8 shadow-2xl text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-lg shadow-blue-500/20">
                    <span className="text-2xl font-bold italic">TJ</span>
                </div>

                <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
                    ToonJigi Studio
                </h1>
                <p className="text-gray-400 mb-8">
                    Professional Webtoon Video Production Tool
                </p>

                <div className="space-y-4">
                    <a
                        href="/api/auth/login"
                        className="flex items-center justify-center gap-3 w-full bg-white text-gray-900 font-bold py-3 px-4 rounded-xl hover:bg-gray-100 transition-colors"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24">
                            <path
                                fill="currentColor"
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                            />
                            <path
                                fill="currentColor"
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                            />
                            <path
                                fill="currentColor"
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                            />
                        </svg>
                        Sign in with Google
                    </a>

                    <p className="text-xs text-gray-500 mt-4">
                        Restricted Access: Only authorized accounts can log in.
                    </p>
                </div>
            </div>
        </div>
    );
}
