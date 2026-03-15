import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, Loader2 } from 'lucide-react';

interface LandingPageProps {
    onLogin: (token: string, username: string) => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onLogin }) => {
    const [isLoginMode, setIsLoginMode] = useState(true);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError('');

        try {
            if (isLoginMode) {
                // Login Request
                const response = await fetch('http://localhost:8000/token', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: new URLSearchParams({ username, password }),
                });

                if (!response.ok) {
                    throw new Error('Invalid credentials');
                }

                const data = await response.json();
                onLogin(data.access_token, username);
            } else {
                // Register Request
                const response = await fetch('http://localhost:8000/register', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ username, password }),
                });

                if (!response.ok) {
                    const data = await response.json();
                    throw new Error(data.detail || 'Registration failed');
                }

                // Auto login after register
                setIsLoginMode(true);
                setError('Registration successful! Please log in.');
            }
        } catch (err: any) {
            setError(err.message || 'An error occurred. Please try again.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[#FFE5EC] rounded-full filter blur-[100px] opacity-60 animate-float pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-[#D8FFF5] rounded-full filter blur-[100px] opacity-60 animate-float-delayed pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full max-w-md relative z-10"
            >
                <div className="text-center mb-10">
                    <motion.div
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        className="inline-flex items-center justify-center p-3 mb-6 bg-white rounded-3xl shadow-[0_8px_30px_rgba(110,231,183,0.3)] border border-[#F1F5F9]"
                    >
                        <Sparkles className="w-8 h-8 text-[#A0E7E5]" />
                    </motion.div>
                    <h1 className="text-6xl font-black tracking-tighter logo-3d mb-4">
                        <span className="gradient-text-alt">Event</span>
                        <span className="gradient-text">Graph</span>
                    </h1>
                    <p className="text-slate-500 font-medium text-lg px-4">
                        Your private social universe, beautifully mapped.
                    </p>
                </div>

                <div className="glass rounded-[2.5rem] p-8 md:p-10 relative overflow-hidden transition-all duration-300">
                    <h2 className="text-2xl font-bold text-[#1F2937] mb-6 text-center">
                        {isLoginMode ? 'Welcome Back!' : 'Create Your Universe'}
                    </h2>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:border-[#A0E7E5] focus:ring-4 focus:ring-[#F0FDFA] outline-none transition-all placeholder-slate-400 text-slate-800 font-medium"
                                placeholder="Enter your username"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-500 mb-2 ml-1">Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-5 py-4 rounded-2xl bg-white/50 border border-slate-200 focus:border-[#A0E7E5] focus:ring-4 focus:ring-[#F0FDFA] outline-none transition-all placeholder-slate-400 text-slate-800 font-medium"
                                placeholder="••••••••"
                                required
                            />
                        </div>

                        <AnimatePresence>
                            {error && (
                                <motion.p
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className={`text-sm font-medium px-2 ${error.includes('successful') ? 'text-mint' : 'text-peach'}`}
                                >
                                    {error}
                                </motion.p>
                            )}
                        </AnimatePresence>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-4 px-6 rounded-2xl bg-[#1F2937] hover:bg-black text-white font-bold text-lg shadow-xl shadow-slate-200 flex items-center justify-center gap-2 transition-all group disabled:opacity-70 disabled:cursor-not-allowed mt-4"
                        >
                            {isLoading ? (
                                <Loader2 className="w-6 h-6 animate-spin" />
                            ) : (
                                <>
                                    {isLoginMode ? 'Sign In' : 'Sign Up'}
                                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center">
                        <button
                            onClick={() => {
                                setIsLoginMode(!isLoginMode);
                                setError('');
                            }}
                            className="text-slate-500 hover:text-slate-800 font-medium text-sm transition-colors"
                        >
                            {isLoginMode ? "Don't have an account? " : "Already have an account? "}
                            <span className="text-[#6EE7B7] font-bold hover:text-[#A0E7E5]">
                                {isLoginMode ? 'Sign up ✨' : 'Log in ✨'}
                            </span>
                        </button>
                    </div>
                </div>
            </motion.div>
        </div>
    );
};

export default LandingPage;
