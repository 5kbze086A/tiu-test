import { useState } from "react";

function Traces() {
  return (
    <svg className="traces" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden>
      <g fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M-10 120 H140 L190 170 H330 L380 120 H610" />
        <path d="M-10 220 H90 L140 270 H250 L300 320 H610" />
        <path d="M-10 420 H200 L250 370 H420 L470 420 H610" />
        <path d="M-10 560 H120 L170 510 H300 L350 560 H460 L510 610 H610" />
        <path d="M-10 700 H260 L310 650 H610" />
      </g>
      <g fill="currentColor">
        {[[140,120],[330,170],[380,120],[90,220],[250,270],[300,320],[200,420],[420,370],[470,420],[120,560],[300,510],[460,560],[260,700],[310,650]].map(([x,y],i)=>(
          <circle key={i} cx={x} cy={y} r="6" />
        ))}
      </g>
    </svg>
  );
}

export default function Login({ onLogin, notice }) {
  const [id, setId] = useState("");
  const [pass, setPass] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      await onLogin(id, pass);
    } catch (err) {
      setError(err.message || "Kirib bo‘lmadi");
      setBusy(false);
    }
  };

  return (
    <main className="login">
      <section className="login-art">
        <Traces />
        <div className="login-art-text">
          <h1>Mikrokontrollerlarni dasturlash</h1>
          <p>Nazorat testi</p>
        </div>
      </section>
      <section className="login-form-wrap">
        <form className="login-form" onSubmit={submit}>
          <h2>Tizimga kirish</h2>
          <label>
            Talaba ID raqami
            <input
              inputMode="numeric"
              autoComplete="off"
              value={id}
              onChange={(e) => setId(e.target.value)}
              placeholder="456221102107"
              required
            />
          </label>
          <label>
            Pasport seriya va raqami
            <span className="pw">
              <input
                type={show ? "text" : "password"}
                autoComplete="off"
                autoCapitalize="characters"
                value={pass}
                onChange={(e) => setPass(e.target.value)}
                placeholder="AA1234567"
                required
              />
              <button type="button" className="ghost" onClick={() => setShow((s) => !s)}>
                {show ? "Yashirish" : "Ko‘rsatish"}
              </button>
            </span>
          </label>
          {notice && !error && <p className="notice-box">{notice}</p>}
          {error && <p className="error" role="alert">{error}</p>}
          <button className="btn primary" disabled={busy}>{busy ? "Tekshirilmoqda..." : "Kirish"}</button>
        </form>
      </section>
    </main>
  );
}
