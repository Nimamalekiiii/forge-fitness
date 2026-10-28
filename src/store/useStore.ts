import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import {
  ActiveWorkout,
  BodyLog,
  CoachAdjustment,
  DailyLog,
  DraftMeal,
  GroceryItem,
  MealEntry,
  MealType,
  Profile,
  Program,
  ProgressPhoto,
  Settings,
  Targets,
  WorkoutLog,
  WorkoutTemplate,
} from '../types';
import { computeTargets } from '../logic/nutrition';
import { generateProgram } from '../logic/program';
import { dayKey, uid } from '../logic/date';
import { personalRecords, workoutVolume, e1rm } from '../logic/strength';
import { buildDemoData } from './demo';

export type State = {
  onboarded: boolean;
  profile: Profile | null;
  targets: Targets | null;
  kcalAdjust: number;
  program: Program | null;
  customWorkouts: WorkoutTemplate[];
  workouts: WorkoutLog[];
  active: ActiveWorkout | null;
  meals: MealEntry[];
  draftMeal: DraftMeal | null;
  daily: Record<string, DailyLog>;
  body: BodyLog[];
  photos: ProgressPhoto[];
  groceries: GroceryItem[];
  settings: Settings;
  coachLog: CoachAdjustment[];
  dismissed: Record<string, string[]>; // dayKey -> insight ids

  completeOnboarding: (p: Profile) => void;
  updateProfile: (p: Partial<Profile>) => void;
  regenerateProgram: (overrides?: Partial<Profile>) => void;
  setProgram: (p: Program) => void;

  startWorkout: (t?: WorkoutTemplate) => void;
  updateActive: (fn: (a: ActiveWorkout) => ActiveWorkout) => void;
  finishWorkout: (feeling?: WorkoutLog['feeling']) => WorkoutLog | null;
  discardWorkout: () => void;
  deleteWorkoutLog: (id: string) => void;
  saveCustomWorkout: (t: WorkoutTemplate) => void;
  deleteCustomWorkout: (id: string) => void;

  setDraftMeal: (m: DraftMeal | null) => void;
  addMeal: (m: DraftMeal, meal: MealType, date?: string) => void;
  removeMeal: (id: string) => void;

  addWater: (ml: number, date?: string) => void;
  setSteps: (steps: number, date?: string) => void;
  setSleep: (h: number, date?: string) => void;
  setEnergy: (e: DailyLog['energy'], date?: string) => void;

  addBodyLog: (b: BodyLog) => void;
  addPhoto: (uri: string, pose: ProgressPhoto['pose']) => void;
  removePhoto: (id: string) => void;

  addGrocery: (name: string, emoji?: string) => void;
  toggleGrocery: (id: string) => void;
  clearGroceries: (onlyDone?: boolean) => void;

  updateSettings: (fn: (s: Settings) => Settings) => void;
  applyCoachAdjustment: (kcalDelta: number, message: string) => void;
  dismissInsight: (id: string) => void;

  loadDemoData: () => void;
  resetAll: () => void;
};

const defaultSettings: Settings = {
  notifications: { workout: true, meals: true, water: true, weeklyReport: true },
  ai: { proactive: true, tone: 'supportive', autoAdjustTargets: true, serverUrl: '' },
};

const initial = {
  onboarded: false,
  profile: null,
  targets: null,
  kcalAdjust: 0,
  program: null,
  customWorkouts: [],
  workouts: [],
  active: null,
  meals: [],
  draftMeal: null,
  daily: {},
  body: [],
  photos: [],
  groceries: [],
  settings: defaultSettings,
  coachLog: [],
  dismissed: {},
};

const emptyDay: DailyLog = { waterMl: 0, steps: 0 };

export const useStore = create<State>()(
  persist(
    (set, get) => ({
      ...initial,

      completeOnboarding: (profile) =>
        set({
          onboarded: true,
          profile,
          targets: computeTargets(profile),
          kcalAdjust: 0,
          program: generateProgram(profile),
          body: [{ date: dayKey(), weightKg: profile.weightKg }],
        }),

      updateProfile: (patch) => {
        const cur = get().profile;
        if (!cur) return;
        const profile = { ...cur, ...patch };
        set({ profile, targets: computeTargets(profile, get().kcalAdjust) });
      },

      regenerateProgram: (overrides) => {
        const cur = get().profile;
        if (!cur) return;
        set({ program: generateProgram({ ...cur, ...overrides }) });
      },

      setProgram: (program) => set({ program }),

      startWorkout: (t) => {
        const now = new Date().toISOString();
        set({
          active: {
            templateId: t?.id,
            name: t?.name ?? 'Quick Workout',
            startedAt: now,
            currentIndex: 0,
            exercises: (t?.exercises ?? []).map((pe) => {
              const prev = lastSetsFor(get().workouts, pe.exerciseId);
              return {
                exerciseId: pe.exerciseId,
                target: pe,
                sets: Array.from({ length: pe.sets }, (_, i) => ({
                  kg: prev?.[i]?.kg ?? prev?.[0]?.kg ?? 0,
                  reps: pe.repsMin,
                  done: false,
                })),
              };
            }),
          },
        });
      },

      updateActive: (fn) => {
        const a = get().active;
        if (a) set({ active: fn(a) });
      },

      finishWorkout: (feeling) => {
        const a = get().active;
        if (!a) return null;
        const before = personalRecords(get().workouts);
        const exercises = a.exercises
          .map((e) => ({ exerciseId: e.exerciseId, sets: e.sets.filter((s) => s.done) }))
          .filter((e) => e.sets.length > 0);
        const prs: string[] = [];
        for (const ex of exercises) {
          const best = Math.max(...ex.sets.map((s) => e1rm(s.kg, s.reps)));
          const old = before.find((p) => p.exerciseId === ex.exerciseId);
          if (best > 0 && (!old || best > old.e1rm + 0.01)) prs.push(ex.exerciseId);
        }
        const log: WorkoutLog = {
          id: uid(),
          templateId: a.templateId,
          name: a.name,
          startedAt: a.startedAt,
          durationSec: Math.round((Date.now() - new Date(a.startedAt).getTime()) / 1000),
          exercises,
          volume: Math.round(workoutVolume({ exercises })),
          prs,
          feeling,
        };
        set({ workouts: [...get().workouts, log], active: null });
        return log;
      },

      discardWorkout: () => set({ active: null }),
      deleteWorkoutLog: (id) => set({ workouts: get().workouts.filter((w) => w.id !== id) }),
      saveCustomWorkout: (t) =>
        set({ customWorkouts: [...get().customWorkouts.filter((x) => x.id !== t.id), t] }),
      deleteCustomWorkout: (id) => set({ customWorkouts: get().customWorkouts.filter((x) => x.id !== id) }),

      setDraftMeal: (draftMeal) => set({ draftMeal }),
      addMeal: (m, meal, date = dayKey()) => {
        const { confidence: _c, demo: _d, ...rest } = m;
        const entry: MealEntry = { ...rest, meal, id: uid(), date, createdAt: new Date().toISOString() };
        set({ meals: [...get().meals, entry], draftMeal: null });
      },
      removeMeal: (id) => set({ meals: get().meals.filter((m) => m.id !== id) }),

      addWater: (ml, date = dayKey()) => {
        const d = get().daily[date] ?? emptyDay;
        set({ daily: { ...get().daily, [date]: { ...d, waterMl: Math.max(0, d.waterMl + ml) } } });
      },
      setSteps: (steps, date = dayKey()) => {
        const d = get().daily[date] ?? emptyDay;
        set({ daily: { ...get().daily, [date]: { ...d, steps } } });
      },
      setSleep: (sleepH, date = dayKey()) => {
        const d = get().daily[date] ?? emptyDay;
        set({ daily: { ...get().daily, [date]: { ...d, sleepH } } });
      },
      setEnergy: (energy, date = dayKey()) => {
        const d = get().daily[date] ?? emptyDay;
        set({ daily: { ...get().daily, [date]: { ...d, energy } } });
      },

      addBodyLog: (b) => {
        const others = get().body.filter((x) => x.date !== b.date);
        const existing = get().body.find((x) => x.date === b.date);
        const merged = { ...existing, ...b };
        const body = [...others, merged].sort((a, c) => a.date.localeCompare(c.date));
        const patch: Partial<State> = { body };
        const prof = get().profile;
        if (b.weightKg && prof && b.date >= (body[body.length - 1]?.date ?? '')) {
          const profile = { ...prof, weightKg: b.weightKg };
          patch.profile = profile;
          patch.targets = computeTargets(profile, get().kcalAdjust);
        }
        set(patch);
      },
      addPhoto: (uri, pose) => set({ photos: [...get().photos, { id: uid(), uri, pose, date: dayKey() }] }),
      removePhoto: (id) => set({ photos: get().photos.filter((p) => p.id !== id) }),

      addGrocery: (name, emoji) => {
        if (get().groceries.some((g) => g.name.toLowerCase() === name.toLowerCase() && !g.done)) return;
        set({ groceries: [...get().groceries, { id: uid(), name, emoji, done: false }] });
      },
      toggleGrocery: (id) =>
        set({ groceries: get().groceries.map((g) => (g.id === id ? { ...g, done: !g.done } : g)) }),
      clearGroceries: (onlyDone = true) =>
        set({ groceries: onlyDone ? get().groceries.filter((g) => !g.done) : [] }),

      updateSettings: (fn) => set({ settings: fn(get().settings) }),

      applyCoachAdjustment: (kcalDelta, message) => {
        const prof = get().profile;
        if (!prof) return;
        const kcalAdjust = get().kcalAdjust + kcalDelta;
        set({
          kcalAdjust,
          targets: computeTargets(prof, kcalAdjust),
          coachLog: [...get().coachLog, { date: dayKey(), message, kcalDelta }],
        });
      },

      dismissInsight: (id) => {
        const k = dayKey();
        const list = get().dismissed[k] ?? [];
        set({ dismissed: { [k]: [...list, id] } });
      },

      loadDemoData: () => {
        const prof = get().profile;
        if (!prof) return;
        const demo = buildDemoData(prof, get().program);
        set({ ...demo, targets: computeTargets({ ...prof, weightKg: demo.profile.weightKg }, get().kcalAdjust) });
      },

      resetAll: () => set({ ...initial }),
    }),
    {
      name: 'forge-store-v1',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (s) => {
        const { draftMeal: _d, ...rest } = s;
        return rest;
      },
    }
  )
);

function lastSetsFor(logs: WorkoutLog[], exerciseId: string) {
  for (let i = logs.length - 1; i >= 0; i--) {
    const ex = logs[i].exercises.find((e) => e.exerciseId === exerciseId);
    if (ex && ex.sets.length) return ex.sets;
  }
  return null;
}

export function useHydrated() {
  const [h, setH] = useState(useStore.persist.hasHydrated());
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setH(true));
    setH(useStore.persist.hasHydrated());
    return unsub;
  }, []);
  return h;
}

export const useToday = () => {
  const key = dayKey();
  const daily = useStore((s) => s.daily[key]) ?? emptyDay;
  return { key, daily };
};
