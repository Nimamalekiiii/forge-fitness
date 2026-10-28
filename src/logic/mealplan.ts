import { RECIPES, Recipe, recipeAllowed, recipeNutrition } from '../data/recipes';
import { Diet, MealType, Targets } from '../types';

export type PlannedMeal = { meal: MealType; recipe: Recipe; servings: number; kcal: number; protein: number; carbs: number; fat: number };

const SLOT_SHARE: Record<MealType, number> = { breakfast: 0.25, lunch: 0.32, dinner: 0.3, snack: 0.13 };

const fits = (r: Recipe, meal: MealType) => {
  if (meal === 'breakfast') return r.tags.includes('Breakfast') || r.tags.includes('Quick');
  if (meal === 'snack') return r.tags.includes('Snack') || r.minutes <= 5;
  return !r.tags.includes('Breakfast') && !r.tags.includes('Snack');
};

/** Builds a one-day plan that lands close to the calorie target. seed rotates the choices. */
export function buildMealPlan(targets: Targets, diet: Diet, seed = 0): PlannedMeal[] {
  const pool = RECIPES.filter((r) => recipeAllowed(r, diet));
  const out: PlannedMeal[] = [];
  const used = new Set<string>();
  (Object.keys(SLOT_SHARE) as MealType[]).forEach((meal, i) => {
    let options = pool.filter((r) => fits(r, meal) && !used.has(r.id));
    if (!options.length) options = pool.filter((r) => !used.has(r.id));
    if (!options.length) options = pool;
    if (!options.length) return;
    const recipe = options[(seed + i) % options.length];
    used.add(recipe.id);
    const n = recipeNutrition(recipe);
    const goal = targets.kcal * SLOT_SHARE[meal];
    const servings = Math.max(0.5, Math.min(2, Math.round((goal / n.kcal) * 4) / 4));
    out.push({
      meal,
      recipe,
      servings,
      kcal: Math.round(n.kcal * servings),
      protein: Math.round(n.protein * servings),
      carbs: Math.round(n.carbs * servings),
      fat: Math.round(n.fat * servings),
    });
  });
  return out;
}
