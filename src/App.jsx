import { useCallback, useEffect, useRef, useState } from "react";
import { login, submit } from "./api.js";
import { exitFullscreen } from "./hooks/useProctor.js";
import Login from "./components/Login.jsx";
import Ready from "./components/Ready.jsx";
import Quiz from "./components/Quiz.jsx";
import Result from "./components/Result.jsx";

const KEY = "quiz_session_v1";
const read = (k) => { try { return JSON.parse(localStorage.getItem(k)); } catch { return null; } };
const write = (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} };

export default function App() {
  const [phase, setPhase] = useState("boot"); // boot | login | ready | test | submitting | error | result
  const [session, setSession] = useState(null);
  const [answers, setAnswers] = useState({});
  const [result, setResult] = useState(null);
  const [err, setErr] = useState("");
  const [notice, setNotice] = useState("");

  const sRef = useRef(null);
  const aRef = useRef({});
  const doneRef = useRef(false);
  const pendingRef = useRef("finish");
  const bootRef = useRef(false);

  const persist = (patch) => {
    sRef.current = { ...sRef.current, ...patch };
    write(KEY, sRef.current);
  };

  const sendResult = useCallback(async (reason) => {
    pendingRef.current = reason;
    persist({ pendingReason: reason });
    setErr("");
    setPhase("submitting");
    try {
      const r = await submit(sRef.current.token, aRef.current, reason);
      const final = { ...r, reason, name: sRef.current.name };
      localStorage.removeItem(KEY);
      setResult(final);
      setPhase("result");
    } catch (e) {
      if (e.status === 409) {
        // Sessiya eskirgan (masalan, o'qituvchi testni qayta ochgan)
        localStorage.removeItem(KEY);
        doneRef.current = false;
        setNotice(e.message);
        setPhase("login");
        return;
      }
      setErr(e.message || "Tarmoq xatosi");
      setPhase("error");
    }
  }, []);

  const finish = useCallback((reason) => {
    if (doneRef.current) return;
    doneRef.current = true;
    exitFullscreen();
    sendResult(reason);
  }, [sendResult]);

  // Sahifa ochilganda: tugallanmagan sessiya bormi?
  useEffect(() => {
    if (bootRef.current) return;
    bootRef.current = true;
    const s = read(KEY);
    if (!s) return setPhase("login");
    sRef.current = s;
    aRef.current = s.answers || {};
    setSession(s);
    setAnswers(aRef.current);
    if (s.pendingReason || s.started) {
      // Test boshlangan edi va sahifa yangilandi — test yakunlanadi
      doneRef.current = true;
      sendResult(s.pendingReason || "reload");
    } else {
      setPhase("ready");
    }
  }, [sendResult]);

  const handleLogin = async (id, pass) => {
    const resp = await login(id, pass);
    if (resp.done) {
      localStorage.removeItem(KEY);
      setResult({ score: resp.score, total: resp.total, grade: resp.grade, name: resp.name, reason: resp.reason });
      setPhase("result");
      return;
    }
    setNotice("");
    const s = { ...resp, started: false, answers: {} };
    sRef.current = s;
    aRef.current = {};
    write(KEY, s);
    setSession(s);
    setAnswers({});
    setPhase("ready");
  };

  const handleStart = () => {
    persist({ started: true, endsAt: Date.now() + sRef.current.minutes * 60000 });
    setSession(sRef.current);
    setPhase("test");
  };

  const handleAnswer = (qid, k) => {
    aRef.current = { ...aRef.current, [qid]: k };
    setAnswers(aRef.current);
    persist({ answers: aRef.current });
  };

  if (phase === "boot") return null;
  if (phase === "login") return <Login onLogin={handleLogin} notice={notice} />;
  if (phase === "ready") return <Ready session={session} onStart={handleStart} />;
  if (phase === "test") return <Quiz session={session} answers={answers} onAnswer={handleAnswer} onFinish={finish} />;
  if (phase === "submitting")
    return (
      <main className="center-screen">
        <div className="panel narrow">
          <div className="spinner" aria-hidden />
          <h1>Natija hisoblanmoqda</h1>
          <p className="muted">Sahifani yopmang.</p>
        </div>
      </main>
    );
  if (phase === "error")
    return (
      <main className="center-screen">
        <div className="panel narrow">
          <h1>Natijani yuborib bo‘lmadi</h1>
          <p className="muted">{err}. Internetni tekshirib, qayta urinib ko‘ring. Javoblaringiz saqlangan.</p>
          <button className="btn primary" onClick={() => sendResult(pendingRef.current)}>Qayta yuborish</button>
        </div>
      </main>
    );
  return <Result result={result} />;
}
