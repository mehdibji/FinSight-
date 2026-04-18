import { GoogleGenAI } from "@google/genai";
import { Asset, Alert } from '../store/useStore';

const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env || {};
const geminiApiKey = env.VITE_GEMINI_API_KEY || env.GEMINI_API_KEY || "";
const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

export const getGeminiResponse = async (
  prompt: string,
  history: ChatMessage[],
  isEducationalMode: boolean = false,
  assets: Asset[] = [],
  alerts: Alert[] = []
) => {
  if (!ai) {
    return "AI service is not configured yet. Add VITE_GEMINI_API_KEY to your environment.";
  }

  const portfolioContext = `
    User's Current Portfolio:
    Assets: ${JSON.stringify(assets.map(a => ({ symbol: a.symbol, amount: a.amount, type: a.type })))}
    Active Alerts: ${JSON.stringify(alerts.filter(a => a.active).map(a => ({ symbol: a.symbol, targetPrice: a.targetPrice, condition: a.condition })))}
  `;

  const systemInstruction = isEducationalMode
    ? `You are an Educational AI Investment Copilot. Your goal is to explain complex financial concepts, market trends, and investment strategies to beginners and intermediate users. 
       - Avoid technical jargon. If you must use a term, explain it immediately.
       - Use clear, relatable analogies (e.g., comparing a stock market to a grocery store or a portfolio to a garden).
       - Be encouraging and educational.
       - Focus on long-term principles and risk awareness.
       - NEVER provide specific financial advice or guarantee returns.
       - Use the user's portfolio data to provide relevant examples, but do not give direct advice on what to buy or sell.
       ${portfolioContext}`
    : `You are a Senior AI Investment Copilot for FinSight AI. You provide professional, data-driven market analysis and portfolio insights.
       - Be concise, analytical, and objective.
       - Use professional financial terminology correctly.
       - Focus on risk management and market intelligence.
       - NEVER provide specific financial advice or guarantee returns.
       - Analyze the user's portfolio context provided below to give highly relevant insights.
       ${portfolioContext}`;

  const chat = ai.chats.create({
    model: "gemini-flash-latest",
    config: {
      systemInstruction,
      tools: [{ googleSearch: {} }],
      toolConfig: { includeServerSideToolInvocations: true }
    },
  });

  // Replay history
  for (const msg of history) {
    if (msg.role === 'user') {
      await chat.sendMessage({ message: msg.text });
    }
  }

  const response = await chat.sendMessage({ message: prompt });
  return response.text;
};
