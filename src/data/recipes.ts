import { FOODS, scaleFood, allowedForDiet } from './foods';

export type Recipe = {
  id: string;
  name: string;
  emoji: string;
  minutes: number;
  tags: string[];
  /** food id + grams */
  ingredients: { foodId: string; grams: number }[];
  steps: string[];
};

export const RECIPES: Recipe[] = [
  {
    id: 'chicken-rice-broccoli',
    name: 'Chicken, Rice & Broccoli',
    emoji: '🍗',
    minutes: 25,
    tags: ['High protein', 'Meal prep'],
    ingredients: [
      { foodId: 'chicken-breast', grams: 200 },
      { foodId: 'rice-cooked', grams: 150 },
      { foodId: 'broccoli', grams: 100 },
    ],
    steps: ['Season and pan-fry the chicken 6–7 min per side.', 'Cook rice.', 'Steam broccoli 4 min.', 'Slice chicken and serve.'],
  },
  {
    id: 'protein-oats',
    name: 'Protein Oats',
    emoji: '🥣',
    minutes: 5,
    tags: ['Breakfast', 'Quick'],
    ingredients: [
      { foodId: 'oats', grams: 60 },
      { foodId: 'whey', grams: 30 },
      { foodId: 'milk', grams: 200 },
      { foodId: 'blueberries', grams: 80 },
    ],
    steps: ['Cook oats in milk 3 min.', 'Stir in whey off the heat.', 'Top with berries.'],
  },
  {
    id: 'salmon-veggies',
    name: 'Salmon & Veggies',
    emoji: '🐟',
    minutes: 20,
    tags: ['Omega-3', 'Low carb'],
    ingredients: [
      { foodId: 'salmon', grams: 150 },
      { foodId: 'mixed-veg', grams: 200 },
      { foodId: 'potato', grams: 150 },
    ],
    steps: ['Bake salmon at 200°C for 12–14 min.', 'Roast vegetables alongside.', 'Boil potatoes 15 min.'],
  },
  {
    id: 'skyr-bowl',
    name: 'Skyr Berry Bowl',
    emoji: '🫐',
    minutes: 3,
    tags: ['Snack', 'High protein'],
    ingredients: [
      { foodId: 'skyr', grams: 250 },
      { foodId: 'blueberries', grams: 100 },
      { foodId: 'granola', grams: 30 },
    ],
    steps: ['Spoon skyr into a bowl.', 'Top with berries and granola.'],
  },
  {
    id: 'beef-pasta',
    name: 'Lean Beef Pasta',
    emoji: '🍝',
    minutes: 20,
    tags: ['Bulking', 'Post-workout'],
    ingredients: [
      { foodId: 'ground-beef', grams: 150 },
      { foodId: 'pasta-cooked', grams: 220 },
      { foodId: 'spinach', grams: 50 },
    ],
    steps: ['Brown the beef.', 'Add spinach until wilted.', 'Toss with pasta.'],
  },
  {
    id: 'tofu-stirfry',
    name: 'Tofu Quinoa Stir-fry',
    emoji: '🥢',
    minutes: 20,
    tags: ['Vegan', 'High protein'],
    ingredients: [
      { foodId: 'tofu', grams: 200 },
      { foodId: 'quinoa', grams: 150 },
      { foodId: 'mixed-veg', grams: 150 },
      { foodId: 'olive-oil', grams: 5 },
    ],
    steps: ['Press and cube tofu.', 'Stir-fry until golden.', 'Add veg, then quinoa.'],
  },
  {
    id: 'egg-wrap',
    name: 'Egg & Turkey Wrap',
    emoji: '🌯',
    minutes: 10,
    tags: ['Breakfast', 'On the go'],
    ingredients: [
      { foodId: 'tortilla', grams: 60 },
      { foodId: 'egg', grams: 100 },
      { foodId: 'turkey', grams: 60 },
      { foodId: 'spinach', grams: 30 },
    ],
    steps: ['Scramble the eggs.', 'Fill wrap with eggs, turkey and spinach.', 'Roll tight.'],
  },
  {
    id: 'lentil-bowl',
    name: 'Lentil Power Bowl',
    emoji: '🍲',
    minutes: 15,
    tags: ['Vegan', 'Fiber'],
    ingredients: [
      { foodId: 'lentils', grams: 200 },
      { foodId: 'sweet-potato', grams: 150 },
      { foodId: 'avocado', grams: 70 },
      { foodId: 'spinach', grams: 40 },
    ],
    steps: ['Roast sweet potato cubes 20 min.', 'Warm lentils.', 'Assemble with avocado and spinach.'],
  },
  {
    id: 'pb-banana-oats',
    name: 'Peanut Butter Banana Oats',
    emoji: '🥜',
    minutes: 5,
    tags: ['Breakfast', 'Vegan'],
    ingredients: [
      { foodId: 'oats', grams: 70 },
      { foodId: 'banana', grams: 120 },
      { foodId: 'peanut-butter', grams: 20 },
      { foodId: 'blueberries', grams: 60 },
    ],
    steps: ['Cook oats in water 3 min.', 'Top with sliced banana, peanut butter and berries.'],
  },
  {
    id: 'apple-almonds',
    name: 'Apple & Almonds',
    emoji: '🍎',
    minutes: 1,
    tags: ['Snack', 'Vegan'],
    ingredients: [
      { foodId: 'apple', grams: 180 },
      { foodId: 'almonds', grams: 25 },
    ],
    steps: ['Slice the apple and enjoy with almonds.'],
  },
  {
    id: 'cottage-wrap',
    name: 'Tuna Cottage Wrap',
    emoji: '🌯',
    minutes: 5,
    tags: ['High protein', 'On the go'],
    ingredients: [
      { foodId: 'tortilla', grams: 60 },
      { foodId: 'tuna', grams: 120 },
      { foodId: 'cottage-cheese', grams: 80 },
      { foodId: 'spinach', grams: 30 },
    ],
    steps: ['Mix tuna and cottage cheese.', 'Fill the wrap with spinach and the tuna mix.'],
  },
];

export function recipeNutrition(r: Recipe) {
  return r.ingredients.reduce(
    (acc, ing) => {
      const food = FOODS.find((x) => x.id === ing.foodId);
      if (!food) return acc;
      const s = scaleFood(food, ing.grams);
      acc.kcal += s.kcal;
      acc.protein += s.protein;
      acc.carbs += s.carbs;
      acc.fat += s.fat;
      return acc;
    },
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );
}

export function recipeAllowed(r: Recipe, diet: string) {
  return r.ingredients.every((ing) => {
    const food = FOODS.find((x) => x.id === ing.foodId);
    return food ? allowedForDiet(food, diet) : true;
  });
}
