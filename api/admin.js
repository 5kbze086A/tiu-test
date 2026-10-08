import students from "./_data/students.js";
import { same } from "./_lib.js";
import * as store from "./_store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Faqat POST" });

  const adminPass = process.env.ADMIN_PASSWORD;
  if (!adminPass) return res.status(503).json({ error: "ADMIN_PASSWORD o‘rnatilmagan (Vercel → Environment Variables)." });

  const { password, action, sid } = req.body || {};
  if (!same(password ?? "", adminPass)) return res.status(401).json({ error: "Parol noto‘g‘ri" });

  const mode = store.mode();

  if (action === "reset") {
    const st = students.find((s) => s.id === sid);
    if (!st) return res.status(404).json({ error: "Talaba topilmadi" });
    const att = await store.get(sid);
    const history = [...(att?.history || [])];
    if (att && (att.status === "done" || att.status === "started")) {
      history.push({
        status: att.status, score: att.score ?? null, total: att.total ?? null,
        grade: att.grade ?? null, reason: att.reason ?? null, at: att.finishedAt || att.startedAt,
      });
    }
    await store.set(sid, { status: "open", history });
    return res.status(200).json({ ok: true });
  }

  // list
  const map = await store.getMany(students.map((s) => s.id));
  const rows = students.map((s) => {
    const a = map[s.id];
    return {
      sid: s.id, name: s.name,
      status: a?.status || "none",
      score: a?.score ?? null, total: a?.total ?? null, grade: a?.grade ?? null,
      reason: a?.reason ?? null, at: a?.finishedAt || a?.startedAt || null,
      history: a?.history || [],
    };
  });
  res.status(200).json({ mode, rows });
}
