const WORDS = { 5: "A’lo", 4: "Yaxshi", 3: "Qoniqarli", 2: "Qoniqarsiz" };
const REASONS = {
  time: "Vaqt tugadi.",
  fullscreen: "To‘liq ekrandan chiqildi, test avtomatik yakunlandi.",
  blur: "Boshqa oynaga o‘tildi, test avtomatik yakunlandi.",
  hidden: "Boshqa vkladkaga o‘tildi, test avtomatik yakunlandi.",
  zoom: "Masshtab o‘zgartirildi, test avtomatik yakunlandi.",
  devtools: "Taqiqlangan tugmalar bosildi, test avtomatik yakunlandi.",
  reload: "Sahifa yangilandi, test avtomatik yakunlandi.",
};

export default function Result({ result }) {
  const { score, total, grade, name, reason } = result;
  return (
    <main className="center-screen">
      <div className="panel narrow result">
        <p className="muted">{name}</p>
        <div className={`grade g${grade}`} aria-label={`Baho ${grade}`}>{grade}</div>
        <h1>{WORDS[grade]}</h1>
        <p className="score">
          <b>{score}</b> / {total} ta to‘g‘ri javob
        </p>
        {REASONS[reason] && <p className="notice">{REASONS[reason]}</p>}
        <p className="muted small">Natija saqlandi. Bu oynani yopishingiz mumkin.</p>
      </div>
    </main>
  );
}
