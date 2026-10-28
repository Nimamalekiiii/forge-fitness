export type Muscle =
  | 'Chest'
  | 'Back'
  | 'Shoulders'
  | 'Biceps'
  | 'Triceps'
  | 'Quads'
  | 'Hamstrings'
  | 'Glutes'
  | 'Calves'
  | 'Core';

export type Equipment = 'Barbell' | 'Dumbbell' | 'Cable' | 'Machine' | 'Bodyweight' | 'Kettlebell' | 'Band';

export type Exercise = {
  id: string;
  name: string;
  muscle: Muscle;
  secondary: Muscle[];
  equipment: Equipment;
  compound: boolean;
  /** smallest sensible weight jump in kg */
  increment: number;
  cues: string[];
};

export const MUSCLES: Muscle[] = [
  'Chest',
  'Back',
  'Shoulders',
  'Biceps',
  'Triceps',
  'Quads',
  'Hamstrings',
  'Glutes',
  'Calves',
  'Core',
];

const e = (
  id: string,
  name: string,
  muscle: Muscle,
  equipment: Equipment,
  compound: boolean,
  secondary: Muscle[] = [],
  cues: string[] = [],
  increment = equipment === 'Barbell' ? 2.5 : equipment === 'Dumbbell' ? 2 : 2.5
): Exercise => ({ id, name, muscle, equipment, compound, secondary, cues, increment });

export const EXERCISES: Exercise[] = [
  // Chest
  e('bench-press', 'Bench Press', 'Chest', 'Barbell', true, ['Triceps', 'Shoulders'], [
    'Shoulder blades pinched and down',
    'Bar to lower chest, elbows ~45°',
    'Drive feet into the floor',
  ]),
  e('incline-db-press', 'Incline Dumbbell Press', 'Chest', 'Dumbbell', true, ['Shoulders', 'Triceps'], [
    'Bench at 30–45°',
    'Lower slowly to upper chest',
    'Press up and slightly in',
  ]),
  e('db-bench', 'Dumbbell Bench Press', 'Chest', 'Dumbbell', true, ['Triceps', 'Shoulders']),
  e('chest-fly-cable', 'Chest Fly (Cable)', 'Chest', 'Cable', false, [], ['Soft elbows', 'Squeeze at the middle']),
  e('machine-chest-press', 'Machine Chest Press', 'Chest', 'Machine', true, ['Triceps']),
  e('push-up', 'Push Up', 'Chest', 'Bodyweight', true, ['Triceps', 'Core'], ['Body in a straight line', 'Chest to fist height']),
  e('dips', 'Dips', 'Chest', 'Bodyweight', true, ['Triceps', 'Shoulders']),
  // Back
  e('deadlift', 'Deadlift', 'Back', 'Barbell', true, ['Hamstrings', 'Glutes'], [
    'Bar over mid-foot',
    'Brace hard, neutral spine',
    'Push the floor away',
  ], 5),
  e('pull-up', 'Pull Up', 'Back', 'Bodyweight', true, ['Biceps'], ['Full hang at the bottom', 'Chest to the bar']),
  e('lat-pulldown', 'Lat Pulldown', 'Back', 'Cable', true, ['Biceps']),
  e('barbell-row', 'Barbell Row', 'Back', 'Barbell', true, ['Biceps']),
  e('db-row', 'One-Arm Dumbbell Row', 'Back', 'Dumbbell', true, ['Biceps']),
  e('seated-cable-row', 'Seated Cable Row', 'Back', 'Cable', true, ['Biceps']),
  e('face-pull', 'Face Pull', 'Shoulders', 'Cable', false, ['Back']),
  e('band-row', 'Band Row', 'Back', 'Band', true, ['Biceps']),
  e('inverted-row', 'Inverted Row', 'Back', 'Bodyweight', true, ['Biceps'], ['Body straight like a plank', 'Pull chest to the bar']),
  e('chin-up', 'Chin Up', 'Back', 'Bodyweight', true, ['Biceps'], ['Palms facing you', 'Full range every rep']),
  // Shoulders
  e('ohp', 'Overhead Press', 'Shoulders', 'Barbell', true, ['Triceps'], ['Glutes tight', 'Head through at the top']),
  e('db-shoulder-press', 'Dumbbell Shoulder Press', 'Shoulders', 'Dumbbell', true, ['Triceps']),
  e('lateral-raise', 'Lateral Raise', 'Shoulders', 'Dumbbell', false, [], ['Lead with the elbows', 'Stop at shoulder height'], 1),
  e('rear-delt-fly', 'Rear Delt Fly', 'Shoulders', 'Dumbbell', false, ['Back'], [], 1),
  e('pike-push-up', 'Pike Push Up', 'Shoulders', 'Bodyweight', true, ['Triceps']),
  // Arms
  e('barbell-curl', 'Barbell Curl', 'Biceps', 'Barbell', false),
  e('db-curl', 'Dumbbell Curl', 'Biceps', 'Dumbbell', false, [], [], 1),
  e('hammer-curl', 'Hammer Curl', 'Biceps', 'Dumbbell', false, [], [], 1),
  e('tricep-pushdown', 'Tricep Pushdown', 'Triceps', 'Cable', false),
  e('skull-crusher', 'Skull Crusher', 'Triceps', 'Barbell', false),
  e('overhead-tricep-ext', 'Overhead Tricep Extension', 'Triceps', 'Dumbbell', false, [], [], 1),
  e('diamond-push-up', 'Diamond Push Up', 'Triceps', 'Bodyweight', true, ['Chest']),
  // Legs
  e('squat', 'Back Squat', 'Quads', 'Barbell', true, ['Glutes', 'Hamstrings'], [
    'Brace before you descend',
    'Knees track over toes',
    'Hips and chest rise together',
  ]),
  e('leg-press', 'Leg Press', 'Quads', 'Machine', true, ['Glutes'], [], 5),
  e('goblet-squat', 'Goblet Squat', 'Quads', 'Dumbbell', true, ['Glutes']),
  e('bulgarian-split-squat', 'Bulgarian Split Squat', 'Quads', 'Dumbbell', true, ['Glutes']),
  e('leg-extension', 'Leg Extension', 'Quads', 'Machine', false),
  e('rdl', 'Romanian Deadlift', 'Hamstrings', 'Barbell', true, ['Glutes', 'Back'], ['Push hips back', 'Bar close to legs']),
  e('db-rdl', 'Dumbbell RDL', 'Hamstrings', 'Dumbbell', true, ['Glutes']),
  e('leg-curl', 'Leg Curl', 'Hamstrings', 'Machine', false),
  e('hip-thrust', 'Hip Thrust', 'Glutes', 'Barbell', true, ['Hamstrings'], [], 5),
  e('walking-lunge', 'Walking Lunge', 'Glutes', 'Dumbbell', true, ['Quads']),
  e('bodyweight-squat', 'Bodyweight Squat', 'Quads', 'Bodyweight', true, ['Glutes']),
  e('glute-bridge', 'Glute Bridge', 'Glutes', 'Bodyweight', false, ['Hamstrings']),
  e('reverse-lunge', 'Reverse Lunge', 'Glutes', 'Bodyweight', true, ['Quads']),
  e('split-squat-bw', 'Split Squat (Bodyweight)', 'Quads', 'Bodyweight', true, ['Glutes']),
  e('nordic-curl', 'Nordic Hamstring Curl', 'Hamstrings', 'Bodyweight', false, [], ['Lower as slowly as you can', 'Push back up with your hands']),
  e('single-leg-calf-raise', 'Single-Leg Calf Raise', 'Calves', 'Bodyweight', false),
  e('calf-raise', 'Standing Calf Raise', 'Calves', 'Machine', false),
  e('kb-swing', 'Kettlebell Swing', 'Glutes', 'Kettlebell', true, ['Hamstrings', 'Core'], [], 4),
  // Core
  e('plank', 'Plank', 'Core', 'Bodyweight', false),
  e('hanging-leg-raise', 'Hanging Leg Raise', 'Core', 'Bodyweight', false),
  e('cable-crunch', 'Cable Crunch', 'Core', 'Cable', false),
];

export const exerciseById = (id: string) => EXERCISES.find((x) => x.id === id);

export const MUSCLE_ICON: Record<Muscle, string> = {
  Chest: 'fitness',
  Back: 'git-pull-request',
  Shoulders: 'triangle',
  Biceps: 'barbell',
  Triceps: 'barbell-outline',
  Quads: 'walk',
  Hamstrings: 'walk-outline',
  Glutes: 'body',
  Calves: 'footsteps',
  Core: 'shield',
};
