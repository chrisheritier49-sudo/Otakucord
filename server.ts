import './src/initEnv';
import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import { v2 as cloudinary } from 'cloudinary';

// Initialize Cloudinary
const cloudinaryUrl = process.env.CLOUDINARY_URL || '';
if (cloudinaryUrl) {
  const match = cloudinaryUrl.match(/cloudinary:\/\/([^:]+):([^@]+)@(.+)/);
  if (match) {
    cloudinary.config({
      api_key: match[1],
      api_secret: match[2],
      cloud_name: match[3],
      secure: true
    });
    console.log(`[Cloudinary] Configured successfully. Cloud Name: ${match[3]}`);
  } else {
    console.warn(`[Cloudinary] Failed to parse connection string: ${cloudinaryUrl}`);
  }
}

// Local File Tracker Database for Cloudinary Uploads Expiries
const LOCAL_UPLOADS_FILE = path.join(process.cwd(), 'cloudinary_uploads.json');

interface UploadRecord {
  publicId: string;
  url: string;
  resourceType: 'image' | 'video';
  expiresAt: string;
  deleted: boolean;
}

function readLocalUploads(): UploadRecord[] {
  try {
    if (fs.existsSync(LOCAL_UPLOADS_FILE)) {
      return JSON.parse(fs.readFileSync(LOCAL_UPLOADS_FILE, 'utf-8'));
    }
  } catch (e) {
    console.error("Failed to read local uploads file:", e);
  }
  return [];
}

function saveLocalUpload(record: UploadRecord) {
  try {
    const uploads = readLocalUploads();
    uploads.push(record);
    fs.writeFileSync(LOCAL_UPLOADS_FILE, JSON.stringify(uploads, null, 2));
  } catch (e) {
    console.error("Failed to save local uploads file:", e);
  }
}

function updateLocalUploadDeleted(publicId: string) {
  try {
    const uploads = readLocalUploads();
    const item = uploads.find(u => u.publicId === publicId);
    if (item) {
      item.deleted = true;
      fs.writeFileSync(LOCAL_UPLOADS_FILE, JSON.stringify(uploads, null, 2));
    }
  } catch (e) {
    console.error("Failed to update local uploads file:", e);
  }
}

// Media Cleanup Worker
async function runMediaCleanup() {
  const now = Date.now();
  const uploads = readLocalUploads();
  const expired = uploads.filter(u => !u.deleted && new Date(u.expiresAt).getTime() <= now);

  if (expired.length === 0) return;

  console.log(`[Cloudinary Cleanup] Found ${expired.length} expired assets to remove.`);
  for (const item of expired) {
    try {
      console.log(`[Cloudinary Cleanup] Destroying public_id: ${item.publicId} (${item.resourceType})...`);
      await cloudinary.uploader.destroy(item.publicId, {
        resource_type: item.resourceType
      });
      updateLocalUploadDeleted(item.publicId);
      console.log(`[Cloudinary Cleanup] Successfully deleted ${item.publicId}`);
    } catch (err) {
      console.error(`[Cloudinary Cleanup] Error destroying asset ${item.publicId}:`, err);
    }
  }
}

// Start periodic cleanup (every 1 minute to stay responsive)
setInterval(() => {
  runMediaCleanup().catch(err => console.error("Error in runMediaCleanup interval:", err));
}, 60 * 1000);

// Also run immediately on server start after a slight delay
setTimeout(() => {
  runMediaCleanup().catch(err => console.error("Error in runMediaCleanup startup:", err));
}, 5000);

async function startServer() {
  const app = express();
  
  // Set json limits to allow media file base64 uploads
  app.use(express.json({ limit: '100mb' }));
  app.use(express.urlencoded({ limit: '100mb', extended: true }));

  const PORT = 3000;

  // Initialize Gemini Client
  const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });

  // API endpoint for Cloudinary upload
  app.post('/api/cloudinary/upload', async (req, res) => {
    try {
      const { file, fileType, customExpirySeconds, noExpiry } = req.body;
      if (!file) {
        return res.status(400).json({ error: 'Le fichier est requis sous forme de base64.' });
      }

      const resourceType = fileType === 'video' ? 'video' : 'image';
      
      console.log(`[Cloudinary] Starting upload of ${resourceType}...`);
      
      const uploadResult = await cloudinary.uploader.upload(file, {
        resource_type: resourceType,
        folder: 'otakucord'
      });

      if (noExpiry) {
        console.log(`[Cloudinary] Upload success (No Expiry). URL: ${uploadResult.secure_url}`);
        return res.json({
          url: uploadResult.secure_url,
          publicId: uploadResult.public_id,
          resourceType
        });
      }

      // Calculate expiry date
      let durationMs = 0;
      if (customExpirySeconds) {
        durationMs = customExpirySeconds * 1000;
      } else if (resourceType === 'video') {
        // Videos delete after 80 hours
        durationMs = 80 * 60 * 60 * 1000;
      } else {
        // Images delete after 1 month (30 days)
        durationMs = 30 * 24 * 60 * 60 * 1000;
      }

      const expiresAtDate = new Date(Date.now() + durationMs);
      const expiresAt = expiresAtDate.toISOString();

      // Save to local tracking db
      const uploadRecord: UploadRecord = {
        publicId: uploadResult.public_id,
        url: uploadResult.secure_url,
        resourceType,
        expiresAt,
        deleted: false
      };
      saveLocalUpload(uploadRecord);

      console.log(`[Cloudinary] Upload success. URL: ${uploadResult.secure_url}. Expiry: ${expiresAt}`);

      res.json({
        url: uploadResult.secure_url,
        publicId: uploadResult.public_id,
        expiresAt,
        resourceType
      });
    } catch (err: any) {
      console.error('[Cloudinary] Upload Error:', err);
      res.status(500).json({ error: err.message || 'La connexion à Cloudinary a échoué.' });
    }
  });

  // API endpoint for chatbot
  app.post('/api/gemini/chat', async (req, res) => {
    try {
      const { message, systemInstruction, history } = req.body;
      
      if (!message) {
        return res.status(400).json({ error: 'Message is required' });
      }

      // Convert history format if any
      const contents = [];
      if (history && Array.isArray(history)) {
        for (const h of history) {
          contents.push({
            role: h.role, // 'user' or 'model'
            parts: [{ text: h.text }]
          });
        }
      }
      
      // Add the current message
      contents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: contents,
        config: {
          systemInstruction: systemInstruction || 'Tu es Senpai, un assistant expert en animes, mangas et culture japonaise sur Discord.',
          temperature: 0.8,
        }
      });

      const text = response.text || "Désolé, je n'ai pas pu générer de réponse.";
      res.json({ reply: text });
    } catch (error: any) {
      console.error('Gemini API Error:', error);
      res.status(500).json({ error: error.message || 'Internal server error calling Gemini API.' });
    }
  });

  // Quick endpoint for trivia generation
  app.post('/api/gemini/trivia', async (req, res) => {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: 'Génère une question de quizz amusante et intéressante sur les mangas/animes en français. Format de réponse JSON valide: { "question": "texte de la question", "options": ["Option A", "Option B", "Option C", "Option D"], "answer": "Option exacte (doit correspondre textuellement à l\'une des 4 options ci-dessus)", "explanation": "courte explication de la réponse" }',
        config: {
          responseMimeType: 'application/json',
        }
      });
      
      const text = response.text;
      if (text) {
        res.json(JSON.parse(text));
      } else {
        res.status(500).json({ error: 'No text returned from Gemini.' });
      }
    } catch (error: any) {
      console.error('Gemini Trivia Error:', error);
      res.status(500).json({ error: error.message || 'Internal error generating trivia.' });
    }
  });

  // Dynamic Translation endpoint
  app.post('/api/gemini/translate', async (req, res) => {
    try {
      const { text, targetLanguage } = req.body;
      if (!text || !targetLanguage) {
        return res.status(400).json({ error: 'Text and targetLanguage are required' });
      }

      const langMap: Record<string, string> = {
        'en': 'English (convert slang and maintain enthusiasm)',
        'ja': 'Japanese (natural Japanese otaku/anime dialogue styled with romaji or kana/kanji, keep it fun)',
        'es': 'Spanish (natural Spanish anime fan style)',
        'fr': 'French (natural French otaku speech)'
      };

      const langLabel = langMap[targetLanguage] || targetLanguage;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Translate the following Discord chat message into ${langLabel}. Ensure the translation maintains the original message's exact tone, emojis, enthusiasm, and pop-culture/anime references. Preserve username tags like @Senpai or @NarutoBot exactly as they are. DO NOT write any introductory or explanatory text. Return ONLY the translation.

Message to translate: "${text}"`,
        config: {
          temperature: 0.3,
        }
      });

      const translated = response.text?.trim() || text;
      res.json({ translated });
    } catch (error: any) {
      console.error('Gemini Translation Error:', error);
      res.status(500).json({ error: error.message || 'Translation failed.' });
    }
  });

  // Translate a message into all other supported languages
  app.post('/api/gemini/translate-all', async (req, res) => {
    try {
      const { text, sourceLanguage } = req.body;
      if (!text) {
        return res.status(400).json({ error: 'Text is required' });
      }
      
      const sourceLang = sourceLanguage || 'fr';
      const languages = ['en', 'ja', 'es', 'fr'].filter(lang => lang !== sourceLang);

      const prompt = `You are an expert anime and Discord community translator.
Translate the following chat message into these target languages: ${languages.join(', ')}.

Rules:
- Maintain exact tone, emojis, enthusiasm, and pop-culture/anime references.
- Keep user tags like @Senpai or @NarutoBot exactly as they are.
- Output ONLY a standard JSON object mapping each target language code to its translated text. Do not include markdown blocks, explanation or additional commentary.

Message to translate: "${text}"
Format: { "en": "translation in English", "ja": "translation in Japanese", "es": "translation in Spanish" }`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        }
      });

      const textResult = response.text?.trim() || '{}';
      const parsed = JSON.parse(textResult);
      
      // Inject the original text under its own source language key
      parsed[sourceLang] = text;
      
      res.json(parsed);
    } catch (error: any) {
      console.error('Gemini Translate All Error:', error);
      res.status(500).json({ error: error.message || 'Translation failed.' });
    }
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    
    // Express v4 route fallback to index.html
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
});
