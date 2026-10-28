/**
 * Remote AI (optional).
 *
 * The app never ships an API key. Point it at your own backend (see /server) by
 * setting EXPO_PUBLIC_AI_URL in .env, or by entering the URL under
 * Profile → AI settings. Without a server the app runs in offline demo mode:
 * the coach uses the on-device engine and the food scanner returns a sample result.
 */
import { DraftMeal } from '../types';

export function aiBaseUrl(settingsUrl?: string) {
  const url = (settingsUrl || process.env.EXPO_PUBLIC_AI_URL || '').trim();
  return url.replace(/\/$/, '');
}

async function post<T>(base: string, path: string, body: unknown, timeoutMs = 30000): Promise<T> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${base}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: ctrl.signal,
    });
    if (!res.ok) throw new Error(`AI server error ${res.status}`);
    return (await res.json()) as T;
  } finally {
    clearTimeout(timer);
  }
}

type ScanResponse = {
  name: string;
  emoji?: string;
  confidence?: number;
  items: { name: string; grams: number; kcal: number; protein: number; carbs: number; fat: number }[];
};

export async function recognizeFood(base64: string, settingsUrl?: string): Promise<DraftMeal> {
  const base = aiBaseUrl(settingsUrl);
  if (!base) return demoScan();
  const r = await post<ScanResponse>(base, '/scan-food', { image: base64, mediaType: 'image/jpeg' });
  const items = r.items.map((i) => ({ ...i, kcal: Math.round(i.kcal) }));
  const sum = items.reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    name: r.name,
    emoji: r.emoji ?? '🍽️',
    meal: 'lunch',
    items,
    kcal: Math.round(sum.kcal),
    protein: Math.round(sum.protein),
    carbs: Math.round(sum.carbs),
    fat: Math.round(sum.fat),
    source: 'scan',
    confidence: r.confidence,
  };
}

export async function askCoach(question: string, context: unknown, settingsUrl?: string): Promise<string | null> {
  const base = aiBaseUrl(settingsUrl);
  if (!base) return null;
  const r = await post<{ reply: string }>(base, '/coach', { question, context });
  return r.reply;
}

const DEMO_RESULTS: ScanResponse[] = [
  {
    name: 'Chicken, Rice & Broccoli',
    emoji: '🍗',
    confidence: 0.92,
    items: [
      { name: 'Grilled chicken breast', grams: 200, kcal: 330, protein: 62, carbs: 0, fat: 7 },
      { name: 'White rice (cooked)', grams: 150, kcal: 195, protein: 4, carbs: 42, fat: 0.5 },
      { name: 'Broccoli', grams: 100, kcal: 35, protein: 3, carbs: 7, fat: 0.4 },
    ],
  },
  {
    name: 'Salmon Bowl',
    emoji: '🐟',
    confidence: 0.87,
    items: [
      { name: 'Salmon fillet', grams: 140, kcal: 291, protein: 28, carbs: 0, fat: 18 },
      { name: 'Quinoa', grams: 150, kcal: 180, protein: 7, carbs: 32, fat: 3 },
      { name: 'Avocado', grams: 50, kcal: 80, protein: 1, carbs: 4, fat: 7.5 },
      { name: 'Mixed greens', grams: 60, kcal: 15, protein: 1, carbs: 3, fat: 0 },
    ],
  },
  {
    name: 'Greek Yogurt Bowl',
    emoji: '🥣',
    confidence: 0.9,
    items: [
      { name: 'Greek yogurt', grams: 250, kcal: 148, protein: 25, carbs: 9, fat: 1 },
      { name: 'Blueberries', grams: 80, kcal: 46, protein: 0.6, carbs: 11, fat: 0.2 },
      { name: 'Granola', grams: 40, kcal: 188, protein: 4, carbs: 26, fat: 8 },
    ],
  },
];

async function demoScan(): Promise<DraftMeal> {
  await new Promise((r) => setTimeout(r, 1600));
  const r = DEMO_RESULTS[Math.floor(Math.random() * DEMO_RESULTS.length)];
  const sum = r.items.reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal, protein: a.protein + i.protein, carbs: a.carbs + i.carbs, fat: a.fat + i.fat }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
  return {
    name: r.name,
    emoji: r.emoji ?? '🍽️',
    meal: 'lunch',
    items: r.items,
    kcal: Math.round(sum.kcal),
    protein: Math.round(sum.protein),
    carbs: Math.round(sum.carbs),
    fat: Math.round(sum.fat),
    source: 'scan',
    confidence: r.confidence,
    demo: true,
  };
}
