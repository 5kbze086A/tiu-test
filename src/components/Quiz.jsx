import { useEffect, useState } from "react";
import { useProctor } from "../hooks/useProctor.js";

const fmt = (ms) => {
  const s = Math.max(0, Math.ceil(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function Quiz({ session, answers, onAnswer, onFinish }) {
  const { questions, endsAt } = session;
  const [idx, setIdx] = useState(0);
  const [confirm, setConfirm] = useState(false);
  const [left, setLeft] = useState(() => Math.max(0, endsAt - Date.now()));

  useProctor(true, onFinish);

  useEffect(() => {
    const t = setInterval(() => {
      const l = endsAt - Date.now();
      setLeft(Math.max(0, l));
      if (l <= 0) onFinish("time");
    }, 500);
    return () => clearInterval(t);
  }, [endsAt, onFinish]);

  const q = questions[idx];
  const answered = questions.filter((x) => answers[x.id]).length;
  const unanswered = questions.length - answered;

  useEffect(() => {
    const onKey = (e) => {
      if (confirm || e.ctrlKey || e.metaKey || e.altKey) return;
      const k = e.key.toLowerCase();
      const map = { a: 0, b: 1, c: 2, d: 3, 1: 0, 2: 1, 3: 2, 4: 3 };
      if (k in map && q.o[map[k]]) onAnswer(q.id, q.o[map[k]].k);
      else if (e.key === "ArrowRight") setIdx((i) => Math.min(questions.length - 1, i + 1));
      else if (e.key === "ArrowLeft") setIdx((i) => Math.max(0, i - 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [q, confirm, questions.length, onAnswer]);

  const timeClass = left < 60000 ? "danger" : left < 300000 ? "warn" : "";

  return (
    <div className="quiz">
      <header className="quiz-bar">
        <div className="quiz-who">
          <strong>{session.title}</strong>
          <span>{session.name}</span>
        </div>
        <div className={`timer ${timeClass}`} role="timer" aria-label="Qolgan vaqt">{fmt(left)}</div>
      </header>

      <div className="quiz-body">
        <section className="qcard" aria-live="polite">
          <p className="qcount">Savol {idx + 1} / {questions.length}</p>
          <h2 className="qtext">{q.q}</h2>
          {q.img && (
            <figure className="qimg">
              <img src={q.img} alt="Savol uchun rasm" draggable={false} />
            </figure>
          )}
          <div className="options" role="radiogroup" aria-label="Javob variantlari">
            {q.o.map((opt, i) => {
              const on = answers[q.id] === opt.k;
              return (
                <button
                  key={opt.k}
                  role="radio"
                  aria-checked={on}
                  className={`opt ${on ? "on" : ""}`}
                  onClick={() => onAnswer(q.id, opt.k)}
                >
                  <span className="pad">{String.fromCharCode(65 + i)}</span>
                  <span className="otext">{opt.t}</span>
                </button>
              );
            })}
          </div>
          <div className="qnav">
            <button className="btn" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Oldingi</button>
            {idx < questions.length - 1 ? (
              <button className="btn primary" onClick={() => setIdx(idx + 1)}>Keyingi</button>
            ) : (
              <button className="btn primary" onClick={() => setConfirm(true)}>Testni yakunlash</button>
            )}
          </div>
        </section>

        <aside className="pins">
          <p className="pins-title">Javob berildi: <b>{answered}</b> / {questions.length}</p>
          <div className="pin-grid">
            {questions.map((x, i) => (
              <button
                key={x.id}
                className={`pin ${answers[x.id] ? "done" : ""} ${i === idx ? "cur" : ""}`}
                onClick={() => setIdx(i)}
                aria-label={`Savol ${i + 1}${answers[x.id] ? ", javob berilgan" : ""}`}
              >
                {i + 1}
              </button>
            ))}
          </div>
          <button className="btn finish" onClick={() => setConfirm(true)}>Testni yakunlash</button>
        </aside>
      </div>

      {confirm && (
        <div className="modal" role="dialog" aria-modal="true" aria-labelledby="cf-title">
          <div className="modal-box">
            <h2 id="cf-title">Testni yakunlaysizmi?</h2>
            <p className="muted">
              {unanswered > 0
                ? `${unanswered} ta savolga javob bermadingiz. Yakunlagandan keyin qaytib bo‘lmaydi.`
                : "Barcha savollarga javob berdingiz. Yakunlagandan keyin qaytib bo‘lmaydi."}
            </p>
            <div className="modal-actions">
              <button className="btn" onClick={() => setConfirm(false)}>Testga qaytish</button>
              <button className="btn primary" onClick={() => onFinish("finish")}>Yakunlash</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
