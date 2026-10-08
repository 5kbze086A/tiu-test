// Test sozlamalari — shu yerdan o'zgartiring.
export const CONFIG = {
  total: 30,        // har talabaga nechta savol tushadi (80 tadan random)
  minutes: 40,      // test vaqti (daqiqa)
  title: "Mikrokontrollerlarni dasturlash",
  subtitle: "Nazorat testi",
};

// Ball -> baho. Pastdan yuqoriga qarab tekshiriladi.
export function gradeOf(score) {
  if (score >= 28) return 5;
  if (score >= 22) return 4;
  if (score >= 17) return 3;
  return 2;
}
