
import React from 'react';
import { Suit } from '../types';
import CardUI from './CardUI';

interface CardPileProps {
  suit: Suit;
  cards: number[];
}

const CardPile: React.FC<CardPileProps> = ({ suit, cards }) => {
  const isRed = suit === Suit.Hearts || suit === Suit.Diamonds;

  // 将牌分为三部分：小于7的，7，大于7的
  const lowCards = cards.filter(v => v < 7).sort((a, b) => b - a); // 6, 5, 4... 递减排列
  const hasSeven = cards.includes(7);
  const highCards = cards.filter(v => v > 7).sort((a, b) => a - b); // 8, 9, 10... 递增排列

  const minVal = cards.length > 0 ? Math.min(...cards) : null;
  const maxVal = cards.length > 0 ? Math.max(...cards) : null;

  // 减小重叠度以确保可见性 (从 -60px 减小到 -50px，因为 md 卡牌高度是 96px)
  const OVERLAP = '-55px';

  return (
    <div className="flex flex-col items-center group select-none min-h-[500px] justify-center">
      {/* 花色标题 */}
      <div className={`text-2xl font-black mb-4 transition-transform group-hover:scale-110 ${isRed ? 'text-red-500' : 'text-slate-400'}`}>
        {suit}
      </div>

      <div className="relative flex flex-col items-center min-w-[100px]">
        {/* 上部分：A -> 6 */}
        <div className="flex flex-col-reverse items-center">
          {lowCards.map((val) => (
            <div 
              key={val} 
              className={`transition-all duration-300 relative ${val === minVal ? 'z-40' : 'z-10'}`}
              style={{ marginBottom: OVERLAP }}
            >
              <div className={`transition-all ${val === minVal ? 'ring-4 ring-emerald-400 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.5)] scale-110' : ''}`}>
                <CardUI card={{ suit, value: val as any, id: `${suit}-${val}` }} size="md" />
                {val === minVal && (
                  <div className="absolute -left-12 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black shadow-lg">MIN</div>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* 中间：7 */}
        {hasSeven ? (
          <div className="z-20 my-2">
            <div className="ring-2 ring-yellow-400 rounded-lg shadow-[0_0_20px_rgba(250,204,21,0.4)] scale-110">
              <CardUI card={{ suit, value: 7 as any, id: `${suit}-7` }} size="md" />
            </div>
          </div>
        ) : (
          <div className="w-16 h-24 border-2 border-dashed border-white/10 rounded-xl flex items-center justify-center text-white/10 text-3xl font-black my-2 bg-white/5">
            7
          </div>
        )}

        {/* 下部分：8 -> K */}
        <div className="flex flex-col items-center">
          {highCards.map((val) => (
            <div 
              key={val} 
              className={`transition-all duration-300 relative ${val === maxVal ? 'z-40' : 'z-10'}`}
              style={{ marginTop: OVERLAP }}
            >
              <div className={`transition-all ${val === maxVal ? 'ring-4 ring-emerald-400 rounded-lg shadow-[0_0_15px_rgba(52,211,153,0.5)] scale-110' : ''}`}>
                <CardUI card={{ suit, value: val as any, id: `${suit}-${val}` }} size="md" />
                {val === maxVal && (
                  <div className="absolute -right-12 top-1/2 -translate-y-1/2 bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded font-black shadow-lg">MAX</div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CardPile;
