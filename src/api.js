async function post(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) {
    const e = new Error(d.error || "Server xatosi");
    e.status = r.status;
    throw e;
  }
  return d;
}

export const login = (id, pass) => post("/api/login", { id, pass });
export const submit = (token, answers, reason) => post("/api/submit", { token, answers, reason });
export const admin = (password, action, sid) => post("/api/admin", { password, action, sid });
