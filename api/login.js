import students from "./_data/students.js";
import questions from "./_data/questions.js";
import { CONFIG } from "./_config.js";
import { sign, same, shuffle, clean } from "./_lib.js";
import * as store from "./_store.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Faqat POST" });

  const { id, pass } = req.body || {};
  const sid = clean(id);
  const spass = clean(pass);
  const st = students.find((s) => clean(s.id) === sid);
  const ok = same(spass, st ? clean(st.pass) : "x".repeat(9)) && !!st;
  if (!ok) return res.status(401).json({ error: "ID yoki parol noto‘g‘ri" });

  const enforce = store.mode() !== "memory";
  const att = enforce ? await store.get(st.id) : null;

  // Test allaqachon topshirilgan — natijani ko'rsatamiz, yangi test bermaymiz
  if (att?.status === "done") {
    return res.status(200).json({
      done: true, name: st.name, sid: st.id,
      score: att.score, total: att.total, grade: att.grade, reason: att.reason,
    });
  }
  // Boshlangan, lekin tugamagan — faqat o'qituvchi qayta ochishi mumkin
  if (att?.status === "started") {
    return res.status(403).json({
      error: "Bu talaba testni allaqachon boshlagan. Qayta kirish uchun o‘qituvchiga murojaat qiling.",
    });
  }

  const picked = shuffle(questions).slice(0, CONFIG.total);
  const startedAt = Date.now();
  const token = sign({ sid: st.id, q: picked.map((q) => q.id), t: startedAt });
  if (enforce) await store.set(st.id, { status: "started", startedAt, history: att?.history || [] });

  const out = picked.map((q) => ({
    id: q.id,
    q: q.q,
    img: q.img || null,
    o: shuffle(Object.keys(q.o)).map((k) => ({ k, t: q.o[k] })),
  }));

  res.status(200).json({
    token, name: st.name, sid: st.id, startedAt,
    minutes: CONFIG.minutes, total: CONFIG.total,
    title: CONFIG.title, subtitle: CONFIG.subtitle,
    questions: out,
  });
}
