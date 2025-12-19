
import { Card, Suit, CardValue, TableState } from '../types';
import { SUITS_ORDER } from '../constants';

export const createDeck = (n: number): Card[] => {
  const deck: Card[] = [];
  // Rule: If n=1, all 13 cards are Hearts. If n > 1, use n suits.
  const suitsToUse = n === 1 ? [Suit.Hearts] : SUITS_ORDER.slice(0, n);
  
  suitsToUse.forEach(suit => {
    for (let v = 1; v <= 13; v++) {
      deck.push({
        suit,
        value: v as CardValue,
        id: `${suit}-${v}`
      });
    }
  });
  return deck;
};

export const shuffle = <T,>(array: T[]): T[] => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export const findValidMoves = (hand: Card[], table: TableState, isFirstMove: boolean): Card[] => {
  // Rule 2: 首次只能先出 7
  if (isFirstMove) {
    return hand.filter(c => c.value === 7);
  }

  return hand.filter(card => {
    const suitStr = card.suit as string;
    const suitState = table[suitStr];
    
    // Rule 3(2): 出其他花色的 7 (开启新行)
    if (card.value === 7) return true;
    
    // Rule 3(1): 在已有的花色的接龙 (序号相邻)
    if (suitState) {
      return card.value === suitState.min - 1 || card.value === suitState.max + 1;
    }
    
    return false;
  });
};

export const updateTable = (table: TableState, card: Card): TableState => {
  const newTable = { ...table };
  const suitStr = card.suit as string;
  if (!newTable[suitStr]) {
    newTable[suitStr] = { min: card.value, max: card.value, cards: [card.value] };
  } else {
    newTable[suitStr] = {
      min: Math.min(newTable[suitStr].min, card.value),
      max: Math.max(newTable[suitStr].max, card.value),
      cards: [...newTable[suitStr].cards, card.value].sort((a, b) => a - b)
    };
  }
  return newTable;
};
