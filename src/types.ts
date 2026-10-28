export type Goal = 'build' | 'lose' | 'maintain';
export type Experience = 'beginner' | 'intermediate' | 'advanced';
export type ActivityLevel = 'sedentary' | 'light' | 'moderate' | 'active' | 'very';
export type EquipmentSetup = 'gym' | 'home' | 'dumbbells' | 'bodyweight';
export type Diet = 'none' | 'vegetarian' | 'vegan' | 'pescatarian' | 'keto';
export type Units = 'metric' | 'imperial';
export type Sex = 'male' | 'female';
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

export type Profile = {
  name: string;
  sex: Sex;
  age: number;
  heightCm: number;
  weightKg: number;
  targetWeightKg: number;
  goal: Goal;
  experience: Experience;
  daysPerWeek: number;
  sessionMinutes: number;
  activity: ActivityLevel;
  equipment: EquipmentSetup;
  diet: Diet;
  units: Units;
};

export type Targets = {
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  waterMl: number;
  steps: number;
};

export type PlannedExercise = {
  exerciseId: string;
  sets: number;
  repsMin: number;
  repsMax: number;
  restSec: number;
};

export type WorkoutTemplate = {
  id: string;
  name: string;
  focus: string;
  /** 0 = Monday … 6 = Sunday; null for custom workouts not on the schedule */
  weekday: number | null;
  exercises: PlannedExercise[];
  estMinutes: number;
};

export type Program = {
  id: string;
  name: string;
  description: string;
  weeks: number;
  startedAt: string;
  days: WorkoutTemplate[];
};

export type SetLog = { kg: number; reps: number; done: boolean; rpe?: number };

export type ExerciseLog = { exerciseId: string; sets: SetLog[] };

export type WorkoutLog = {
  id: string;
  templateId?: string;
  name: string;
  startedAt: string;
  durationSec: number;
  exercises: ExerciseLog[];
  volume: number;
  prs: string[];
  feeling?: 1 | 2 | 3 | 4 | 5;
};

export type ActiveWorkout = {
  templateId?: string;
  name: string;
  startedAt: string;
  exercises: (ExerciseLog & { target?: PlannedExercise })[];
  currentIndex: number;
};

export type FoodItem = {
  name: string;
  emoji?: string;
  grams?: number;
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
};

export type MealEntry = {
  id: string;
  date: string; // yyyy-mm-dd
  meal: MealType;
  name: string;
  emoji: string;
  photoUri?: string;
  items: FoodItem[];
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  source: 'db' | 'scan' | 'recipe' | 'custom';
  createdAt: string;
};

export type BodyLog = {
  date: string;
  weightKg?: number;
  bodyFat?: number;
  muscleKg?: number;
  waistCm?: number;
  chestCm?: number;
  armCm?: number;
  thighCm?: number;
};

export type ProgressPhoto = { id: string; date: string; uri: string; pose: 'front' | 'side' | 'back' };

export type DailyLog = { waterMl: number; steps: number; sleepH?: number; energy?: 1 | 2 | 3 | 4 | 5 };

export type GroceryItem = { id: string; name: string; emoji?: string; done: boolean };

export type Settings = {
  notifications: { workout: boolean; meals: boolean; water: boolean; weeklyReport: boolean };
  ai: { proactive: boolean; tone: 'supportive' | 'direct'; autoAdjustTargets: boolean; serverUrl: string };
};

export type CoachAdjustment = { date: string; message: string; kcalDelta: number };

/** A meal waiting to be confirmed on the Meal Details screen */
export type DraftMeal = Omit<MealEntry, 'id' | 'createdAt' | 'date'> & { confidence?: number; demo?: boolean };
