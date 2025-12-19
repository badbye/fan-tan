
import { GoogleGenAI, Type } from "@google/genai";
import { Card, TableState, Suit } from "../types";

export interface AIResponse {
  chosenCardId?: string;
  thinking: string;
}

export const getAIDecision = async (
  modelId: string,
  playerName: string,
  hand: Card[],
  validCards: Card[],
  tableState: TableState,
  history: any[]
): Promise<AIResponse> => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const systemInstruction = `
    You are a strategic player of the card game "Bamboo Stick" (接竹竿/排七).
    
    CRITICAL GAME GOAL: 
    The game ends IMMEDIATELY when any player clears their hand. 
    If you have cards remaining when the opponent finishes, YOU LOSE. 

    UPDATED RULES:
    1. HEART 7 STARTS: The player with the Heart 7 begins.
    2. THE FIRST MOVE: Must be a 7.
    3. VALID MOVES: 
       (a) Any card that is adjacent (N-1 or N+1) to an existing sequence on the table of the same suit.
       (b) Any 7 of a suit not yet on the table.

    STRATEGIC DIRECTIVES:
    1. SEVENS AS KEYS: Playing a 7 opens up your other cards in that suit. Blocking a 7 prevents your opponent from playing that suit.
    2. PRIORITIZE ENDPOINTS: Cards like Ace (1) and King (13) are terminal points. Play them early if valid to avoid getting stuck.
    3. CALCULATE PATHS: If you have 6 and 8 of a suit, playing the 7 is vital.
    
    Current Table State: ${JSON.stringify(tableState)}
    Your Hand: ${hand.map(c => `${c.suit}${c.value}`).join(', ')}
    Valid Options: ${validCards.map(c => `[ID: ${c.id}] ${c.suit}${c.value}`).join(', ')}
    
    Response must be in JSON format with two fields:
    1. "chosenCardId": The ID of the card you decide to play.
    2. "thinking": A short explanation of your strategy (e.g., "Playing the 7 of Clubs to open the line for my 8 and 9").
  `;

  try {
    const response = await ai.models.generateContent({
      model: modelId,
      contents: `Player ${playerName}, make your choice. Priority: Clear endpoints (A/K) and manage your Sevens strategically!`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            chosenCardId: { type: Type.STRING },
            thinking: { type: Type.STRING }
          },
          required: ["chosenCardId", "thinking"]
        }
      }
    });

    const result = JSON.parse(response.text || '{}') as AIResponse;
    return result;
  } catch (error) {
    console.error("Gemini AI Error:", error);
    return {
      chosenCardId: validCards[0]?.id,
      thinking: "Thinking system offline. Playing a valid card."
    };
  }
};
