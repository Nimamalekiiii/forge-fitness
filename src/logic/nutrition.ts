import { Profile, Targets, MealEntry } from '../types';

const ACTIVITY_FACTOR = {
  sedentary: 1.2,
  light: 1.375,
  moderate: 1.55,
  active: 1.725,
  very: 1.9,
} as const;

/** Mifflin–St Jeor */
export function bmr(p: Pick<Profile, 'sex' | 'weightKg' | 'heightCm' | 'age'>) {
  return 10 * p.weightKg + 6.25 * p.heightCm - 5 * p.age + (p.sex === 'male' ? 5 : -161);
}

export function tdee(p: Profile) {
  return bmr(p) * ACTIVITY_FACTOR[p.activity];
}

const round = (n: number, step = 10) => Math.round(n / step) * step;

/** Builds daily targets from the profile. kcalAdjust lets the AI coach nudge calories over time. */
export function computeTargets(p: Profile, kcalAdjust = 0): Targets {
  const maintenance = tdee(p);
  let kcal = maintenance;
  if (p.goal === 'build') kcal = maintenance + (p.experience === 'beginner' ? 300 : 200);
  if (p.goal === 'lose') kcal = maintenance - Math.min(500, maintenance * 0.2);
  kcal = Math.max(p.sex === 'male' ? 1500 : 1200, kcal + kcalAdjust);

  const proteinPerKg = p.goal === 'lose' ? 2.2 : p.goal === 'build' ? 2.0 : 1.8;
  const protein = round(p.weightKg * proteinPerKg, 5);
  const fatPct = p.diet === 'keto' ? 0.7 : 0.27;
  const fat = round((kcal * fatPct) / 9, 5);
  const carbs = Math.max(p.diet === 'keto' ? 25 : 50, round((kcal - protein * 4 - fat * 9) / 4, 5));

  const waterMl = round(p.weightKg * 35 + (p.daysPerWeek >= 4 ? 500 : 250), 100);
  const steps = p.goal === 'lose' ? 10000 : p.activity === 'sedentary' ? 7000 : 8000;

  return { kcal: round(kcal), protein, carbs, fat, waterMl, steps };
}

export function sumMeals(meals: MealEntry[]) {
  return meals.reduce(
    (a, m) => ({
      kcal: a.kcal + m.kcal,
      protein: a.protein + m.protein,
      carbs: a.carbs + m.carbs,
      fat: a.fat + m.fat,
    }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export const bmi = (p: Profile) => p.weightKg / Math.pow(p.heightCm / 100, 2);
