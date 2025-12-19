
import { Suit } from './types';

export const SUITS_ORDER = [Suit.Hearts, Suit.Clubs, Suit.Diamonds, Suit.Spades];

export const AI_MODELS = [
  { id: 'gemini-3-flash-preview', name: 'Gemini 3 Flash' },
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro' }
];

export const CARD_VALUE_MAP: { [key: number]: string } = {
  1: 'A',
  11: 'J',
  12: 'Q',
  13: 'K'
};

export const getCardDisplay = (val: number) => CARD_VALUE_MAP[val] || val.toString();
