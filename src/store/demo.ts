import { BodyLog, DailyLog, MealEntry, Profile, Program, WorkoutLog } from '../types';
import { addDays, dayKey, uid, weekdayIndex } from '../logic/date';
import { exerciseById } from '../data/exercises';
import { RECIPES, recipeNutrition } from '../data/recipes';
import { workoutVolume } from '../logic/strength';
import { computeTargets } from '../logic/nutrition';

const START_KG: Record<string, number> = {
  'bench-press': 62.5,
  'incline-db-press': 22,
  'db-bench': 24,
  'chest-fly-cable': 15,
  'machine-chest-press': 50,
  deadlift: 110,
  'lat-pulldown': 55,
  'barbell-row': 55,
  'db-row': 26,
  'seated-cable-row': 50,
  'face-pull': 20,
  ohp: 37.5,
  'db-shoulder-press': 18,
  'lateral-raise': 8,
  'rear-delt-fly': 6,
  'barbell-curl': 27.5,
  'db-curl': 12,
  'hammer-curl': 14,
  'tricep-pushdown': 25,
  'skull-crusher': 25,
  'overhead-tricep-ext': 16,
  squat: 90,
  'leg-press': 140,
  'goblet-squat': 24,
  'bulgarian-split-squat': 14,
  'leg-extension': 45,
  rdl: 80,
  'db-rdl': 24,
  'leg-curl': 35,
  'hip-thrust': 90,
  'walking-lunge': 14,
  'calf-raise': 60,
  'kb-swing': 20,
  'cable-crunch': 30,
};

export function buildDemoData(profile: Profile, program: Program | null) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const DAYS = 84;
  const workouts: WorkoutLog[] = [];
  const meals: MealEntry[] = [];
  const daily: Record<string, DailyLog> = {};
  const body: BodyLog[] = [];

  const kcalTarget = computeTargets(profile).kcal;
  const goalDir = profile.goal === 'lose' ? -1 : profile.goal === 'build' ? 1 : 0;
  const startWeight = profile.weightKg - goalDir * 1.4;
  const startFat = profile.sex === 'male' ? 14.2 : 24.5;

  for (let i = DAYS; i >= 0; i--) {
    const d = addDays(today, -i);
    const key = dayKey(d);
    const progress = (DAYS - i) / DAYS;
    const isToday = i === 0;

    // Daily habits
    daily[key] = {
      waterMl: isToday ? 700 : 2000 + Math.round(Math.random() * 1400),
      steps: isToday ? 3200 : 5500 + Math.round(Math.random() * 6500),
      sleepH: Math.round((6.2 + Math.random() * 2) * 10) / 10,
      energy: (3 + Math.round(Math.random() * 2)) as DailyLog['energy'],
    };

    // Body logs every 3 days
    if (i % 3 === 0) {
      const noise = (Math.random() - 0.5) * 0.5;
      body.push({
        date: key,
        weightKg: Math.round((startWeight + goalDir * 1.4 * progress + noise) * 10) / 10,
        bodyFat: Math.round((startFat - 1.8 * progress + (Math.random() - 0.5) * 0.3) * 10) / 10,
        muscleKg: Math.round((profile.weightKg * 0.84 * 0.52 + 2.1 * progress) * 10) / 10,
        waistCm: i % 9 === 0 ? Math.round(84 - 2.5 * progress) : undefined,
        armCm: i % 9 === 0 ? Math.round((35 + 1.2 * progress) * 10) / 10 : undefined,
        chestCm: i % 9 === 0 ? Math.round(100 + 2 * progress) : undefined,
      });
    }

    // Workouts on program days
    const tpl = program?.days.find((t) => t.weekday === weekdayIndex(d));
    if (tpl && !isToday && Math.random() > 0.08) {
      const week = Math.floor((DAYS - i) / 7);
      const started = new Date(d);
      started.setHours(17, 30, 0, 0);
      const exercises = tpl.exercises.map((pe) => {
        const ex = exerciseById(pe.exerciseId);
        const base = START_KG[pe.exerciseId] ?? 0;
        const inc = ex?.increment ?? 2.5;
        const cycle = pe.repsMax - pe.repsMin + 1;
        const kg = base > 0 ? base + Math.floor(week / Math.max(1, Math.ceil(cycle / 2))) * inc : 0;
        const reps = pe.repsMin + ((week * 2) % cycle);
        return {
          exerciseId: pe.exerciseId,
          sets: Array.from({ length: pe.sets }, (_, s) => ({
            kg,
            reps: Math.max(pe.repsMin, reps - (s === pe.sets - 1 ? 1 : 0)),
            done: true,
          })),
        };
      });
      workouts.push({
        id: uid(),
        templateId: tpl.id,
        name: tpl.name,
        startedAt: started.toISOString(),
        durationSec: (tpl.estMinutes + Math.round(Math.random() * 10 - 5)) * 60,
        exercises,
        volume: Math.round(workoutVolume({ exercises })),
        prs: [],
        feeling: (3 + Math.round(Math.random() * 2)) as WorkoutLog['feeling'],
      });
    }

    // Meals
    const plan = isToday
      ? [
          { r: 'protein-oats', meal: 'breakfast' as const },
          { r: 'chicken-rice-broccoli', meal: 'lunch' as const },
        ]
      : [
          { r: i % 2 ? 'protein-oats' : 'egg-wrap', meal: 'breakfast' as const },
          { r: i % 3 ? 'chicken-rice-broccoli' : 'beef-pasta', meal: 'lunch' as const },
          { r: 'skyr-bowl', meal: 'snack' as const },
          { r: i % 2 ? 'salmon-veggies' : 'chicken-rice-broccoli', meal: 'dinner' as const },
        ];
    if (i <= 14) {
      const planKcal = plan.reduce((a, p) => a + recipeNutrition(RECIPES.find((x) => x.id === p.r)!).kcal, 0);
      // Full days land within ±8% of target; today is roughly half eaten
      const k = isToday ? 1 : (kcalTarget / planKcal) * (0.92 + Math.random() * 0.16);
      for (const p of plan) {
        const r = RECIPES.find((x) => x.id === p.r)!;
        const raw = recipeNutrition(r);
        const n = { kcal: raw.kcal * k, protein: raw.protein * Math.min(k, 1.15), carbs: raw.carbs * k, fat: raw.fat * k };
        meals.push({
          id: uid(),
          date: key,
          meal: p.meal,
          name: r.name,
          emoji: r.emoji,
          items: [],
          kcal: Math.round(n.kcal),
          protein: Math.round(n.protein),
          carbs: Math.round(n.carbs),
          fat: Math.round(n.fat),
          source: 'recipe',
          createdAt: d.toISOString(),
        });
      }
    }
  }

  const lastWeight = [...body].reverse().find((b) => b.weightKg)?.weightKg ?? profile.weightKg;
  return { workouts, meals, daily, body, profile: { ...profile, weightKg: lastWeight } };
}
