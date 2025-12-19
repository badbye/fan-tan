
export enum Suit {
  Hearts = '♥',
  Diamonds = '♦',
  Clubs = '♣',
  Spades = '♠'
}

export type CardValue = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12 | 13;

export interface Card {
  suit: Suit;
  value: CardValue;
  id: string;
}

export interface Player {
  id: string;
  name: string;
  isHuman: boolean;
  hand: Card[];
  aiModel?: string;
  wins?: number; // 用于竞技模式统计
}

export interface TableState {
  [suit: string]: {
    min: number;
    max: number;
    cards: number[];
  };
}

export interface GameLog {
  playerId: string;
  playerName: string;
  action: 'play' | 'skip';
  card?: Card;
  thinking?: string;
}

export interface RoundResult {
  winnerId: string;
  humanRemaining: number;
  aiRemaining: number;
}

export type GameMode = 'human' | 'menu' | 'arena';

export interface ArenaMatch {
  ai1: string;
  ai2: string;
  winner: string;
  log: GameLog[];
}
