import { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenAI, Type } from '@google/genai';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { productName } = req.body;
    if (!productName) {
      return res.status(400).json({ error: 'Product name required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ category: 'Autre', emoji: '📦' });
    }

    const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
    const prompt = `Categorize the following farm/grocery product: "${productName}". 
Provide a short 1-word category (e.g., Fruits, Légumes, Tubercules, Épices, Céréales, Viande, Poisson, Laitier, etc.) and an appropriate single emoji. 
Respond ONLY in JSON format like: {"category": "...", "emoji": "..."}. Do not add markdown blocks.`;

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            category: { type: Type.STRING },
            emoji: { type: Type.STRING },
          },
          required: ['category', 'emoji'],
        },
      },
    });

    const text = response.text;
    if (!text) {
      return res.json({ category: 'Autre', emoji: '📦' });
    }
    
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (err) {
    console.error('Gemini API Error:', err);
    return res.status(500).json({ error: 'Failed to categorize', category: 'Autre', emoji: '📦' });
  }
}
