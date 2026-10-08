import { useState } from "react";
import { enterFullscreen } from "../hooks/useProctor.js";

export default function Ready({ session, onStart }) {
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const start = async () => {
    setBusy(true);
    setError("");
    try {
      await enterFullscreen();
      onStart();
    } catch (e) {
      setError(e.message || "To‘liq ekranni yoqib bo‘lmadi. Qayta urinib ko‘ring.");
      setBusy(false);
    }
  };

  return (
    <main className="center-screen">
      <div className="panel">
        <h1>{session.name}</h1>
        <p className="muted">
          {session.title} · {session.subtitle}
        </p>

        <div className="facts">
          <div><b>{session.total}</b><span>savol</span></div>
          <div><b>{session.minutes}</b><span>daqiqa</span></div>
        </div>

        <h2>Baholash</h2>
        <table className="scale">
          <tbody>
            <tr><td>28–30 ball</td><td>5</td></tr>
            <tr><td>22–27 ball</td><td>4</td></tr>
            <tr><td>17–21 ball</td><td>3</td></tr>
            <tr><td>0–16 ball</td><td>2</td></tr>
          </tbody>
        </table>

        <h2>Qoidalar</h2>
        <ul className="rules">
          <li>Test to‘liq ekranda o‘tadi. To‘liq ekrandan chiqsangiz test tugaydi.</li>
          <li>Boshqa oynaga yoki vkladkaga o‘tish (Alt+Tab ham) testni tugatadi.</li>
          <li>Masshtabni o‘zgartirish (Ctrl + g‘ildirak, Ctrl +/−) testni tugatadi.</li>
          <li>Sahifani yangilash yoki yopish testni tugatadi, qayta boshlab bo‘lmaydi.</li>
          <li>Test tugagach, shu paytgacha berilgan javoblar bo‘yicha ball chiqadi.</li>
        </ul>

        <label className="check">
          <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
          Qoidalar bilan tanishdim
        </label>
        {error && <p className="error" role="alert">{error}</p>}
        <button className="btn primary big" disabled={!agree || busy} onClick={start}>
          Testni boshlash
        </button>
      </div>
    </main>
  );
}
