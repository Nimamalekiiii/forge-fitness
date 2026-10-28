import { EXERCISES, Equipment, exerciseById } from '../data/exercises';
import { Profile, Program, WorkoutTemplate, PlannedExercise, EquipmentSetup } from '../types';
import { uid } from './date';

const AVAILABLE: Record<EquipmentSetup, Equipment[]> = {
  gym: ['Barbell', 'Dumbbell', 'Cable', 'Machine', 'Bodyweight', 'Kettlebell', 'Band'],
  home: ['Barbell', 'Dumbbell', 'Bodyweight', 'Kettlebell', 'Band'],
  dumbbells: ['Dumbbell', 'Bodyweight', 'Band'],
  bodyweight: ['Bodyweight', 'Band'],
};

/** Movement slots, each with exercises in order of preference */
const SLOTS: Record<string, string[]> = {
  chestMain: ['bench-press', 'db-bench', 'push-up'],
  chestIncline: ['incline-db-press', 'machine-chest-press', 'diamond-push-up', 'push-up'],
  chestIso: ['chest-fly-cable', 'dips', 'push-up'],
  shoulderPress: ['ohp', 'db-shoulder-press', 'pike-push-up'],
  lateral: ['lateral-raise', 'face-pull', 'pike-push-up'],
  rearDelt: ['face-pull', 'rear-delt-fly', 'band-row'],
  triceps: ['tricep-pushdown', 'skull-crusher', 'overhead-tricep-ext', 'diamond-push-up'],
  triceps2: ['overhead-tricep-ext', 'skull-crusher', 'dips', 'diamond-push-up'],
  vertPull: ['pull-up', 'lat-pulldown', 'chin-up', 'band-row'],
  vertPull2: ['lat-pulldown', 'chin-up', 'pull-up', 'inverted-row'],
  horzPull: ['barbell-row', 'seated-cable-row', 'db-row', 'inverted-row', 'band-row'],
  horzPull2: ['seated-cable-row', 'db-row', 'band-row', 'inverted-row'],
  hinge: ['deadlift', 'rdl', 'db-rdl', 'kb-swing', 'glute-bridge'],
  hamIso: ['leg-curl', 'db-rdl', 'nordic-curl', 'glute-bridge'],
  biceps: ['barbell-curl', 'db-curl', 'chin-up'],
  biceps2: ['hammer-curl', 'db-curl'],
  squat: ['squat', 'leg-press', 'goblet-squat', 'bodyweight-squat'],
  quadAcc: ['bulgarian-split-squat', 'leg-press', 'walking-lunge', 'split-squat-bw'],
  quadIso: ['leg-extension', 'walking-lunge', 'bulgarian-split-squat', 'reverse-lunge'],
  glute: ['hip-thrust', 'walking-lunge', 'reverse-lunge', 'glute-bridge'],
  calves: ['calf-raise', 'single-leg-calf-raise'],
  chestMain2: ['db-bench', 'machine-chest-press', 'bench-press', 'push-up'],
  shoulderPress2: ['db-shoulder-press', 'ohp', 'pike-push-up'],
  hinge2: ['rdl', 'db-rdl', 'kb-swing', 'nordic-curl', 'glute-bridge'],
  squat2: ['leg-press', 'goblet-squat', 'squat', 'split-squat-bw'],
  core: ['hanging-leg-raise', 'cable-crunch', 'plank'],
};

type DayDef = { name: string; focus: string; slots: string[] };

const PUSH: DayDef = { name: 'Push', focus: 'Chest • Shoulders • Triceps', slots: ['chestMain', 'chestIncline', 'shoulderPress', 'lateral', 'chestIso', 'triceps', 'triceps2'] };
const PULL: DayDef = { name: 'Pull', focus: 'Back • Biceps • Rear delts', slots: ['vertPull', 'horzPull', 'horzPull2', 'rearDelt', 'biceps', 'biceps2', 'core'] };
const LEGS: DayDef = { name: 'Legs', focus: 'Quads • Hamstrings • Glutes', slots: ['squat', 'hinge', 'quadAcc', 'hamIso', 'glute', 'calves', 'core'] };
const UPPER: DayDef = { name: 'Upper Body', focus: 'Chest • Back • Shoulders • Arms', slots: ['chestMain', 'horzPull', 'shoulderPress', 'vertPull', 'lateral', 'triceps', 'biceps'] };
const LOWER: DayDef = { name: 'Lower Body', focus: 'Quads • Hamstrings • Glutes • Core', slots: ['squat', 'hinge', 'quadAcc', 'glute', 'calves', 'core'] };
const UPPER_B: DayDef = { name: 'Upper Body B', focus: 'Incline • Rows • Arms', slots: ['chestIncline', 'vertPull2', 'shoulderPress2', 'horzPull2', 'rearDelt', 'triceps2', 'biceps2'] };
const LOWER_B: DayDef = { name: 'Lower Body B', focus: 'Hinge • Single-leg • Core', slots: ['hinge2', 'squat2', 'quadIso', 'hamIso', 'calves', 'core'] };
const PUSH_B: DayDef = { name: 'Push B', focus: 'Shoulders • Upper chest • Triceps', slots: ['shoulderPress', 'chestIncline', 'chestMain2', 'lateral', 'triceps2', 'triceps'] };
const PULL_B: DayDef = { name: 'Pull B', focus: 'Lats • Upper back • Biceps', slots: ['vertPull2', 'horzPull2', 'hinge2', 'rearDelt', 'biceps2', 'biceps'] };
const LEGS_B: DayDef = { name: 'Legs B', focus: 'Glutes • Hamstrings • Quads', slots: ['hinge2', 'squat2', 'glute', 'quadIso', 'hamIso', 'calves'] };
const FULL_A: DayDef = { name: 'Full Body A', focus: 'Squat • Press • Row', slots: ['squat', 'chestMain', 'horzPull', 'lateral', 'hamIso', 'core'] };
const FULL_B: DayDef = { name: 'Full Body B', focus: 'Hinge • Overhead • Pull', slots: ['hinge', 'shoulderPress', 'vertPull', 'quadAcc', 'triceps', 'biceps'] };
const FULL_C: DayDef = { name: 'Full Body C', focus: 'Legs • Incline • Row', slots: ['quadAcc', 'chestIncline', 'horzPull2', 'glute', 'rearDelt', 'core'] };

function split(days: number, exp: Profile['experience']): { defs: DayDef[]; weekdays: number[]; name: string } {
  switch (days) {
    case 2:
      return { defs: [FULL_A, FULL_B], weekdays: [0, 3], name: 'Full Body 2×' };
    case 3:
      return exp === 'beginner'
        ? { defs: [FULL_A, FULL_B, FULL_C], weekdays: [0, 2, 4], name: 'Full Body Foundation' }
        : { defs: [PUSH, PULL, LEGS], weekdays: [0, 2, 4], name: 'Push Pull Legs' };
    case 4:
      return { defs: [UPPER, LOWER, UPPER_B, LOWER_B], weekdays: [0, 1, 3, 4], name: 'Upper / Lower' };
    case 5:
      return { defs: [PUSH, PULL, LEGS, UPPER, LOWER], weekdays: [0, 1, 2, 4, 5], name: 'PPL + Upper/Lower' };
    default:
      return {
        defs: [PUSH, PULL, LEGS, PUSH_B, PULL_B, LEGS_B],
        weekdays: [0, 1, 2, 3, 4, 5],
        name: 'Push Pull Legs 6×',
      };
  }
}

function prescription(p: Profile, exerciseId: string): Omit<PlannedExercise, 'exerciseId'> {
  const ex = exerciseById(exerciseId);
  const compound = ex?.compound ?? false;
  const sets = p.experience === 'beginner' ? 3 : p.experience === 'advanced' ? 4 : compound ? 4 : 3;
  if (ex?.id === 'plank') return { sets: 3, repsMin: 30, repsMax: 60, restSec: 60 };
  if (compound) {
    if (p.goal === 'build') return { sets, repsMin: 6, repsMax: 10, restSec: 150 };
    if (p.goal === 'lose') return { sets, repsMin: 8, repsMax: 12, restSec: 90 };
    return { sets, repsMin: 6, repsMax: 12, restSec: 120 };
  }
  return { sets: 3, repsMin: 10, repsMax: 15, restSec: 75 };
}

export function buildTemplate(p: Profile, def: DayDef, weekday: number | null): WorkoutTemplate {
  const allowed = AVAILABLE[p.equipment];
  const count = Math.max(4, Math.min(def.slots.length, Math.round(p.sessionMinutes / 9)));
  const used = new Set<string>();
  const exercises: PlannedExercise[] = [];
  for (const slot of def.slots) {
    if (exercises.length >= count) break;
    const choice = SLOTS[slot].find((id) => {
      const ex = exerciseById(id);
      return ex && allowed.includes(ex.equipment) && !used.has(id);
    });
    if (!choice) continue;
    used.add(choice);
    exercises.push({ exerciseId: choice, ...prescription(p, choice) });
  }
  const estMinutes = Math.round(
    exercises.reduce((m, e) => m + e.sets * (45 + e.restSec), 0) / 60 + 5
  );
  return { id: uid(), name: def.name, focus: def.focus, weekday, exercises, estMinutes };
}

export function generateProgram(p: Profile): Program {
  const days = Math.max(2, Math.min(6, p.daysPerWeek));
  const s = split(days, p.experience);
  const goalLabel = p.goal === 'build' ? 'muscle gain' : p.goal === 'lose' ? 'fat loss' : 'strength & maintenance';
  return {
    id: uid(),
    name: s.name,
    description: `${days} days/week • built for ${goalLabel} • ${p.experience} level`,
    weeks: 8,
    startedAt: new Date().toISOString(),
    days: s.defs.map((d, i) => buildTemplate(p, d, s.weekdays[i])),
  };
}

/** Suggests an alternative exercise for the same muscle with the user's equipment. */
export function swapOptions(exerciseId: string, equipment: EquipmentSetup) {
  const ex = exerciseById(exerciseId);
  if (!ex) return [];
  return EXERCISES.filter((x) => x.id !== ex.id && x.muscle === ex.muscle && AVAILABLE[equipment].includes(x.equipment));
}

export const PROGRAM_LIBRARY: { key: string; title: string; subtitle: string; days: number; goal: Profile['goal'] }[] = [
  { key: 'fb3', title: 'Full Body Foundation', subtitle: '3 days • Beginner • 8 weeks', days: 3, goal: 'build' },
  { key: 'ppl', title: 'Push Pull Legs', subtitle: '3–6 days • Hypertrophy', days: 3, goal: 'build' },
  { key: 'ul', title: 'Upper / Lower', subtitle: '4 days • Strength + size', days: 4, goal: 'maintain' },
  { key: 'cut', title: 'Lean Cut', subtitle: '4 days • Fat loss • Higher reps', days: 4, goal: 'lose' },
  { key: 'ppl6', title: 'PPL 6× Advanced', subtitle: '6 days • High volume', days: 6, goal: 'build' },
];
