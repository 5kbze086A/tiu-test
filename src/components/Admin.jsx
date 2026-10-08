import { useCallback, useEffect, useMemo, useState } from "react";
import { admin } from "../api.js";

const STATUS = {
  none: ["Kirmagan", "s-none"],
  open: ["Qayta ochilgan", "s-open"],
  started: ["Test boshlangan", "s-started"],
  done: ["Yakunlagan", "s-done"],
};
const REASONS = {
  finish: "O‘zi yakunladi", time: "Vaqt tugadi", fullscreen: "To‘liq ekrandan chiqdi",
  blur: "Boshqa oynaga o‘tdi", hidden: "Boshqa vkladkaga o‘tdi", zoom: "Masshtab o‘zgartirdi",
  devtools: "Taqiqlangan tugma", reload: "Sahifani yangiladi",
};
const KEY = "quiz_admin_pw";
const time = (t) => (t ? new Date(t).toLocaleString("uz-UZ", { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "2-digit" }) : "");

export default function Admin() {
  const [pw, setPw] = useState(() => sessionStorage.getItem(KEY) || "");
  const [authed, setAuthed] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState("");

  const load = useCallback(async (password) => {
    try {
      const d = await admin(password, "list");
      setData(d);
      setAuthed(true);
      setError("");
      sessionStorage.setItem(KEY, password);
    } catch (e) {
      setError(e.message);
      if (e.status === 401) { setAuthed(false); sessionStorage.removeItem(KEY); }
    }
  }, []);

  useEffect(() => { if (pw) load(pw); }, []); // eslint-disable-line
  useEffect(() => {
    if (!authed) return;
    const t = setInterval(() => load(pw), 15000);
    return () => clearInterval(t);
  }, [authed, pw, load]);

  const reset = async (row) => {
    if (!window.confirm(`${row.name}\n\nShu talabaga testni qayta ochasizmi? U yangi test oladi, oldingi natija tarixda qoladi.`)) return;
    setBusy(row.sid);
    try { await admin(pw, "reset", row.sid); await load(pw); } catch (e) { setError(e.message); }
    setBusy("");
  };

  const rows = useMemo(() => {
    const t = q.trim().toLowerCase();
    return (data?.rows || []).filter((r) => !t || r.name.toLowerCase().includes(t) || r.sid.includes(t));
  }, [data, q]);

  const count = (s) => (data?.rows || []).filter((r) => r.status === s).length;

  if (!authed) {
    return (
      <main className="center-screen admin">
        <form className="panel narrow" onSubmit={(e) => { e.preventDefault(); load(pw); }}>
          <h1>O‘qituvchi paneli</h1>
          <input type="password" className="admin-input" placeholder="Admin paroli" value={pw} onChange={(e) => setPw(e.target.value)} autoFocus />
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary big">Kirish</button>
        </form>
      </main>
    );
  }

  return (
    <main className="admin admin-wrap">
      <header className="admin-head">
        <h1>Natijalar</h1>
        <div className="admin-sum">
          <span>Yakunlagan: <b>{count("done")}</b></span>
          <span>Jarayonda: <b>{count("started")}</b></span>
          <span>Kirmagan: <b>{count("none") + count("open")}</b></span>
        </div>
        <input className="admin-input" placeholder="Ism yoki ID bo‘yicha qidirish" value={q} onChange={(e) => setQ(e.target.value)} />
        <button className="btn" onClick={() => load(pw)}>Yangilash</button>
      </header>

      {data.mode === "memory" && (
        <p className="notice">Baza ulanmagan: natijalar saqlanmaydi va bir martalik urinish cheklovi ishlamaydi. Vercel’da Upstash Redis ulang.</p>
      )}
      {error && <p className="error">{error}</p>}

      <div className="table-scroll">
        <table className="admin-table">
          <thead>
            <tr><th>№</th><th>F.I.Sh.</th><th>ID</th><th>Holat</th><th>Ball</th><th>Baho</th><th>Sabab</th><th>Vaqt</th><th></th></tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const [label, cls] = STATUS[r.status] || STATUS.none;
              const canReset = r.status === "done" || r.status === "started";
              return (
                <tr key={r.sid}>
                  <td>{i + 1}</td>
                  <td className="nm">
                    {r.name}
                    {r.history.length > 0 && (
                      <small>Oldingi: {r.history.map((h) => (h.score != null ? `${h.score} ball (${h.grade})` : "tugatmagan")).join(", ")}</small>
                    )}
                  </td>
                  <td>{r.sid}</td>
                  <td><span className={`badge ${cls}`}>{label}</span></td>
                  <td>{r.score != null ? `${r.score}/${r.total}` : ""}</td>
                  <td className="gr">{r.grade ?? ""}</td>
                  <td>{REASONS[r.reason] || ""}</td>
                  <td>{time(r.at)}</td>
                  <td>
                    <button className="btn small-btn" disabled={!canReset || busy === r.sid} onClick={() => reset(r)}>
                      Qayta ochish
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </main>
  );
}
