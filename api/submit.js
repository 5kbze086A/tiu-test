import students from "./_data/students.js";
import questions from "./_data/questions.js";
import { CONFIG, gradeOf } from "./_config.js";
import { verify } from "./_lib.js";
import * as store from "./_store.js";

const REASONS = {
  finish: "Talaba testni yakunladi",
  time: "Vaqt tugadi",
  fullscreen: "To‘liq ekrandan chiqdi",
  blur: "Boshqa oynaga o‘tdi",
  hidden: "Boshqa vkladkaga o‘tdi",
  zoom: "Masshtabni o‘zgartirdi",
  keys: "Taqiqlangan tugmalar",
  reload: "Sahifani yangiladi / yopdi",
  devtools: "Dasturchi vositalarini ochdi",
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "Faqat POST" });

  const { token, answers, reason } = req.body || {};
  const data = verify(token);
  if (!data) return res.status(400).json({ error: "Sessiya yaroqsiz" });

  // Urinish holatini tekshirish (baza ulangan bo'lsa)
  const enforce = store.mode() !== "memory";
  const att = enforce ? await store.get(data.sid) : null;
  if (enforce) {
    if (att?.status === "done" && att.startedAt === data.t) {
      return res.status(200).json({ score: att.score, total: att.total, grade: att.grade });
    }
    if (!att || att.status !== "started" || att.startedAt !== data.t) {
      return res.status(409).json({ error: "Sessiya eskirgan yoki test qayta ochilgan. Qaytadan kiring." });
    }
  }

  const byId = new Map(questions.map((q) => [q.id, q]));
  let score = 0;
  for (const qid of data.q) {
    const given = answers && answers[qid];
    if (given && byId.get(qid)?.a === given) score++;
  }
  const total = data.q.length;
  const grade = gradeOf(score);
  const why = REASONS[reason] || REASONS.finish;
  if (enforce) {
    await store.set(data.sid, {
      status: "done", startedAt: data.t, finishedAt: Date.now(),
      score, total, grade, reason: reason || "finish", history: att?.history || [],
    });
  }

  // Ixtiyoriy: natijani Telegramga yuborish (Vercel env: TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID)
  const { TELEGRAM_BOT_TOKEN: bot, TELEGRAM_CHAT_ID: chat } = process.env;
  if (bot && chat) {
    const st = students.find((s) => s.id === data.sid);
    const mins = Math.max(0, Math.round((Date.now() - data.t) / 60000));
    const text = `📝 ${CONFIG.title}\n👤 ${st?.name || data.sid}\n🆔 ${data.sid}\n✅ ${score}/${total} → baho ${grade}\n⏱ ${mins} daqiqa\nℹ️ ${why}`;
    try {
      await fetch(`https://api.telegram.org/bot${bot}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chat, text }),
      });
    } catch {}
  }

  res.status(200).json({ score, total, grade });
}
