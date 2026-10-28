export type FoodTag = 'meat' | 'fish' | 'dairy' | 'egg' | 'plant';

export type Food = {
  id: string;
  name: string;
  emoji: string;
  /** per 100 g */
  kcal: number;
  protein: number;
  carbs: number;
  fat: number;
  /** default portion in grams */
  portion: number;
  /** label for one piece, e.g. "piece" (portion is then the weight of one piece) */
  unit?: string;
  tag: FoodTag;
};

const f = (
  id: string,
  name: string,
  emoji: string,
  kcal: number,
  protein: number,
  carbs: number,
  fat: number,
  portion: number,
  tag: FoodTag,
  unit?: string
): Food => ({ id, name, emoji, kcal, protein, carbs, fat, portion, tag, unit });

export const FOODS: Food[] = [
  f('chicken-breast', 'Chicken Breast', '🍗', 165, 31, 0, 3.6, 200, 'meat'),
  f('rice-cooked', 'Rice (cooked)', '🍚', 130, 2.7, 28, 0.3, 150, 'plant'),
  f('egg', 'Egg', '🥚', 143, 12.6, 0.7, 9.5, 50, 'egg', 'piece'),
  f('banana', 'Banana', '🍌', 89, 1.1, 23, 0.3, 120, 'plant', 'piece'),
  f('greek-yogurt', 'Greek Yogurt (0%)', '🥣', 59, 10, 3.6, 0.4, 200, 'dairy'),
  f('oats', 'Oats', '🌾', 389, 16.9, 66, 6.9, 60, 'plant'),
  f('salmon', 'Salmon', '🐟', 208, 20, 0, 13, 150, 'fish'),
  f('broccoli', 'Broccoli', '🥦', 34, 2.8, 7, 0.4, 100, 'plant'),
  f('sweet-potato', 'Sweet Potato', '🍠', 86, 1.6, 20, 0.1, 200, 'plant'),
  f('potato', 'Potato (boiled)', '🥔', 87, 1.9, 20, 0.1, 200, 'plant'),
  f('pasta-cooked', 'Pasta (cooked)', '🍝', 158, 5.8, 31, 0.9, 180, 'plant'),
  f('whole-bread', 'Wholegrain Bread', '🍞', 247, 13, 41, 3.4, 40, 'plant', 'slice'),
  f('ground-beef', 'Ground Beef (5%)', '🥩', 137, 21, 0, 5, 150, 'meat'),
  f('steak', 'Sirloin Steak', '🥩', 206, 29, 0, 9.5, 200, 'meat'),
  f('tuna', 'Tuna (canned, water)', '🐟', 116, 26, 0, 1, 120, 'fish'),
  f('shrimp', 'Shrimp', '🦐', 99, 24, 0.2, 0.3, 150, 'fish'),
  f('cottage-cheese', 'Cottage Cheese', '🧀', 98, 11, 3.4, 4.3, 200, 'dairy'),
  f('skyr', 'Skyr', '🥛', 63, 11, 4, 0.2, 170, 'dairy'),
  f('milk', 'Milk (1%)', '🥛', 42, 3.4, 5, 1, 250, 'dairy'),
  f('whey', 'Whey Protein', '🥤', 400, 80, 8, 6, 30, 'dairy', 'scoop'),
  f('tofu', 'Tofu (firm)', '🧈', 144, 17, 3, 8.7, 150, 'plant'),
  f('tempeh', 'Tempeh', '🫘', 192, 20, 7.6, 11, 100, 'plant'),
  f('lentils', 'Lentils (cooked)', '🫘', 116, 9, 20, 0.4, 200, 'plant'),
  f('chickpeas', 'Chickpeas (cooked)', '🫘', 164, 8.9, 27, 2.6, 150, 'plant'),
  f('avocado', 'Avocado', '🥑', 160, 2, 9, 15, 100, 'plant', 'half'),
  f('almonds', 'Almonds', '🌰', 579, 21, 22, 50, 30, 'plant'),
  f('peanut-butter', 'Peanut Butter', '🥜', 588, 25, 20, 50, 20, 'plant', 'tbsp'),
  f('olive-oil', 'Olive Oil', '🫒', 884, 0, 0, 100, 10, 'plant', 'tbsp'),
  f('apple', 'Apple', '🍎', 52, 0.3, 14, 0.2, 180, 'plant', 'piece'),
  f('blueberries', 'Blueberries', '🫐', 57, 0.7, 14, 0.3, 100, 'plant'),
  f('orange', 'Orange', '🍊', 47, 0.9, 12, 0.1, 150, 'plant', 'piece'),
  f('spinach', 'Spinach', '🥬', 23, 2.9, 3.6, 0.4, 60, 'plant'),
  f('mixed-veg', 'Mixed Vegetables', '🥗', 40, 2, 7, 0.3, 150, 'plant'),
  f('quinoa', 'Quinoa (cooked)', '🍲', 120, 4.4, 21, 1.9, 150, 'plant'),
  f('tortilla', 'Tortilla Wrap', '🌯', 310, 8, 52, 7.5, 60, 'plant', 'wrap'),
  f('cheese', 'Cheese (Jarlsberg)', '🧀', 351, 27, 0, 27, 20, 'dairy', 'slice'),
  f('turkey', 'Turkey Breast', '🦃', 104, 24, 0, 1, 100, 'meat'),
  f('cod', 'Cod', '🐟', 82, 18, 0, 0.7, 180, 'fish'),
  f('protein-bar', 'Protein Bar', '🍫', 350, 33, 35, 10, 60, 'dairy', 'bar'),
  f('granola', 'Granola', '🥣', 471, 10, 64, 20, 50, 'plant'),
  f('dark-chocolate', 'Dark Chocolate 70%', '🍫', 598, 7.8, 46, 43, 20, 'plant'),
  f('pizza', 'Pizza', '🍕', 266, 11, 33, 10, 250, 'dairy', 'slice'),
  f('burger', 'Burger', '🍔', 295, 17, 24, 14, 220, 'meat', 'piece'),
  f('sushi', 'Sushi (salmon nigiri)', '🍣', 150, 7, 22, 3.5, 40, 'fish', 'piece'),
  f('coffee-latte', 'Caffe Latte', '☕', 54, 3.4, 5, 2, 300, 'dairy'),
  f('orange-juice', 'Orange Juice', '🧃', 45, 0.7, 10, 0.2, 250, 'plant'),
];

export const foodById = (id: string) => FOODS.find((x) => x.id === id);

export function scaleFood(food: Food, grams: number) {
  const k = grams / 100;
  return {
    kcal: Math.round(food.kcal * k),
    protein: Math.round(food.protein * k * 10) / 10,
    carbs: Math.round(food.carbs * k * 10) / 10,
    fat: Math.round(food.fat * k * 10) / 10,
  };
}

export function allowedForDiet(food: Food, diet: string) {
  switch (diet) {
    case 'vegan':
      return food.tag === 'plant';
    case 'vegetarian':
      return food.tag === 'plant' || food.tag === 'dairy' || food.tag === 'egg';
    case 'pescatarian':
      return food.tag !== 'meat';
    case 'keto':
      return food.carbs <= 10;
    default:
      return true;
  }
}
