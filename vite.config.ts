import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import type { Plugin } from 'vite'

function apiDevPlugin(): Plugin {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (!req.url?.startsWith('/api/')) return next();

        const url = new URL(req.url, `http://${req.headers.host || 'localhost:5173'}`);
        const endpoint = url.pathname.replace('/api/', '');
        const filePath = `/api/${endpoint}.ts`;

        try {
          // Parse JSON body if present
          let body: Record<string, unknown> = {};
          if (req.method === 'POST' || req.method === 'PUT') {
            const chunks: Uint8Array[] = [];
            for await (const chunk of req) chunks.push(chunk as Uint8Array);
            const raw = Buffer.concat(chunks).toString('utf-8');
            if (raw) {
              try { body = JSON.parse(raw); } catch { body = {}; }
            }
          }

          // Parse query
          const query: Record<string, string> = {};
          url.searchParams.forEach((v, k) => { query[k] = v; });

          // Load handler through Vite SSR loader
          const mod = await server.ssrLoadModule(filePath);
          const handler = mod.default;

          // Mock Vercel response methods
          const vercelRes = res as typeof res & {
            status: (code: number) => typeof vercelRes;
            json: (data: unknown) => typeof vercelRes;
          };
          vercelRes.status = (code: number) => {
            res.statusCode = code;
            return vercelRes;
          };
          vercelRes.json = (data: unknown) => {
            if (!res.headersSent) {
              res.setHeader('Content-Type', 'application/json');
            }
            res.end(JSON.stringify(data));
            return vercelRes;
          };

          const vercelReq = req as typeof req & {
            query: Record<string, string>;
            body: Record<string, unknown>;
          };
          vercelReq.query = query;
          vercelReq.body = body;

          await handler(vercelReq, vercelRes);
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Internal Server Error';
          console.error(`[API Dev Error] ${req.url}:`, err);
          if (!res.headersSent) {
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: message }));
          }
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (env.DATABASE_URL) {
    process.env.DATABASE_URL = env.DATABASE_URL;
  }

  return {
    plugins: [
      react(),
      tailwindcss(),
      apiDevPlugin(),
    ],
  };
});
