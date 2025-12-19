
import React from 'react';
import { Card, Suit } from '../types';
import { getCardDisplay } from '../constants';

interface CardUIProps {
  card: Card;
  onClick?: () => void;
  isPlayable?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  hidden?: boolean;
}

const CardUI: React.FC<CardUIProps> = ({ card, onClick, isPlayable, size = 'md', hidden }) => {
  const isRed = card.suit === Suit.Hearts || card.suit === Suit.Diamonds;
  
  const sizes = {
    xs: 'w-8 h-12 text-[10px]',
    sm: 'w-12 h-18 text-xs',
    md: 'w-16 h-24 text-sm',
    lg: 'w-20 h-28 text-lg'
  };

  if (hidden) {
    return (
      <div className={`${sizes[size]} bg-blue-800 border-2 border-white rounded-lg flex items-center justify-center shadow-xl`}>
        <div className="w-full h-full opacity-30 bg-[radial-gradient(circle,white_1px,transparent_1px)] bg-[length:6px_6px]"></div>
      </div>
    );
  }

  return (
    <div 
      onClick={isPlayable ? onClick : undefined}
      className={`
        ${sizes[size]} 
        bg-white rounded-lg flex flex-col justify-between p-1 cursor-default select-none transition-all shadow-md
        ${isPlayable ? 'ring-4 ring-yellow-400 -translate-y-2 cursor-pointer hover:brightness-110 shadow-yellow-400/50 shadow-lg' : 'opacity-95'}
        ${isRed ? 'text-red-600' : 'text-slate-900'}
      `}
    >
      <div className="flex flex-col items-start leading-none font-black">
        <span>{getCardDisplay(card.value)}</span>
        <span className="scale-75 origin-left">{card.suit}</span>
      </div>
      <div className="flex justify-center items-center text-xl font-bold">
        {card.suit}
      </div>
      <div className="flex flex-col items-end leading-none font-black rotate-180">
        <span>{getCardDisplay(card.value)}</span>
        <span className="scale-75 origin-left">{card.suit}</span>
      </div>
    </div>
  );
};

export default CardUI;
