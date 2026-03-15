import React, { useState, useEffect } from 'react';
import { Upload, CheckCircle2, Loader2, AlertCircle, Camera, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { loadModels, processImage } from '../lib/ai-engine';

interface UploadZoneProps {
    token: string;
}

const UploadZone: React.FC<UploadZoneProps> = ({ token }) => {
    const [isDragging, setIsDragging] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'loading_models' | 'uploading' | 'success' | 'error'>('idle');
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const init = async () => {
            setUploadStatus('loading_models');
            try {
                await loadModels();
                setUploadStatus('idle');
            } catch (err) {
                console.error('Failed to load models:', err);
                setError('Failed to load AI models. Please check your connection.');
                setUploadStatus('error');
            }
        };
        init();
    }, []);

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = () => {
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            handleFiles(Array.from(files));
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const handleFiles = async (files: File[]) => {
        setUploadStatus('uploading');
        try {
            for (const file of files) {
                if (!file.type.startsWith('image/')) continue;

                // Create image element to process
                const img = new Image();
                img.src = URL.createObjectURL(file);
                await new Promise((resolve) => {
                    img.onload = resolve;
                });

                const detections = await processImage(img);
                const descriptors = detections.map(d => Array.from(d.descriptor));

                if (descriptors.length > 0) {
                    // Send to backend
                    await fetch('http://localhost:8000/upload', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            filename: file.name,
                            embeddings: descriptors
                        }),
                    });
                }

                URL.revokeObjectURL(img.src);
            }
            setUploadStatus('success');
            // Trigger graph refresh (this will be handled by the GraphView)
            setTimeout(() => setUploadStatus('idle'), 3000);
        } catch (err) {
            console.error('Error processing images:', err);
            setError('Error analyzing photos. Try again.');
            setUploadStatus('error');
        }
    };

    return (
        <div className="w-full">
            <input
                type="file"
                id="file-upload"
                multiple
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
            />
            <motion.label
                htmlFor="file-upload"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`
          relative w-full h-80 border-2 border-dashed rounded-[3rem] transition-all duration-500
          flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-white
          ${isDragging ? 'border-primary bg-[#F0FDFA] scale-[1.03] rotate-1' : 'border-[#A0E7E5] hover:border-sky hover:bg-[#F0FDFA]'}
          ${uploadStatus !== 'idle' ? 'pointer-events-none' : ''}
        `}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
            >
                {/* Decorative particles for dragging */}
                {isDragging && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 pointer-events-none"
                    >
                        <div className="absolute top-4 left-4 w-4 h-4 rounded-full bg-primary/30 animate-pulse" />
                        <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-secondary/30 animate-pulse delay-75" />
                        <div className="absolute top-1/2 left-10 w-3 h-3 rounded-full bg-accent/30 animate-pulse delay-150" />
                    </motion.div>
                )}

                <AnimatePresence mode="wait">
                    {uploadStatus === 'idle' && (
                        <motion.div
                            key="idle"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.1 }}
                            className="text-center p-8"
                        >
                            <motion.div
                                animate={{ y: [0, -10, 0] }}
                                transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
                                className="w-24 h-24 bg-gradient-to-br from-mint to-sky rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(110,231,183,0.3)] border border-white/50"
                            >
                                <Upload className="text-white w-10 h-10" />
                            </motion.div>
                            <h4 className="text-2xl font-black text-[#1F2937] tracking-tight">Feed the Graph!</h4>
                            <p className="text-slate-500 font-medium mt-2">Drag some cute photos here</p>
                            <div className="mt-6 flex gap-2 justify-center">
                                <div className="w-2 h-2 rounded-full bg-primary/60" />
                                <div className="w-2 h-2 rounded-full bg-secondary/60" />
                                <div className="w-2 h-2 rounded-full bg-accent/60" />
                            </div>
                        </motion.div>
                    )}

                    {uploadStatus === 'loading_models' && (
                        <motion.div
                            key="models"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <div className="relative w-20 h-20 mx-auto mb-6">
                                <Loader2 className="w-20 h-20 text-primary animate-spin absolute inset-0" />
                                <Sparkles className="w-8 h-8 text-secondary absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-pulse" />
                            </div>
                            <p className="text-xl font-bold text-[#1F2937]">Waking up the AI...</p>
                            <p className="text-slate-500 text-sm mt-1 font-medium italic">Loading face detection spells</p>
                        </motion.div>
                    )}

                    {uploadStatus === 'uploading' && (
                        <motion.div
                            key="uploading"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="text-center"
                        >
                            <motion.div
                                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                                transition={{ repeat: Infinity, duration: 2 }}
                                className="w-20 h-20 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-primary/30 border-t-primary"
                            >
                                <Camera className="text-primary w-8 h-8" />
                            </motion.div>
                            <p className="text-xl font-bold text-[#1F2937]">Finding Faces...</p>
                            <p className="text-slate-500 text-sm mt-1 px-8">Our tiny AI bots are mapping social connections</p>
                        </motion.div>
                    )}

                    {uploadStatus === 'success' && (
                        <motion.div
                            key="success"
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 1.5 }}
                            className="text-center"
                        >
                            <motion.div
                                initial={{ rotate: -20 }}
                                animate={{ rotate: 0 }}
                                className="w-24 h-24 bg-accent/20 rounded-[2.5rem] flex items-center justify-center mx-auto mb-6 border-2 border-accent/30 shadow-2xl shadow-accent/20"
                            >
                                <CheckCircle2 className="text-accent w-12 h-12" />
                            </motion.div>
                            <p className="text-2xl font-black text-[#1F2937] tracking-tight">Yay! Map Updated!</p>
                            <p className="text-mint font-bold text-sm mt-2">New relations have been sparked ✨</p>
                        </motion.div>
                    )}

                    {uploadStatus === 'error' && (
                        <motion.div
                            key="error"
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="text-center p-8"
                        >
                            <AlertCircle className="w-16 h-16 text-secondary mx-auto mb-4 animate-bounce" />
                            <p className="text-xl font-bold text-white uppercase tracking-widest">Oh no!</p>
                            <p className="text-secondary/80 text-sm mt-2 font-medium">{error}</p>
                            <button className="mt-6 px-6 py-2 bg-white/5 border border-white/10 rounded-full text-xs font-bold hover:bg-white/10 transition-colors">
                                Try again?
                            </button>
                        </motion.div>
                    )}
                </AnimatePresence>
            </motion.label>
        </div>
    );
};

export default UploadZone;

