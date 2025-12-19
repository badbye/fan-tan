
import React, { useRef, useEffect } from 'react';
import { GameLog } from '../types';

interface ThinkingViewProps {
  logs: GameLog[];
}

const ThinkingView: React.FC<ThinkingViewProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-[#0f172a] rounded-[2rem] p-5 h-full flex flex-col border border-white/5 shadow-inner">
      <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
        {logs.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-20 grayscale">
            <div className="w-16 h-16 bg-white/5 rounded-full mb-4 animate-pulse flex items-center justify-center">
              <span className="text-2xl">?</span>
            </div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Awaiting Input...</p>
          </div>
        )}
        
        {logs.map((log, idx) => (
          <div key={idx} className={`relative group animate-in slide-in-from-right duration-300`}>
            <div className={`
              rounded-2xl p-4 transition-all border
              ${log.action === 'play' 
                ? 'bg-emerald-500/5 border-emerald-500/10' 
                : 'bg-red-500/5 border-red-500/10'
              }
            `}>
              <div className="flex justify-between items-start mb-2">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${log.action === 'play' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                  <span className="font-black text-slate-200 text-xs uppercase tracking-tight">{log.playerName}</span>
                </div>
                <span className={`text-[8px] px-2 py-0.5 rounded-full font-black tracking-widest ${log.action === 'play' ? 'bg-emerald-900/50 text-emerald-400' : 'bg-red-900/50 text-red-400'}`}>
                  {log.action === 'play' ? 'EXECUTED' : 'SKIPPED'}
                </span>
              </div>

              {log.card && (
                <div className="inline-flex items-center gap-2 bg-white/5 px-2 py-1 rounded-lg border border-white/5 mb-3">
                   <span className={`text-xs font-black ${log.card.suit === '♥' || log.card.suit === '♦' ? 'text-red-400' : 'text-slate-300'}`}>
                      {log.card.suit}{log.card.value}
                   </span>
                   <span className="text-[9px] text-white/20 font-bold uppercase tracking-tighter">Connection Found</span>
                </div>
              )}

              {log.thinking && (
                <div className="relative pl-3 border-l-2 border-white/10">
                  <p className="text-[11px] text-slate-400 italic leading-relaxed font-medium">
                    &ldquo;{log.thinking}&rdquo;
                  </p>
                </div>
              )}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default ThinkingView;
