# Mikrokontrollerlar — nazorat testi

React + Vite (frontend) va Vercel serverless funksiyalar (`/api`).
Login-parollar va to'g'ri javoblar **serverda** turadi, talaba brauzerida ko'rinmaydi.

## Mahalliy sinash
`npm install` → `npm run dev` → http://localhost:5173
- O'qituvchi paneli: http://localhost:5173/admin (mahalliy parol: `admin`)
- Urinishlar `.data/attempts.json` faylida saqlanadi. Hammasini tozalash uchun shu papkani o'chiring.

## Vercel'ga joylash
1. Papkani **private** GitHub repo'ga yuklang, Vercel'da Import qiling.
2. **Settings → Environment Variables**:
   - `QUIZ_SECRET` — uzun tasodifiy matn
   - `ADMIN_PASSWORD` — o'qituvchi paneli paroli
   - (ixtiyoriy) `TELEGRAM_BOT_TOKEN`, `TELEGRAM_CHAT_ID` — natija Telegramga kelishi uchun
3. **Storage → Create → Upstash Redis** (Marketplace) → shu loyihaga ulang. Vercel kerakli o'zgaruvchilarni o'zi qo'shadi. Shusiz "bir marta topshirish" va "qayta ochish" ishonchli ishlamaydi.
4. **Settings → Deployment Protection** ni o'chiring (aks holda talabalar saytni ocha olmaydi).
5. Redeploy.

## Qayta ochish (2-urinish)
`/admin` sahifasiga o'qituvchi paroli bilan kiring → talaba qatorida **Qayta ochish**.
Talaba yangi (boshqa random) test oladi, oldingi natija "Oldingi:" qatorida tarixda qoladi.
Test boshlab, tugatmay chiqib ketgan (kompyuter o'chib qolgan) talabani ham shunday ochasiz.

## Sozlash
- `api/_config.js` — savollar soni (30), vaqt (40 daqiqa), baho chegaralari.
- `api/_data/students.js` — talabalar (ID, pasport, ism).
- `api/_data/questions.js` — 80 ta savol va to'g'ri javob (`a`). Rasm uchun savolga `"img": "/img/12.png"` qo'shing, faylni `public/img/12.png` ga qo'ying.

## Cheklovlar
- Brauzer Alt+Tab'ni to'sa olmaydi: oyna fokusini yo'qotganini aniqlab, testni tugatadi.
- Faqat kompyuter/noutbuk tavsiya etiladi (iPhone to'liq ekranni qo'llamaydi).
