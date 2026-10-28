import { WorkoutLog, SetLog, PlannedExercise } from '../types';
import { exerciseById } from '../data/exercises';

/** Epley estimated one-rep max */
export const e1rm = (kg: number, reps: number) => (reps <= 0 ? 0 : reps === 1 ? kg : kg * (1 + reps / 30));

export type PR = { exerciseId: string; kg: number; reps: number; e1rm: number; date: string };

/** Best set (by estimated 1RM) per exercise across all logs */
export function personalRecords(logs: WorkoutLog[]): PR[] {
  const best = new Map<string, PR>();
  for (const w of logs) {
    for (const ex of w.exercises) {
      for (const s of ex.sets) {
        if (!s.done || s.kg <= 0) continue;
        const v = e1rm(s.kg, s.reps);
        const cur = best.get(ex.exerciseId);
        if (!cur || v > cur.e1rm) best.set(ex.exerciseId, { exerciseId: ex.exerciseId, kg: s.kg, reps: s.reps, e1rm: v, date: w.startedAt });
      }
    }
  }
  return [...best.values()].sort((a, b) => b.e1rm - a.e1rm);
}

/** Time series of best e1RM per workout for one exercise */
export function strengthSeries(logs: WorkoutLog[], exerciseId: string) {
  return logs
    .map((w) => {
      const ex = w.exercises.find((x) => x.exerciseId === exerciseId);
      if (!ex) return null;
      const top = Math.max(0, ...ex.sets.filter((s) => s.done).map((s) => e1rm(s.kg, s.reps)));
      return top > 0 ? { date: w.startedAt, value: Math.round(top * 10) / 10 } : null;
    })
    .filter((x): x is { date: string; value: number } => !!x)
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function lastPerformance(logs: WorkoutLog[], exerciseId: string): SetLog[] | null {
  const sorted = [...logs].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  for (const w of sorted) {
    const ex = w.exercises.find((x) => x.exerciseId === exerciseId);
    if (ex && ex.sets.some((s) => s.done)) return ex.sets.filter((s) => s.done);
  }
  return null;
}

/**
 * Progressive overload: if every set last time hit the top of the rep range,
 * add the smallest increment. If reps fell below the bottom, keep or drop slightly.
 */
export function suggestNext(logs: WorkoutLog[], plan: PlannedExercise): { kg: number; reps: number; note: string } {
  const last = lastPerformance(logs, plan.exerciseId);
  const ex = exerciseById(plan.exerciseId);
  const inc = ex?.increment ?? 2.5;
  if (!last || last.length === 0) {
    return { kg: 0, reps: plan.repsMin, note: 'First time — pick a weight you could lift ~2 more reps.' };
  }
  const topKg = Math.max(...last.map((s) => s.kg));
  const atTop = last.filter((s) => s.kg === topKg);
  const allMax = atTop.length >= Math.min(plan.sets, last.length) && atTop.every((s) => s.reps >= plan.repsMax);
  const anyLow = atTop.some((s) => s.reps < plan.repsMin);
  if (allMax) return { kg: topKg + inc, reps: plan.repsMin, note: `You hit ${plan.repsMax} reps on every set — go up ${inc} kg.` };
  if (anyLow) return { kg: topKg, reps: plan.repsMin, note: 'Stay at this weight and own the bottom of the range.' };
  const bestReps = Math.max(...atTop.map((s) => s.reps));
  return { kg: topKg, reps: Math.min(plan.repsMax, bestReps + 1), note: 'Same weight — beat last time by one rep.' };
}

export const setVolume = (sets: SetLog[]) => sets.reduce((v, s) => v + (s.done ? s.kg * s.reps : 0), 0);
export const workoutVolume = (w: Pick<WorkoutLog, 'exercises'>) => w.exercises.reduce((v, e) => v + setVolume(e.sets), 0);
