import React, { useRef } from 'react';
import ForceGraph2D from 'react-force-graph-2d';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';

interface GraphViewProps {
    token: string;
}

const GraphView: React.FC<GraphViewProps> = ({ token }) => {
    const fgRef = useRef<any>(null);

    const { data: graphData, isLoading } = useQuery({
        queryKey: ['graph'],
        queryFn: async () => {
            const res = await fetch('http://localhost:8000/graph', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!res.ok) throw new Error('Failed to fetch graph');
            return res.json();
        },
        refetchInterval: 5000, // Poll for changes
    });

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full h-[600px] glass rounded-3xl overflow-hidden relative shadow-2xl"
        >
            <div className="absolute top-6 left-6 z-10">
                <h2 className="text-2xl font-bold gradient-text">Relationship Graph</h2>
                <p className="text-zinc-400 text-sm">Interactive visualization of social clusters</p>
            </div>

            {isLoading ? (
                <div className="w-full h-full flex items-center justify-center text-zinc-500">
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                        className="p-4 rounded-full bg-primary/10 border border-primary/20"
                    >
                        <p className="text-sm font-bold tracking-widest uppercase">Connecting Dots...</p>
                    </motion.div>
                </div>
            ) : !graphData || graphData.nodes.length === 0 ? (
                <div className="w-full h-full flex items-center justify-center text-slate-400 p-12 text-center">
                    <div>
                        <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-primary/20">
                            <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 2 }}>🌿</motion.div>
                        </div>
                        <p className="text-xl font-bold text-slate-800 mb-2">The Map is Empty</p>
                        <p className="max-w-xs mx-auto text-sm">Upload photos on the left to start seeing the beautiful connections between people.</p>
                    </div>
                </div>
            ) : (
                <div className="w-full h-full relative">
                    {/* Background Grid Pattern */}
                    <div className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                    <ForceGraph2D
                        ref={fgRef}
                        graphData={graphData}
                        nodeLabel="name"
                        nodeRelSize={7}
                        nodeCanvasObject={(node: any, ctx, globalScale) => {
                            const label = node.name;
                            const fontSize = 12 / globalScale;
                            ctx.font = `${fontSize}px Outfit`;
                            const textWidth = ctx.measureText(label).width;
                            const bckgDimensions: [number, number] = [textWidth, fontSize].map(n => n + fontSize * 0.5) as [number, number];

                            // Candy Colors Palette
                            const candyColors = ['#6EE7B7', '#FFB4A2', '#CDB4DB', '#A0E7E5', '#FFF3B0'];
                            const nodeColor = candyColors[Math.abs(node.id.split('').reduce((a: any, b: any) => (((a << 5) - a) + b.charCodeAt(0)) | 0, 0)) % candyColors.length];

                            // Node Circle with Glow
                            ctx.beginPath();
                            ctx.arc(node.x, node.y, 7, 0, 2 * Math.PI, false);
                            ctx.fillStyle = nodeColor;
                            ctx.shadowColor = nodeColor;
                            ctx.shadowBlur = 15;
                            ctx.fill();
                            ctx.shadowBlur = 0; // reset

                            // Label Background
                            ctx.fillStyle = 'rgba(255, 255, 255, 0.95)';
                            ctx.roundRect(node.x - bckgDimensions[0] / 2, node.y + 12, bckgDimensions[0], bckgDimensions[1], 8);
                            ctx.fill();

                            // Label Text
                            ctx.textAlign = 'center';
                            ctx.textBaseline = 'middle';
                            ctx.fillStyle = '#1F2937';
                            ctx.fillText(label, node.x, node.y + 12 + bckgDimensions[1] / 2);
                        }}
                        linkColor={(link: any) => {
                            // Relationship strength based coloring
                            return link.type === 'TAGGED_IN' ? 'rgba(255, 180, 162, 0.8)' : 'rgba(205, 180, 219, 0.6)';
                        }}
                        linkWidth={(link: any) => (link.type === 'TAGGED_IN' ? 3 : 1.5)}
                        linkDirectionalParticles={2}
                        linkDirectionalParticleSpeed={0.005}
                        linkDirectionalParticleWidth={1.5}
                        backgroundColor="transparent"
                        d3VelocityDecay={0.3}
                    />
                </div>
            )}
        </motion.div>
    );
};

export default GraphView;

