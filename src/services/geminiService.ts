import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ExtractedFinancialData {
  type: "INCOMING" | "OUTGOING";
  amount: number;
  vatAmount: number;
  vatRate: number;
  date: string;
  category: string;
  description: string;
  currency: string;
  counterpartName: string;
}

export async function extractFinancialDataFromText(text: string): Promise<ExtractedFinancialData> {
  const response = await ai.models.generateContent({
    model: "gemini-3.1-flash-preview",
    contents: `Analizează următorul text dintr-un document financiar (factură, chitanță, etc.) extras dintr-o firmă din România. 
    Extrage datele financiare relevante. 
    Dacă documentul este o factură primită (de plată), tipul este OUTGOING. Dacă este o factură emisă (de încasat), tipul este INCOMING.
    Valuta implicită este RON dacă nu se specifică altfel.
    Dacă nu găsești o dată exactă, propune data de azi: ${new Date().toISOString().split('T')[0]}.
    
    TEXT DOCUMENT:
    ${text}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          type: { type: Type.STRING, enum: ["INCOMING", "OUTGOING"] },
          amount: { type: Type.NUMBER, description: "Suma totală (inclusiv TVA dacă există)" },
          vatAmount: { type: Type.NUMBER, description: "Valoarea TVA" },
          vatRate: { type: Type.NUMBER, description: "Cota TVA (ex: 0.19, 0.09)" },
          date: { type: Type.STRING, description: "Data documentului în format YYYY-MM-DD" },
          category: { type: Type.STRING, description: "Categorie (ex: Utilități, Salarii, Vânzări, etc.)" },
          description: { type: Type.STRING, description: "Descriere scurtă" },
          currency: { type: Type.STRING, description: "Valuta (RON, EUR, USD)" },
          counterpartName: { type: Type.STRING, description: "Numele furnizorului sau clientului" }
        },
        required: ["type", "amount", "date", "category", "description"]
      }
    }
  });

  return JSON.parse(response.text.trim());
}
