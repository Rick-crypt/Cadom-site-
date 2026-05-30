import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/categorize", async (req, res) => {
    try {
      const { productName } = req.body;
      if (!productName) {
        return res.status(400).json({ error: "Product name required" });
      }

      if (!process.env.GEMINI_API_KEY) {
        // Fallback behavior if no key
        return res.json({ category: "Autre", emoji: "📦" });
      }

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const prompt = `Categorize the following farm/grocery product: "${productName}". 
Provide a short 1-word category (e.g., Fruits, Légumes, Tubercules, Épices, Céréales, Viande, Poisson, Laitier, etc.) and an appropriate single emoji. 
Respond ONLY in JSON format like: {"category": "...", "emoji": "..."}. Do not add markdown blocks.`;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              category: { type: Type.STRING },
              emoji: { type: Type.STRING },
            },
            required: ["category", "emoji"],
          },
        },
      });

      const text = response.text;
      if (!text) {
        return res.json({ category: "Autre", emoji: "📦" });
      }
      
      const parsed = JSON.parse(text);
      res.json(parsed);

    } catch (err) {
      console.error("Gemini API Error:", err);
      res.status(500).json({ error: "Failed to categorize", category: "Autre", emoji: "📦" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
