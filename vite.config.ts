import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { GoogleGenAI } from '@google/genai';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MODEL = 'gemini-3.1-flash-lite-image';
const FALLBACK_URL =
  '/assets/images/blueprint_3d_isometric_1791610246387.jpg';

async function generateBlueprint(apiKey: string, prompt: string) {
  const ai = new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

  const response = await ai.models.generateContent({
    model: MODEL,
    contents: prompt,
    config: {
      imageConfig: {
        aspectRatio: '16:9',
      },
    },
  });

  const parts =
    response.candidates?.flatMap(
      (candidate) => candidate.content?.parts || []
    ) || [];

  const generatedImage = parts.find(
    (part) => part.inlineData?.data
  )?.inlineData;

  if (!generatedImage?.data) {
    throw new Error('The model returned no image data.');
  }

  return {
    success: true,
    imageBase64: generatedImage.data,
    mimeType: generatedImage.mimeType || 'image/png',
    model: MODEL,
    prompt,
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  // Server-side key only. Do not expose it through VITE_* variables.
  const apiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'blueprint-api-middleware',

        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const requestPath = req.url?.split('?')[0];

            if (requestPath !== '/api/generate-blueprint') {
              return next();
            }

            if (req.method !== 'POST') {
              res.setHeader('Allow', 'POST');
              res.statusCode = 405;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: 'Method not allowed',
              }));
              return;
            }

            let bodyStr = '';

            try {
              for await (const chunk of req) {
                bodyStr += chunk.toString();

                if (Buffer.byteLength(bodyStr, 'utf8') > 20000) {
                  res.statusCode = 413;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({
                    success: false,
                    error: 'Request body is too large.',
                  }));
                  return;
                }
              }

              const body = JSON.parse(bodyStr || '{}');
              const prompt = body?.prompt;

              if (
                prompt !== undefined &&
                (typeof prompt !== 'string' || prompt.length > 10000)
              ) {
                res.statusCode = 400;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: 'Prompt must be a string of at most 10000 characters.',
                }));
                return;
              }

              if (!apiKey) {
                console.error('GEMINI_API_KEY is not configured.');
                res.statusCode = 500;
                res.setHeader('Content-Type', 'application/json');
                res.end(JSON.stringify({
                  success: false,
                  error: 'Image generation is not configured.',
                  fallbackUrl: FALLBACK_URL,
                }));
                return;
              }

              const targetPrompt =
                prompt?.trim() ||
                'Create a detailed 3D isometric enterprise cloud architecture blueprint. Use a professional enterprise architecture diagram style, clearly organized components, precise network connections, readable labels, and a 16:9 landscape composition.';

              const result = await generateBlueprint(apiKey, targetPrompt);

              res.statusCode = 200;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify(result));
            } catch (err: any) {
              console.error('Local blueprint generation failed:', {
                message: err?.message,
                status: err?.status,
              });

              if (res.writableEnded) return;

              const status = err instanceof SyntaxError ? 400 : 502;
              res.statusCode = status;
              res.setHeader('Content-Type', 'application/json');
              res.end(JSON.stringify({
                success: false,
                error: status === 400
                  ? 'Invalid JSON request body.'
                  : 'Blueprint generation failed. Please try again.',
                fallbackUrl: FALLBACK_URL,
              }));
            }
          });
        },
      },
    ],

    resolve: {
      alias: {
        '@': __dirname,
      },
    },

    server: {
      host: '0.0.0.0',
      port: 3000,
      // Keep your existing setting if your development environment requires it.
      allowedHosts: true,
      hmr: process.env.DISABLE_HMR !== 'true',
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
