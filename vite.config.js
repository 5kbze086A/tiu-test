import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

// Mahalliy ishlatish uchun: `npm run dev` /api/login va /api/submit ni ham ishga tushiradi.
// (Vercel'da bu qism ishlatilmaydi, u yerda /api papka serverless funksiya bo'ladi.)
function apiDev() {
  return {
    name: "api-dev",
    configureServer(server) {
      if (!process.env.ADMIN_PASSWORD) {
        process.env.ADMIN_PASSWORD = "admin";
        console.log("[admin] ADMIN_PASSWORD berilmagan: mahalliy admin paroli = admin  (http://localhost:5173/admin)");
      }
      server.middlewares.use(async (req, res, next) => {
        const path = (req.url || "").split("?")[0];
        const m = path.match(/^\/api\/(login|submit|admin)$/);
        if (!m) return next();
        let raw = "";
        for await (const chunk of req) raw += chunk;
        res.status = (c) => { res.statusCode = c; return res; };
        res.json = (o) => { res.setHeader("Content-Type", "application/json"); res.end(JSON.stringify(o)); };
        try {
          req.body = raw ? JSON.parse(raw) : {};
          const mod = await server.ssrLoadModule(`/api/${m[1]}.js`);
          await mod.default(req, res);
        } catch (e) {
          console.error(e);
          res.status(500).json({ error: "Server xatosi" });
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  // .env.local dagi qiymatlarni API funksiyalari uchun ham yuklaymiz
  const env = loadEnv(mode, process.cwd(), "");
  for (const [k, v] of Object.entries(env)) if (process.env[k] === undefined) process.env[k] = v;
  return { plugins: [react(), apiDev()] };
});
