import React, { useState, useEffect } from 'react';
import GraphView from './components/GraphView';
import UploadZone from './components/UploadZone';
import LandingPage from './components/LandingPage';
import { motion } from 'framer-motion';
import { Camera, Users, Calendar, Sparkles, Heart, LogOut } from 'lucide-react';

const App: React.FC = () => {
  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));
  const [username, setUsername] = useState<string | null>(localStorage.getItem('username'));

  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');

    if (username) localStorage.setItem('username', username);
    else localStorage.removeItem('username');
  }, [token, username]);

  const handleLogin = (newToken: string, newUsername: string) => {
    setToken(newToken);
    setUsername(newUsername);
  };

  const handleLogout = () => {
    setToken(null);
    setUsername(null);
  };

  if (!token) {
    return <LandingPage onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-transparent text-[#1F2937] overflow-hidden relative">
      <div className="relative z-10 p-6 lg:p-12 max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-12 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div className="space-y-2">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="flex items-center gap-2 text-primary font-bold tracking-widest text-xs uppercase"
            >
              <Sparkles size={14} className="animate-pulse" />
              Intelligence With Heart
            </motion.div>
            <motion.h1
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-6xl font-black tracking-tighter logo-3d"
            >
              <span className="gradient-text-alt">Event</span><span className="gradient-text">Graph</span>
            </motion.h1>
            <p className="text-slate-500 font-medium max-w-md">
              Mapping the beautiful connections between you and your favorite people.
            </p>
          </div>

          <div className="flex flex-wrap gap-4 items-center">
            <StatsBadge icon={<Users size={18} />} label="42 Friends" />
            <StatsBadge icon={<Camera size={18} />} label="128 Moments" />
            <StatsBadge icon={<Calendar size={18} />} label="12 Events" />
            <div className="w-px h-8 bg-slate-200 mx-2 hidden md:block"></div>
            <div className="flex items-center gap-4 ml-2">
              <span className="font-bold text-sm bg-gradient-to-r from-mint to-sky text-transparent bg-clip-text">
                @{username}
              </span>
              <button
                onClick={handleLogout}
                className="p-2 rounded-full hover:bg-peach/10 text-slate-400 hover:text-peach transition-colors"
                title="Sign Out"
              >
                <LogOut size={20} />
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Side Content */}
          <div className="lg:col-span-4 space-y-8 order-2 lg:order-1">
            <section className="glass p-8 rounded-[2.5rem] relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Heart size={80} className="text-secondary" />
              </div>
              <h3 className="text-2xl font-bold mb-6 flex items-center gap-3">
                <div className="p-2 rounded-2xl bg-primary/20 text-primary">
                  <Camera size={24} />
                </div>
                New Memories
              </h3>
              <UploadZone token={token} />
              <p className="text-slate-400 text-sm mt-6 leading-relaxed font-medium text-center">
                Drop your photos here and let's find the magic connections! ✨
              </p>
            </section>

            <section className="glass p-8 rounded-[2.5rem]">
              <h3 className="text-2xl font-bold mb-6">Recent Sparks</h3>
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <motion.div
                    key={i}
                    whileHover={{ scale: 1.02, x: 5 }}
                    className="flex gap-4 items-center p-4 rounded-3xl bg-white/5 border border-white/5 cursor-pointer glass-hover transition-all"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/40 to-secondary/40 flex-shrink-0 flex items-center justify-center border border-white/10">
                      <Users size={20} className="text-white" />
                    </div>
                    <div>
                      <p className="font-bold text-sm text-slate-800">New Duo Detected</p>
                      <p className="text-xs text-slate-400">Analysis complete for Photo #{i + 120}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </section>
          </div>

          {/* Visualization Area */}
          <div className="lg:col-span-8 order-1 lg:order-2">
            <GraphView token={token} />
          </div>

        </main>

        <footer className="mt-20 pt-8 border-t border-slate-200 flex justify-between items-center text-slate-400 text-xs font-medium">
          <p>© 2026 EventGraph. Designed for Sukeerthi.</p>
          <div className="flex gap-4">
            <span>Privacy</span>
            <span>Terms</span>
            <span className="text-peach">❤</span>
          </div>
        </footer>
      </div>
    </div>
  );
};

const StatsBadge: React.FC<{ icon: React.ReactNode; label: string }> = ({ icon, label }) => (
  <motion.div
    whileHover={{ y: -5 }}
    className="flex items-center gap-3 glass px-6 py-3 rounded-full cursor-pointer glass-hover transition-all border border-white/5 shadow-lg group"
  >
    <div className="text-primary group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <span className="text-sm font-bold tracking-tight">{label}</span>
  </motion.div>
);

export default App;
