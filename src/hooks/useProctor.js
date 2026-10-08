import { useEffect, useRef } from "react";

/**
 * Test vaqtida qoidabuzarlikni aniqlaydi va onViolation(sabab) ni chaqiradi.
 * Sabablar: fullscreen | blur | hidden | zoom | devtools
 */
export function useProctor(active, onViolation) {
  const cb = useRef(onViolation);
  cb.current = onViolation;

  useEffect(() => {
    if (!active) return;
    let armed = false;
    let base = null;

    const armTimer = setTimeout(() => {
      armed = true;
      base = { dpr: window.devicePixelRatio, w: window.innerWidth };
    }, 1200);

    const fire = (r) => cb.current(r);
    const fireArmed = (r) => armed && fire(r);

    const onFs = () => { if (!document.fullscreenElement) fire("fullscreen"); };
    const onVis = () => { if (document.hidden) fireArmed("hidden"); };
    const onBlur = () => fireArmed("blur");
    const onResize = () => {
      if (!armed || !base) return;
      if (window.devicePixelRatio !== base.dpr || Math.abs(window.innerWidth - base.w) > 3) fire("zoom");
    };

    const onKey = (e) => {
      const k = (e.key || "").toLowerCase();
      const mod = e.ctrlKey || e.metaKey;
      if (mod && ["+", "=", "-", "_", "0"].includes(k)) { e.preventDefault(); return fireArmed("zoom"); }
      if (e.key === "F12" || (mod && e.shiftKey && ["i", "j", "c"].includes(k)) || (mod && k === "u")) {
        e.preventDefault(); return fireArmed("devtools");
      }
      if (e.altKey && k === "tab") return fireArmed("blur");
      if (e.key === "Meta" || e.key === "OS") return fireArmed("blur");
      if (e.key === "F5" || e.key === "F11" || (mod && ["c", "v", "x", "a", "p", "s", "f", "g", "r"].includes(k))) e.preventDefault();
      if (e.key === "PrintScreen") { try { navigator.clipboard.writeText(""); } catch {} }
    };

    const onWheel = (e) => { if (e.ctrlKey) { e.preventDefault(); fireArmed("zoom"); } };
    const stop = (e) => e.preventDefault();
    const onTouch = (e) => { if (e.touches && e.touches.length > 1) { e.preventDefault(); fireArmed("zoom"); } };
    const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ""; };

    // Ba'zi hodisalar o'tkazib yuborilsa, tekshirib turamiz
    const poll = setInterval(() => {
      if (!armed) return;
      if (!document.fullscreenElement) fire("fullscreen");
      else if (!document.hasFocus()) fire("blur");
    }, 400);

    document.addEventListener("fullscreenchange", onFs);
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("blur", onBlur);
    window.addEventListener("resize", onResize);
    window.addEventListener("keydown", onKey, true);
    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouch, { passive: false });
    window.addEventListener("beforeunload", onBeforeUnload);
    ["contextmenu", "copy", "cut", "paste", "dragstart", "selectstart", "gesturestart"].forEach((t) =>
      document.addEventListener(t, stop)
    );

    // Chrome/Edge: Esc va boshqa tugmalarni "qulflash" (Alt+Tab'ni OS ushlab turadi)
    try { navigator.keyboard?.lock?.(["Escape", "Tab", "AltLeft", "AltRight", "MetaLeft", "MetaRight"]); } catch {}

    return () => {
      clearTimeout(armTimer);
      clearInterval(poll);
      document.removeEventListener("fullscreenchange", onFs);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("resize", onResize);
      window.removeEventListener("keydown", onKey, true);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouch);
      window.removeEventListener("beforeunload", onBeforeUnload);
      ["contextmenu", "copy", "cut", "paste", "dragstart", "selectstart", "gesturestart"].forEach((t) =>
        document.removeEventListener(t, stop)
      );
      try { navigator.keyboard?.unlock?.(); } catch {}
    };
  }, [active]);
}

export async function enterFullscreen() {
  const el = document.documentElement;
  if (!el.requestFullscreen) throw new Error("Brauzeringiz to‘liq ekran rejimini qo‘llamaydi. Kompyuterda Chrome yoki Edge'dan foydalaning.");
  await el.requestFullscreen({ navigationUI: "hide" });
}

export function exitFullscreen() {
  try { if (document.fullscreenElement) document.exitFullscreen(); } catch {}
}
