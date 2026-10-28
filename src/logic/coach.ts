/**
 * Forge AI Coach – on-device engine.
 *
 * Learns from the loop Workout → Nutrition → Recovery → Progress and turns it into
 * prioritised, actionable recommendations. Runs fully offline; an optional remote
 * LLM (see src/ai/client.ts) can be layered on top for free-form chat and photo scans.
 */
import { State } from '../store/useStore';
import { MUSCLES, Muscle, exerciseById } from '../data/exercises';
import { RECIPES, recipeAllowed, recipeNutrition } from '../data/recipes';
import { addDays, dayKey, startOfWeek, weekdayIndex, fromKey } from './date';
import { sumMeals } from './nutrition';
import { personalRecords, suggestNext } from './strength';
import { WorkoutTemplate } from '../types';
import { colors } from '../theme';

export type InsightAction =
  | { label: string; route: string; params?: Record<string, string> }
  | { label: string; kind: 'applyKcal'; value: number; message: string }
  | { label: string; kind: 'water'; value: number };

export type Insight = {
  id: string;
  kind: 'nutrition' | 'training' | 'recovery' | 'hydration' | 'progress' | 'win';
  priority: number; // higher = more important
  icon: string;
  color: string;
  title: string;
  body: string;
  action?: InsightAction;
};

type Snap = Pick<
  State,
  'profile' | 'targets' | 'program' | 'workouts' | 'meals' | 'daily' | 'body' | 'settings' | 'coachLog' | 'dismissed' | 'customWorkouts'
>;

export function todaysTemplate(s: Snap, date = new Date()): WorkoutTemplate | null {
  return s.program?.days.find((d) => d.weekday === weekdayIndex(date)) ?? null;
}

export function workoutDoneOn(s: Snap, date = new Date()) {
  const k = dayKey(date);
  return s.workouts.some((w) => dayKey(new Date(w.startedAt)) === k);
}

export function nextWorkout(s: Snap) {
  if (!s.program) return null;
  for (let i = 0; i < 7; i++) {
    const d = addDays(new Date(), i);
    const t = todaysTemplate(s, d);
    if (t && !(i === 0 && workoutDoneOn(s, d))) return { template: t, inDays: i };
  }
  return null;
}

/** Fraction of the eating day that has passed (07–21) */
function dayFraction(now = new Date()) {
  const h = now.getHours() + now.getMinutes() / 60;
  return Math.min(1, Math.max(0.12, (h - 7) / 14));
}

export function todayTotals(s: Snap, date = new Date()) {
  const k = dayKey(date);
  const eaten = sumMeals(s.meals.filter((m) => m.date === k));
  const day = s.daily[k] ?? { waterMl: 0, steps: 0 };
  const t = s.targets!;
  return {
    eaten,
    day,
    remaining: {
      kcal: Math.round(t.kcal - eaten.kcal),
      protein: Math.round(t.protein - eaten.protein),
      carbs: Math.round(t.carbs - eaten.carbs),
      fat: Math.round(t.fat - eaten.fat),
      waterMl: Math.max(0, t.waterMl - day.waterMl),
      steps: Math.max(0, t.steps - day.steps),
    },
  };
}

// ───────────────────────── Recovery ─────────────────────────

export function recovery(s: Snap) {
  const now = Date.now();
  const load: Record<string, number> = {};
  for (const w of s.workouts) {
    const hours = (now - new Date(w.startedAt).getTime()) / 3600000;
    if (hours > 96) continue;
    for (const ex of w.exercises) {
      const meta = exerciseById(ex.exerciseId);
      if (!meta) continue;
      const sets = ex.sets.filter((x) => x.done).length;
      const fatigue = Math.max(0, 1 - hours / 72) * sets;
      load[meta.muscle] = (load[meta.muscle] ?? 0) + fatigue * 14;
      for (const m of meta.secondary) load[m] = (load[m] ?? 0) + fatigue * 6;
    }
  }
  const muscles = MUSCLES.map((m) => ({ muscle: m, readiness: Math.round(Math.max(5, 100 - (load[m] ?? 0))) }));
  const today = s.daily[dayKey()];
  const yesterday = s.daily[dayKey(addDays(new Date(), -1))];
  const sleep = today?.sleepH ?? yesterday?.sleepH;
  const sleepScore = sleep ? Math.min(100, (sleep / 8) * 100) : 75;
  const energy = today?.energy ? today.energy * 20 : 70;
  const muscleAvg = muscles.reduce((a, m) => a + m.readiness, 0) / muscles.length;
  const score = Math.round(sleepScore * 0.45 + muscleAvg * 0.35 + energy * 0.2);
  const label = score >= 80 ? 'Ready to push' : score >= 60 ? 'Train as planned' : score >= 45 ? 'Go lighter today' : 'Prioritise rest';
  const color = score >= 80 ? colors.success : score >= 60 ? colors.primary : score >= 45 ? colors.warning : colors.danger;
  return { score, label, color, muscles, sleep };
}

// ───────────────────────── Weekly goal ─────────────────────────

export function weeklyProgress(s: Snap, ref = new Date()) {
  const start = startOfWeek(ref);
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const elapsed = days.filter((d) => d <= ref);
  const planned = s.program?.days.filter((d) => d.weekday !== null).length ?? 3;
  const done = s.workouts.filter((w) => {
    const d = new Date(w.startedAt);
    return d >= start && d < addDays(start, 7);
  }).length;
  const t = s.targets;
  let nutritionDays = 0;
  let waterDays = 0;
  for (const d of elapsed) {
    const k = dayKey(d);
    const tot = sumMeals(s.meals.filter((m) => m.date === k));
    if (t && tot.kcal > 0 && Math.abs(tot.kcal - t.kcal) / t.kcal <= 0.12 && tot.protein >= t.protein * 0.85) nutritionDays++;
    if (t && (s.daily[k]?.waterMl ?? 0) >= t.waterMl * 0.85) waterDays++;
  }
  // Today counts proportionally so the number climbs during the day
  const todayK = dayKey(ref);
  const todayTot = sumMeals(s.meals.filter((m) => m.date === todayK));
  const partialNut = t ? Math.min(1, todayTot.protein / t.protein) * 0.6 : 0;
  const partialWater = t ? Math.min(1, (s.daily[todayK]?.waterMl ?? 0) / t.waterMl) * 0.6 : 0;
  const nutScore = Math.min(1, (nutritionDays + partialNut) / 7);
  const waterScore = Math.min(1, (waterDays + partialWater) / 7);
  const trainScore = Math.min(1, done / Math.max(1, planned));
  const percent = Math.round((trainScore * 0.5 + nutScore * 0.3 + waterScore * 0.2) * 100);
  return { percent, done, planned, nutritionDays, waterDays };
}

// ───────────────────────── Body trend & adaptive targets ─────────────────────────

export function weightTrend(s: Snap, days = 21) {
  const since = dayKey(addDays(new Date(), -days));
  const pts = s.body.filter((b) => b.weightKg && b.date >= since).map((b) => ({ x: fromKey(b.date).getTime() / 86400000, y: b.weightKg! }));
  if (pts.length < 4 || pts[pts.length - 1].x - pts[0].x < 10) return null;
  const n = pts.length;
  const mx = pts.reduce((a, p) => a + p.x, 0) / n;
  const my = pts.reduce((a, p) => a + p.y, 0) / n;
  const slope = pts.reduce((a, p) => a + (p.x - mx) * (p.y - my), 0) / pts.reduce((a, p) => a + (p.x - mx) ** 2, 0);
  return { kgPerWeek: Math.round(slope * 7 * 100) / 100, points: n };
}

function adaptiveCalories(s: Snap): Insight | null {
  const p = s.profile;
  const tr = weightTrend(s);
  if (!p || !tr) return null;
  const recent = s.coachLog.some((c) => c.date >= dayKey(addDays(new Date(), -10)));
  if (recent) return null;
  const pct = (tr.kgPerWeek / p.weightKg) * 100;
  let delta = 0;
  let why = '';
  if (p.goal === 'lose' && tr.kgPerWeek > -0.1) {
    delta = -150;
    why = `Your weight has been flat (${tr.kgPerWeek > 0 ? '+' : ''}${tr.kgPerWeek} kg/week) for 3 weeks.`;
  } else if (p.goal === 'lose' && pct < -1.1) {
    delta = 150;
    why = `You're losing fast (${tr.kgPerWeek} kg/week) — that risks muscle.`;
  } else if (p.goal === 'build' && tr.kgPerWeek < 0.08) {
    delta = 150;
    why = `Your weight isn't moving up (${tr.kgPerWeek} kg/week) — muscle needs a surplus.`;
  } else if (p.goal === 'build' && pct > 0.6) {
    delta = -100;
    why = `You're gaining quickly (+${tr.kgPerWeek} kg/week) — trim to keep it lean.`;
  } else if (p.goal === 'maintain' && Math.abs(tr.kgPerWeek) > 0.3) {
    delta = tr.kgPerWeek > 0 ? -100 : 100;
    why = `Weight is drifting ${tr.kgPerWeek > 0 ? 'up' : 'down'} ${Math.abs(tr.kgPerWeek)} kg/week.`;
  }
  if (!delta) return null;
  const msg = `${delta > 0 ? 'Raised' : 'Lowered'} daily calories by ${Math.abs(delta)} kcal. ${why}`;
  return {
    id: 'adapt-kcal',
    kind: 'progress',
    priority: 8,
    icon: 'analytics',
    color: colors.recovery,
    title: `Adjust calories ${delta > 0 ? '+' : '−'}${Math.abs(delta)} kcal`,
    body: `${why} I recommend ${delta > 0 ? 'adding' : 'cutting'} ${Math.abs(delta)} kcal per day.`,
    action: { label: 'Apply', kind: 'applyKcal', value: delta, message: msg },
  };
}

// ───────────────────────── Meal suggestion ─────────────────────────

export function suggestMeal(s: Snap, remainingKcal: number, remainingProtein: number) {
  const diet = s.profile?.diet ?? 'none';
  const options = RECIPES.filter((r) => recipeAllowed(r, diet))
    .map((r) => ({ r, n: recipeNutrition(r) }))
    .filter((o) => o.n.kcal <= Math.max(250, remainingKcal + 80));
  if (!options.length) return null;
  // A sensible meal size: about half of what's left, between 300 and 900 kcal
  const desired = Math.min(900, Math.max(300, remainingKcal * 0.5));
  const score = (o: (typeof options)[number]) =>
    (o.n.protein / o.n.kcal) * 10 - Math.abs(o.n.kcal - desired) / desired - (remainingProtein > 0 ? Math.max(0, remainingProtein - o.n.protein) / 200 : 0);
  options.sort((a, b) => score(b) - score(a));
  return options[0];
}

// ───────────────────────── Insights ─────────────────────────

export function coachInsights(s: Snap, now = new Date()): Insight[] {
  if (!s.profile || !s.targets) return [];
  const out: Insight[] = [];
  const t = s.targets;
  const { eaten, day, remaining } = todayTotals(s, now);
  const frac = dayFraction(now);
  const tpl = todaysTemplate(s, now);
  const trained = workoutDoneOn(s, now);
  const rec = recovery(s);
  const hour = now.getHours();

  // Protein pacing
  const expectedProtein = t.protein * frac;
  if (eaten.protein < expectedProtein * 0.8 && remaining.protein > 20) {
    const meal = suggestMeal(s, remaining.kcal, remaining.protein);
    const when = tpl && !trained ? 'after your workout' : hour < 15 ? 'for your next meal' : 'tonight';
    out.push({
      id: 'protein-behind',
      kind: 'nutrition',
      priority: 9,
      icon: 'restaurant',
      color: colors.protein,
      title: "You're behind on protein",
      body: meal
        ? `${remaining.protein} g left today. Add ${meal.r.name} ${when} — about ${Math.round(meal.n.protein)} g protein for ${Math.round(meal.n.kcal)} kcal.`
        : `${remaining.protein} g left today. Prioritise a lean protein source ${when}.`,
      action: meal ? { label: 'Log it', route: '/nutrition/meal', params: { recipe: meal.r.id } } : { label: 'Log meal', route: '/nutrition/log' },
    });
  }

  // Calories way over / under late in the day
  if (hour >= 19 && remaining.kcal > t.kcal * 0.35) {
    out.push({
      id: 'kcal-under',
      kind: 'nutrition',
      priority: 6,
      icon: 'flame',
      color: colors.carbs,
      title: `${remaining.kcal} kcal still to go`,
      body:
        s.profile.goal === 'build'
          ? "Under-eating will stall muscle gain. A shake with oats and milk is an easy 500 kcal."
          : 'Eat a proper dinner — big deficits backfire with hunger and lost muscle.',
      action: { label: 'Log meal', route: '/nutrition/log' },
    });
  } else if (remaining.kcal < -150) {
    out.push({
      id: 'kcal-over',
      kind: 'nutrition',
      priority: 5,
      icon: 'flame',
      color: colors.fat,
      title: `${Math.abs(remaining.kcal)} kcal over today`,
      body: 'No stress — one day doesn’t matter. Keep the rest of today light and add a 20-min walk.',
    });
  }

  // Hydration pacing
  if (day.waterMl < t.waterMl * frac * 0.7 && remaining.waterMl > 400) {
    out.push({
      id: 'water',
      kind: 'hydration',
      priority: 5,
      icon: 'water',
      color: colors.water,
      title: 'Drink some water',
      body: `You're at ${(day.waterMl / 1000).toFixed(1)} L of ${(t.waterMl / 1000).toFixed(1)} L. Even 2% dehydration costs strength.`,
      action: { label: '+ 500 ml', kind: 'water', value: 500 },
    });
  }

  // Training
  if (tpl && !trained) {
    const lowMuscles = rec.muscles.filter((m) => m.readiness < 55).map((m) => m.muscle);
    const targetMuscles = new Set(tpl.exercises.map((e) => exerciseById(e.exerciseId)?.muscle));
    const conflict = lowMuscles.filter((m) => targetMuscles.has(m as Muscle));
    if (rec.score < 50 || conflict.length >= 2) {
      out.push({
        id: 'deload',
        kind: 'recovery',
        priority: 8,
        icon: 'bed',
        color: colors.recovery,
        title: 'Take it lighter today',
        body: conflict.length
          ? `${conflict.join(', ')} haven't recovered yet. Do ${tpl.name} with one less set per exercise and stop 2–3 reps short of failure.`
          : `Recovery is ${rec.score}/100${rec.sleep ? ` after ${rec.sleep} h sleep` : ''}. Keep today's ${tpl.name} at RPE 7.`,
      });
    } else {
      // Progressive overload highlight
      const first = tpl.exercises[0];
      const sug = first ? suggestNext(s.workouts, first) : null;
      const name = first ? exerciseById(first.exerciseId)?.name : '';
      out.push({
        id: 'train-today',
        kind: 'training',
        priority: hour >= 16 ? 8 : 6,
        icon: 'barbell',
        color: colors.primary,
        title: `${tpl.name} is on today`,
        body:
          sug && sug.kg > 0
            ? `Target for ${name}: ${sug.kg} kg × ${sug.reps}. ${sug.note}`
            : `${tpl.exercises.length} exercises, about ${tpl.estMinutes} min. ${rec.label}.`,
        action: { label: 'Start', route: '/workout/active', params: { template: tpl.id } },
      });
    }
  } else if (!tpl && !trained) {
    out.push({
      id: 'rest-day',
      kind: 'recovery',
      priority: 3,
      icon: 'leaf',
      color: colors.success,
      title: 'Rest day',
      body: `Muscle grows while you recover. Aim for ${t.steps.toLocaleString()} steps and ${s.profile.goal === 'lose' ? 'keep protein high' : 'hit your protein'}.`,
    });
  }

  // Steps
  if (hour >= 17 && day.steps > 0 && day.steps < t.steps * 0.6) {
    out.push({
      id: 'steps',
      kind: 'training',
      priority: 4,
      icon: 'walk',
      color: colors.steps,
      title: `${remaining.steps.toLocaleString()} steps to go`,
      body: 'A 25-minute evening walk covers roughly 3,000 steps and helps recovery.',
    });
  }

  // Sleep
  if (rec.sleep && rec.sleep < 6.5) {
    out.push({
      id: 'sleep',
      kind: 'recovery',
      priority: 6,
      icon: 'moon',
      color: colors.recovery,
      title: `Only ${rec.sleep} h of sleep`,
      body: 'Aim for 7–9 h tonight. Short sleep lowers strength and raises hunger the next day.',
    });
  }

  // Wins
  const recent = s.workouts.filter((w) => Date.now() - new Date(w.startedAt).getTime() < 3 * 86400000 && w.prs.length);
  if (recent.length) {
    const last = recent[recent.length - 1];
    const prNames = last.prs.map((id) => exerciseById(id)?.name).filter(Boolean);
    out.push({
      id: 'pr-win',
      kind: 'win',
      priority: 4,
      icon: 'trophy',
      color: colors.warning,
      title: `New PR${prNames.length > 1 ? 's' : ''}! 🎉`,
      body: `${prNames.slice(0, 3).join(', ')} — progressive overload is working.`,
      action: { label: 'See records', route: '/progress/stats' },
    });
  }

  const adapt = s.settings.ai.autoAdjustTargets ? adaptiveCalories(s) : null;
  if (adapt) out.push(adapt);

  const dismissed = s.dismissed[dayKey(now)] ?? [];
  return out.filter((i) => !dismissed.includes(i.id)).sort((a, b) => b.priority - a.priority);
}

// ───────────────────────── Reports ─────────────────────────

export function weeklyReport(s: Snap, weeksAgo = 0) {
  const start = addDays(startOfWeek(), -7 * weeksAgo);
  const end = addDays(start, 7);
  const inRange = (iso: string) => {
    const d = iso.length === 10 ? fromKey(iso) : new Date(iso);
    return d >= start && d < end;
  };
  const ws = s.workouts.filter((w) => inRange(w.startedAt));
  const days = Array.from({ length: 7 }, (_, i) => dayKey(addDays(start, i)));
  const loggedDays = days.filter((k) => s.meals.some((m) => m.date === k));
  const tot = loggedDays.map((k) => sumMeals(s.meals.filter((m) => m.date === k)));
  const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0);
  const weights = s.body.filter((b) => b.weightKg && inRange(b.date)).map((b) => b.weightKg!);
  const prev = s.body.filter((b) => b.weightKg && b.date < days[0]).slice(-1)[0]?.weightKg;
  return {
    start,
    workouts: ws.length,
    minutes: Math.round(ws.reduce((a, w) => a + w.durationSec, 0) / 60),
    volume: ws.reduce((a, w) => a + w.volume, 0),
    prs: ws.reduce((a, w) => a + w.prs.length, 0),
    avgKcal: avg(tot.map((t) => t.kcal)),
    avgProtein: avg(tot.map((t) => t.protein)),
    loggedDays: loggedDays.length,
    avgSteps: avg(days.map((k) => s.daily[k]?.steps ?? 0).filter((x) => x > 0)),
    avgSleep: (() => {
      const sl = days.map((k) => s.daily[k]?.sleepH).filter((x): x is number => !!x);
      return sl.length ? Math.round((sl.reduce((a, b) => a + b, 0) / sl.length) * 10) / 10 : 0;
    })(),
    weightChange: weights.length && prev ? Math.round((weights[weights.length - 1] - prev) * 10) / 10 : null,
  };
}

export function reportSummary(s: Snap, r: ReturnType<typeof weeklyReport>) {
  const t = s.targets;
  const lines: string[] = [];
  lines.push(`You trained ${r.workouts}× for ${r.minutes} min and moved ${Math.round(r.volume / 1000)} tonnes.`);
  if (t && r.avgProtein) lines.push(r.avgProtein >= t.protein * 0.9 ? `Protein was on point (avg ${r.avgProtein} g).` : `Protein averaged ${r.avgProtein} g vs ${t.protein} g target — that's the #1 thing to fix.`);
  if (r.prs) lines.push(`${r.prs} new personal record${r.prs > 1 ? 's' : ''}.`);
  if (r.weightChange !== null) lines.push(`Weight ${r.weightChange >= 0 ? '+' : ''}${r.weightChange} kg.`);
  if (r.avgSleep && r.avgSleep < 7) lines.push(`Sleep averaged ${r.avgSleep} h — more sleep = faster progress.`);
  return lines.join(' ');
}

// ───────────────────────── Offline chat ─────────────────────────

export function localCoachReply(q: string, s: Snap): string {
  const text = q.toLowerCase();
  if (!s.profile || !s.targets) return 'Finish onboarding first and I can coach you properly.';
  const { remaining } = todayTotals(s);
  const rec = recovery(s);
  const nxt = nextWorkout(s);
  const prs = personalRecords(s.workouts);
  const has = (...w: string[]) => w.some((x) => text.includes(x));

  if (has('protein', 'protein')) {
    const meal = suggestMeal(s, remaining.kcal, remaining.protein);
    return remaining.protein > 0
      ? `You have ${remaining.protein} g protein left today (target ${s.targets.protein} g ≈ ${(s.targets.protein / s.profile.weightKg).toFixed(1)} g/kg).${meal ? ` Easiest fix: ${meal.r.name} (${Math.round(meal.n.protein)} g).` : ''} Spread it over 3–5 meals of 25–50 g.`
      : `Protein is done for today — ${Math.abs(remaining.protein)} g over target. 💪`;
  }
  if (has('eat', 'meal', 'food', 'hungry', 'dinner', 'lunch', 'spise', 'mat')) {
    const meal = suggestMeal(s, remaining.kcal, remaining.protein);
    return meal
      ? `With ${remaining.kcal} kcal and ${remaining.protein} g protein left, I'd go for ${meal.r.name}: ${Math.round(meal.n.kcal)} kcal, ${Math.round(meal.n.protein)} g protein. Ready in ${meal.r.minutes} min.`
      : `You have ${remaining.kcal} kcal left. Pick a lean protein + vegetables.`;
  }
  if (has('calorie', 'kcal', 'kalori')) {
    return `Your target is ${s.targets.kcal} kcal (${s.profile.goal === 'build' ? 'small surplus' : s.profile.goal === 'lose' ? 'moderate deficit' : 'maintenance'}). ${remaining.kcal >= 0 ? `${remaining.kcal} kcal left today.` : `${Math.abs(remaining.kcal)} kcal over today.`} I adjust this automatically from your weight trend every few weeks.`;
  }
  if (has('tired', 'sore', 'recover', 'rest', 'sleep', 'sliten', 'søvn')) {
    const low = rec.muscles.filter((m) => m.readiness < 60).map((m) => m.muscle);
    return `Recovery score: ${rec.score}/100 — ${rec.label.toLowerCase()}.${low.length ? ` Still recovering: ${low.join(', ')}.` : ''} If you're unusually tired, drop one set per exercise today and get 8 h of sleep.`;
  }
  if (has('workout', 'train', 'today', 'program', 'trening', 'økt')) {
    if (!nxt) return 'You have no program yet — generate one in Workout → Programs.';
    const t = nxt.template;
    const lines = t.exercises.slice(0, 4).map((e) => {
      const sg = suggestNext(s.workouts, e);
      return `• ${exerciseById(e.exerciseId)?.name}: ${e.sets}×${e.repsMin}–${e.repsMax}${sg.kg ? ` @ ${sg.kg} kg` : ''}`;
    });
    return `${nxt.inDays === 0 ? 'Today' : nxt.inDays === 1 ? 'Tomorrow' : `In ${nxt.inDays} days`}: ${t.name} (~${t.estMinutes} min)\n${lines.join('\n')}`;
  }
  if (has('pr', 'record', 'strong', 'strength', 'rekord')) {
    if (!prs.length) return 'No records yet — log your first workout and I will track every PR.';
    return `Your top lifts (estimated 1RM):\n${prs.slice(0, 4).map((p) => `• ${exerciseById(p.exerciseId)?.name}: ${p.kg} kg × ${p.reps} (≈${Math.round(p.e1rm)} kg)`).join('\n')}`;
  }
  if (has('weight', 'progress', 'fat', 'vekt')) {
    const tr = weightTrend(s);
    return tr
      ? `Your weight is trending ${tr.kgPerWeek >= 0 ? '+' : ''}${tr.kgPerWeek} kg/week. ${s.profile.goal === 'lose' ? 'Ideal fat loss is 0.25–1% of bodyweight per week.' : s.profile.goal === 'build' ? 'For lean gains aim for +0.1–0.3 kg/week.' : 'For maintenance, staying within ±0.2 kg/week is perfect.'}`
      : 'Log your weight 3+ times a week for two weeks and I can read your trend and tune calories.';
  }
  return `Here's today at a glance: ${remaining.kcal} kcal and ${Math.max(0, remaining.protein)} g protein left, recovery ${rec.score}/100${nxt ? `, next up ${nxt.template.name}` : ''}. Ask me about food, protein, training, recovery or your PRs.`;
}
