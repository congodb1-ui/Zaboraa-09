import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Initialize Google GenAI (Vertex AI Mode)
const ai = new GoogleGenAI({
  vertexai: true,
  project: 'prime-bridge-511404-a3',
  location: 'us-central1'
});

// Initialize Supabase Client
const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function enhanceArchitecturePrompt(userPrompt) {
  const baseStyle = `High-resolution, ultra-detailed enterprise IT cloud architecture schematic diagram on a dark slate background. Precise technical vector style with glowing neon blue, cyan, purple, and green connectivity pathways, labeled network nodes, server racks, cloud boundaries, and flow direction arrows. Highly legible technical labels and crisp typography.`;
  return `${userPrompt}. Style specifications: ${baseStyle}`;
}

app.post('/api/generate-image', async (req, res) => {
  try {
    const { prompt, userId: bodyUserId } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt is required' });
    }

    let userId = null;

    // Check for Bearer token first
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const { data: { user }, error: userError } = await supabase.auth.getUser(token);
      if (user && !userError) {
        userId = user.id;
      }
    }

    // Fallback to body userId or default active session
    if (!userId) {
      userId = bodyUserId || 'congo-architect-session';
    }

    const enhancedPrompt = enhanceArchitecturePrompt(prompt);
    console.log(`[Vertex AI] Generating image for session user: ${userId}...`);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: enhancedPrompt,
      config: {
        responseModalities: ['TEXT', 'IMAGE'],
      },
    });

    const candidate = response.candidates?.[0];
    if (!candidate) {
      throw new Error('No candidate response returned from Vertex AI');
    }

    let base64Image = null;
    for (const part of candidate.content?.parts || []) {
      if (part.inlineData && part.inlineData.mimeType.startsWith('image/')) {
        base64Image = part.inlineData.data;
        break;
      }
    }

    if (!base64Image) {
      throw new Error('Model responded, but no image data was returned.');
    }

    let publicUrl = null;

    // Upload to Supabase Storage & Database
    try {
      const fileName = `${userId}/${Date.now()}.jpg`;
      const fileBuffer = Buffer.from(base64Image, 'base64');
      const uint8Array = new Uint8Array(fileBuffer);

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('generated-images')
        .upload(fileName, uint8Array, {
          contentType: 'image/jpeg',
          upsert: true
        });

      if (uploadError) {
        console.error('❌ [Supabase Storage Error]:', uploadError.message);
      } else {
        const { data: publicURLData } = supabase.storage
          .from('generated-images')
          .getPublicUrl(fileName);
        
        publicUrl = publicURLData.publicUrl;

        const { error: dbError } = await supabase.from('image_generations').insert([
          { user_id: userId, prompt: prompt, image_url: publicUrl }
        ]);

        if (dbError) {
          console.error('❌ [Supabase DB Error]:', dbError.message);
        } else {
          console.log('✅ [Supabase Success] Stored for user:', userId);
        }
      }
    } catch (storageErr) {
      console.error('❌ [Supabase Exception]:', storageErr.message);
    }

    res.json({ image: base64Image, imageUrl: publicUrl });
  } catch (err) {
    console.error('Vertex AI Image generation error:', err);
    res.status(500).json({ error: err.message || 'Failed to generate image via Vertex AI' });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend proxy running on http://localhost:3001 (Resilient Auth Active)`);
});
