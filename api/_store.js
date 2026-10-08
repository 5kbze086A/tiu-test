import fs from "node:fs";
import path from "node:path";

// Urinishlar ombori.
//  - Vercel + Upstash Redis (tavsiya): UPSTASH_REDIS_REST_URL / _TOKEN (yoki KV_REST_API_URL / _TOKEN)
//  - Mahalliy (npm run dev): .data/attempts.json fayli
//  - Vercel'da baza ulanmagan bo'lsa: "memory" — ishonchsiz, bir martalik urinish cheklovi ishlamaydi
const url = () => process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = () => process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

export const mode = () => (url() && token() ? "redis" : process.env.VERCEL ? "memory" : "file");

const mem = new Map();
const file = () => path.join(process.cwd(), ".data", "attempts.json");
const fileRead = () => { try { return JSON.parse(fs.readFileSync(file(), "utf8")); } catch { return {}; } };
const fileWrite = (o) => {
  fs.mkdirSync(path.dirname(file()), { recursive: true });
  fs.writeFileSync(file(), JSON.stringify(o, null, 1));
};

async function redis(cmd) {
  const r = await fetch(url(), {
    method: "POST",
    headers: { Authorization: `Bearer ${token()}`, "Content-Type": "application/json" },
    body: JSON.stringify(cmd),
  });
  const d = await r.json();
  if (d.error) throw new Error(d.error);
  return d.result;
}

const key = (sid) => `quiz:att:${sid}`;
const parse = (s) => { try { return s ? JSON.parse(s) : null; } catch { return null; } };

export async function get(sid) {
  const m = mode();
  if (m === "redis") return parse(await redis(["GET", key(sid)]));
  if (m === "file") return fileRead()[sid] || null;
  return mem.get(sid) || null;
}

export async function set(sid, val) {
  const m = mode();
  if (m === "redis") return void (await redis(["SET", key(sid), JSON.stringify(val)]));
  if (m === "file") { const o = fileRead(); o[sid] = val; return fileWrite(o); }
  mem.set(sid, val);
}

export async function getMany(sids) {
  const m = mode();
  if (m === "redis") {
    const r = await redis(["MGET", ...sids.map(key)]);
    return Object.fromEntries(sids.map((s, i) => [s, parse(r[i])]));
  }
  if (m === "file") { const o = fileRead(); return Object.fromEntries(sids.map((s) => [s, o[s] || null])); }
  return Object.fromEntries(sids.map((s) => [s, mem.get(s) || null]));
}
