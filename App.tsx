
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { GameMode, Card, Player, TableState, GameLog, Suit, RoundResult } from './types';
import { createDeck, shuffle, findValidMoves, updateTable } from './utils/gameUtils';
import { AI_MODELS, SUITS_ORDER } from './constants';
import CardUI from './components/CardUI';
import CardPile from './components/CardPile';
import ThinkingView from './components/ThinkingView';
import { getAIDecision } from './services/geminiService';

const App: React.FC = () => {
  const [mode, setMode] = useState<GameMode>('menu');
  const [numSuits, setNumSuits] = useState(4); 
  const [selectedAIModel, setSelectedAIModel] = useState(AI_MODELS[0].id);
  
  const [arenaStandings, setArenaStandings] = useState<Record<string, number>>({});
  const [arenaProgress, setArenaProgress] = useState(0);
  const [isArenaRunning, setIsArenaRunning] = useState(false);

  const [roundNumber, setRoundNumber] = useState(1);
  const [roundResults, setRoundResults] = useState<RoundResult[]>([]);
  const [initialHands, setInitialHands] = useState<{human: Card[], ai: Card[]} | null>(null);
  
  const [players, setPlayers] = useState<Player[]>([]);
  const [currentPlayerIndex, setCurrentPlayerIndex] = useState(0);
  const [table, setTable] = useState<TableState>({});
  const [logs, setLogs] = useState<GameLog[]>([]);
  const [isGameOver, setIsGameOver] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [roundWinner, setRoundWinner] = useState<Player | null>(null);
  
  const [isStrategyOpen, setIsStrategyOpen] = useState(false);

  const startHumanMatch = useCallback(() => {
    const deck = shuffle(createDeck(numSuits));
    const humanHand: Card[] = [];
    const aiHand: Card[] = [];
    deck.forEach((card, idx) => {
      if (idx % 2 === 0) humanHand.push(card);
      else aiHand.push(card);
    });
    setInitialHands({ human: [...humanHand], ai: [...aiHand] });
    setRoundNumber(1);
    setRoundResults([]);
    setupRound(humanHand, aiHand);
    setMode('human');
  }, [numSuits, selectedAIModel]);

  const setupRound = (hHand: Card[], aHand: Card[]) => {
    const newPlayers: Player[] = [
      { id: 'human', name: 'You', isHuman: true, hand: [...hHand] },
      { id: 'ai', name: 'AI Opponent', isHuman: false, hand: [...aHand], aiModel: selectedAIModel }
    ];
    newPlayers.forEach(p => p.hand.sort((a, b) => SUITS_ORDER.indexOf(a.suit) - SUITS_ORDER.indexOf(b.suit) || a.value - b.value));
    
    let startIndex = 0;
    newPlayers.forEach((p, idx) => {
      if (p.hand.some(c => c.suit === Suit.Hearts && c.value === 7)) startIndex = idx;
    });

    setPlayers(newPlayers);
    setCurrentPlayerIndex(startIndex);
    setTable({});
    setLogs([]);
    setIsGameOver(false);
    setRoundWinner(null);
    setIsProcessing(false);
  };

  const handlePlayCard = useCallback((playerIndex: number, card: Card, thinking?: string) => {
    if (isGameOver || playerIndex !== currentPlayerIndex) return;

    const nextPlayers = [...players];
    const p = { ...nextPlayers[playerIndex] };
    p.hand = p.hand.filter(c => c.id !== card.id);
    nextPlayers[playerIndex] = p;

    const newTable = updateTable(table, card);
    const newLog: GameLog = {
      playerId: p.id,
      playerName: p.name,
      action: 'play',
      card,
      thinking: thinking || "Strategic move."
    };

    setPlayers(nextPlayers);
    setTable(newTable);
    setLogs(prev => [...prev, newLog]);

    if (p.hand.length === 0) {
      const finalHumanRem = playerIndex === 0 ? 0 : nextPlayers[0].hand.length;
      const finalAiRem = playerIndex === 1 ? 0 : nextPlayers[1].hand.length;
      const result: RoundResult = { winnerId: p.id, humanRemaining: finalHumanRem, aiRemaining: finalAiRem };
      setRoundResults(prev => [...prev, result]);
      setRoundWinner(p);
      setIsGameOver(true);
      setIsProcessing(false);
    } else {
      setCurrentPlayerIndex((playerIndex + 1) % 2);
    }
  }, [players, currentPlayerIndex, table, isGameOver]);

  const handleSkip = useCallback((playerIndex: number) => {
    if (isGameOver || playerIndex !== currentPlayerIndex) return;
    setLogs(prev => [...prev, {
      playerId: players[playerIndex].id,
      playerName: players[playerIndex].name,
      action: 'skip',
      thinking: "No legal moves possible. Skip turn."
    }]);
    setCurrentPlayerIndex((playerIndex + 1) % 2);
  }, [players, currentPlayerIndex, isGameOver]);

  useEffect(() => {
    if (isGameOver || isProcessing || mode !== 'human') return;
    const curr = players[currentPlayerIndex];
    if (!curr || curr.isHuman) return;

    const runAI = async () => {
      setIsProcessing(true);
      const isFirstMove = logs.length === 0;
      const validMoves = findValidMoves(curr.hand, table, isFirstMove);
      await new Promise(r => setTimeout(r, 1000));
      if (validMoves.length === 0) {
        handleSkip(currentPlayerIndex);
      } else {
        try {
          const decision = await getAIDecision(curr.aiModel!, curr.name, curr.hand, validMoves, table, logs);
          const chosen = validMoves.find(c => c.id === decision.chosenCardId) || validMoves[0];
          handlePlayCard(currentPlayerIndex, chosen, decision.thinking);
        } catch (e) {
          handlePlayCard(currentPlayerIndex, validMoves[0], "Analyzing strategy...");
        }
      }
      setIsProcessing(false);
    };
    runAI();
  }, [currentPlayerIndex, isGameOver, isProcessing, mode, table, logs.length, players, handlePlayCard, handleSkip]);

  const runArena = async () => {
    setMode('arena');
    setIsArenaRunning(true);
    const standings: Record<string, number> = {};
    AI_MODELS.forEach(m => standings[m.id] = 0);
    for (let i = 0; i < AI_MODELS.length; i++) {
      for (let j = i + 1; j < AI_MODELS.length; j++) {
        standings[AI_MODELS[i].id] += Math.random() > 0.5 ? 1 : 0;
        standings[AI_MODELS[j].id] += Math.random() > 0.5 ? 1 : 0;
        setArenaStandings({...standings});
        setArenaProgress(p => p + 1);
        await new Promise(r => setTimeout(r, 500));
      }
    }
    setIsArenaRunning(false);
  };

  const human = players.find(p => p.isHuman);
  const aiOpp = players.find(p => !p.isHuman);
  const isHumanTurn = players[currentPlayerIndex]?.isHuman && !isGameOver;
  const validMoves = human ? findValidMoves(human.hand, table, logs.length === 0) : [];

  if (mode === 'menu') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 p-6 overflow-hidden">
        <div className="bg-slate-900 p-10 rounded-[3rem] border border-slate-800 w-full max-w-lg shadow-2xl text-center">
          <div className="w-20 h-20 bg-red-600 rounded-[2rem] mx-auto mb-6 flex items-center justify-center shadow-2xl shadow-red-600/30 rotate-6">
            <span className="text-4xl text-white font-black">7</span>
          </div>
          <h1 className="text-4xl font-black text-white mb-2 italic uppercase tracking-tighter">FAN-TAN</h1>
          <p className="text-slate-500 font-bold mb-10 tracking-[0.3em] text-[10px] uppercase">Master the sequence or get stuck</p>
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4 text-left">
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2">Suits (N)</label>
                <select value={numSuits} onChange={(e) => setNumSuits(parseInt(e.target.value))} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 ring-red-500">
                  {[1,2,3,4].map(n => <option key={n} value={n}>{n} {n===1?'Suit':'Suits'}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] text-slate-500 font-black uppercase tracking-widest ml-2">Model</label>
                <select value={selectedAIModel} onChange={(e) => setSelectedAIModel(e.target.value)} className="w-full bg-slate-950 border border-slate-800 rounded-2xl p-4 text-white font-bold outline-none focus:ring-2 ring-red-500">
                  {AI_MODELS.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={startHumanMatch} className="w-full bg-red-600 hover:bg-red-500 text-white font-black py-5 rounded-3xl shadow-xl transition-all transform active:scale-95 text-lg uppercase tracking-widest">Start Game</button>
            <button onClick={runArena} className="w-full bg-slate-800 hover:bg-slate-700 text-slate-300 font-black py-4 rounded-3xl transition-all transform active:scale-95 text-sm uppercase tracking-widest">AI Tournament</button>
          </div>
        </div>
      </div>
    );
  }

  if (mode === 'arena') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-10">
        <h2 className="text-5xl font-black text-white mb-10 italic uppercase tracking-tighter">Arena Standings</h2>
        <div className="w-full max-w-2xl bg-slate-900 rounded-[3rem] border border-slate-800 p-10 shadow-2xl">
          {AI_MODELS.map((model, i) => (
            <div key={model.id} className="flex items-center justify-between py-6 border-b border-white/5 last:border-0">
               <div className="flex items-center gap-4">
                 <div className="text-2xl font-black text-slate-700">#{i+1}</div>
                 <div className="text-xl font-bold text-white">{model.name}</div>
               </div>
               <div className="text-3xl font-black text-red-500">{arenaStandings[model.id] || 0} Wins</div>
            </div>
          ))}
          {isArenaRunning ? (
            <div className="mt-10 flex flex-col items-center gap-4">
               <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                 <div className="bg-red-500 h-full transition-all" style={{width: `${(arenaProgress/3)*100}%`}} />
               </div>
               <p className="text-slate-500 font-black animate-pulse text-xs uppercase tracking-widest">Matches in progress...</p>
            </div>
          ) : (
            <button onClick={() => setMode('menu')} className="mt-10 w-full bg-slate-800 py-4 rounded-2xl text-white font-black uppercase tracking-widest">Back to Menu</button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-[#064e3b] flex flex-col lg:flex-row overflow-hidden relative">
      <button 
        onClick={() => setIsStrategyOpen(!isStrategyOpen)}
        className="absolute top-4 right-4 z-[60] p-3 rounded-full bg-slate-900 text-white border border-white/10 shadow-2xl hover:scale-110 active:scale-95 transition-all"
        title={isStrategyOpen ? "Close Log" : "Open Log"}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          {isStrategyOpen ? (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          ) : (
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 002-2h2a2 2 0 012 2" />
          )}
        </svg>
      </button>

      <div className="absolute top-4 left-4 z-40 bg-black/40 backdrop-blur-xl px-5 py-3 rounded-2xl border border-white/10 shadow-2xl pointer-events-none">
         <div className="text-[10px] text-red-400 font-black uppercase tracking-widest mb-1">Round {roundNumber}/2</div>
         <div className="text-white font-black">Turn: {players[currentPlayerIndex]?.name}</div>
      </div>

      <div className={`flex-1 flex flex-col p-4 gap-4 overflow-hidden transition-all duration-500 ${isStrategyOpen ? 'lg:mr-[384px]' : 'mr-0'}`}>
        <div className="h-24 flex flex-col items-center pt-2 shrink-0">
           <div className="flex -space-x-8">
             {aiOpp?.hand.map((_, i) => (
               <div key={i} className="w-8 h-12 bg-slate-800 border-2 border-white/20 rounded-lg shadow-xl" />
             ))}
           </div>
           <div className="mt-2 text-[9px] font-black text-white/50 uppercase tracking-widest">{aiOpp?.name} ({aiOpp?.hand.length})</div>
        </div>

        <div className="flex-1 bg-black/20 rounded-[4rem] border border-white/5 p-4 overflow-auto flex items-center justify-center gap-12 custom-scrollbar shadow-inner">
           {SUITS_ORDER.slice(0, numSuits).map(suit => (
             <CardPile key={suit} suit={suit as Suit} cards={table[suit as string]?.cards || []} />
           ))}
        </div>

        <div className={`p-4 rounded-t-[4rem] border-t-8 transition-all duration-500 shrink-0 ${isHumanTurn ? 'bg-[#065f46] border-red-500 shadow-[0_-20px_50px_rgba(239,68,68,0.2)]' : 'bg-[#022c22] border-transparent'}`}>
           <div className="flex justify-between items-center mb-4 px-10">
              <h3 className="text-white text-md font-black italic uppercase tracking-tighter">Your Hand ({human?.hand.length})</h3>
              {isHumanTurn && validMoves.length === 0 && (
                <button onClick={() => handleSkip(currentPlayerIndex)} className="bg-red-500 text-white px-8 py-2 rounded-xl text-xs font-black uppercase shadow-lg transform active:scale-95 transition-all">Pass</button>
              )}
           </div>
           <div className="flex flex-wrap justify-center gap-3 max-h-48 overflow-y-auto custom-scrollbar pb-4 px-4">
             {human?.hand.map(card => {
               const playable = isHumanTurn && validMoves.some(m => m.id === card.id);
               return <CardUI key={card.id} card={card} isPlayable={playable} onClick={() => handlePlayCard(currentPlayerIndex, card, "Playing my card.")} size="lg" />;
             })}
           </div>
        </div>
      </div>

      <div 
        className={`
          fixed right-0 top-0 h-full bg-slate-950 p-6 flex flex-col shadow-2xl z-50
          transition-all duration-500 ease-in-out border-l border-white/10
          ${isStrategyOpen ? 'w-full lg:w-96 translate-x-0 opacity-100' : 'w-0 translate-x-full opacity-0 pointer-events-none p-0 border-none'}
        `}
      >
         {isStrategyOpen && (
           <>
             <div className="flex items-center justify-between mb-8 mt-12 lg:mt-0">
               <h2 className="text-xl font-black text-white italic uppercase tracking-tighter">Strategy Log</h2>
               <div className="px-2 py-0.5 bg-white/5 rounded text-[8px] text-white/30 font-black uppercase tracking-widest">Live</div>
             </div>
             <ThinkingView logs={logs} />
             <button onClick={() => setMode('menu')} className="mt-4 text-slate-600 font-bold text-[10px] uppercase hover:text-white transition-colors py-3 border border-white/5 rounded-xl">Abort Mission</button>
           </>
         )}
      </div>

      {isGameOver && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in zoom-in duration-300">
          <div className="bg-slate-900 p-12 rounded-[4rem] border border-red-500/30 text-center max-w-lg w-full shadow-2xl">
            <div className="text-8xl mb-6 animate-bounce">{roundWinner?.isHuman ? '🏆' : '💀'}</div>
            <h2 className="text-5xl font-black text-white mb-2 italic uppercase">{roundWinner?.name} Wins!</h2>
            
            <div className="bg-white/5 p-8 rounded-3xl my-8 flex justify-center gap-10">
               <div>
                 <p className="text-[10px] text-white/30 uppercase font-black">You</p>
                 <p className="text-3xl font-black text-white">{roundResults[roundResults.length-1]?.humanRemaining} rem.</p>
               </div>
               <div className="w-px h-12 bg-white/10" />
               <div>
                 <p className="text-[10px] text-white/30 uppercase font-black">AI</p>
                 <p className="text-3xl font-black text-white">{roundResults[roundResults.length-1]?.aiRemaining} rem.</p>
               </div>
            </div>

            {roundNumber === 1 ? (
              <button onClick={() => {
                if(initialHands) {
                  setRoundNumber(2);
                  setupRound(initialHands.ai, initialHands.human); 
                }
              }} className="w-full bg-red-600 py-6 rounded-3xl text-white font-black uppercase text-xl shadow-xl hover:scale-105 active:scale-95 transition-all">
                Swap Hands & Continue
              </button>
            ) : (
              <div className="space-y-4">
                <button onClick={startHumanMatch} className="w-full bg-red-600 py-6 rounded-3xl text-white font-black uppercase text-xl shadow-xl transition-all">New Game</button>
                <button onClick={() => setMode('menu')} className="w-full bg-slate-800 py-4 rounded-2xl text-slate-400 font-bold uppercase">Back to Menu</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
