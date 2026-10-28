import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Segmented, Card, SectionHeader, Button, ProgressRing, MacroBar, Empty, Input, Pill, IconButton, tap, success } from '../../src/components/ui';
import { InsightCard } from '../../src/components/InsightCard';
import { Bars } from '../../src/components/charts';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { sumMeals } from '../../src/logic/nutrition';
import { coachInsights } from '../../src/logic/coach';
import { DAY_SHORT, addDays, dayKey, shortDate, weekdayIndex } from '../../src/logic/date';
import { RECIPES, recipeAllowed, recipeNutrition } from '../../src/data/recipes';
import { buildMealPlan } from '../../src/logic/mealplan';
import { FOODS } from '../../src/data/foods';
import { MealEntry, MealType } from '../../src/types';

type Tab = 'overview' | 'meals' | 'recipes' | 'plan' | 'grocery';
const MEALS: { key: MealType; label: string; icon: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { key: 'breakfast', label: 'Breakfast', icon: 'sunny-outline' },
  { key: 'lunch', label: 'Lunch', icon: 'partly-sunny-outline' },
  { key: 'dinner', label: 'Dinner', icon: 'moon-outline' },
  { key: 'snack', label: 'Snacks', icon: 'cafe-outline' },
];

export default function Nutrition() {
  const [tab, setTab] = useState<Tab>('overview');
  const router = useRouter();
  return (
    <Screen>
      <Header large title="Nutrition" right={<IconButton icon="scan" bg={colors.primary} color="#fff" onPress={() => router.push('/nutrition/scan')} />} />
      <Segmented
        scroll
        value={tab}
        onChange={setTab}
        options={[
          { key: 'overview', label: 'Overview' },
          { key: 'meals', label: 'Meals' },
          { key: 'recipes', label: 'Recipes' },
          { key: 'plan', label: 'Meal Plan' },
          { key: 'grocery', label: 'Grocery List' },
        ]}
      />
      {tab === 'overview' && <Overview />}
      {tab === 'meals' && <Meals />}
      {tab === 'recipes' && <Recipes />}
      {tab === 'plan' && <Plan />}
      {tab === 'grocery' && <Grocery />}
    </Screen>
  );
}

function MealGroup({ day, editable = true }: { day: string; editable?: boolean }) {
  const router = useRouter();
  const meals = useStore((s) => s.meals);
  const remove = useStore((s) => s.removeMeal);
  const today = meals.filter((m) => m.date === day);
  return (
    <View style={{ gap: 10 }}>
      {MEALS.map((mt) => {
        const list = today.filter((m) => m.meal === mt.key);
        const kcal = list.reduce((a, m) => a + m.kcal, 0);
        return (
          <Card key={mt.key} style={{ paddingVertical: 12 }}>
            <View style={[styles.row, { justifyContent: 'space-between' }]}>
              <View style={[styles.row, { gap: 8 }]}>
                <Ionicons name={mt.icon} size={18} color={colors.primaryLight} />
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{mt.label}</Text>
                {kcal ? <Text style={{ color: colors.muted, fontSize: 13 }}>{kcal} kcal</Text> : null}
              </View>
              {editable ? (
                <Pressable hitSlop={10} onPress={() => router.push({ pathname: '/nutrition/log', params: { meal: mt.key, date: day } })}>
                  <Ionicons name="add-circle" size={26} color={colors.primary} />
                </Pressable>
              ) : null}
            </View>
            {list.map((m) => (
              <MealRow key={m.id} m={m} onDelete={() => remove(m.id)} />
            ))}
          </Card>
        );
      })}
    </View>
  );
}

function MealRow({ m, onDelete }: { m: MealEntry; onDelete: () => void }) {
  const router = useRouter();
  return (
    <Pressable
      onPress={() => router.push({ pathname: '/nutrition/meal', params: { entry: m.id } })}
      onLongPress={() =>
        Alert.alert('Remove meal?', m.name, [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Remove', style: 'destructive', onPress: onDelete },
        ])
      }
      style={[styles.row, { gap: 12, marginTop: 12 }]}
    >
      <View style={styles.emoji}>
        <Text style={{ fontSize: 22 }}>{m.emoji}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700' }} numberOfLines={1}>
          {m.name}
        </Text>
        <Text style={{ color: colors.muted, fontSize: 12 }}>
          P {Math.round(m.protein)} g · C {Math.round(m.carbs)} g · F {Math.round(m.fat)} g
        </Text>
      </View>
      <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{m.kcal} kcal</Text>
    </Pressable>
  );
}

function Overview() {
  const router = useRouter();
  const s = useStore();
  const t = s.targets!;
  const key = dayKey();
  const tot = sumMeals(s.meals.filter((m) => m.date === key));
  const insights = useMemo(() => coachInsights(s).filter((i) => i.kind === 'nutrition' || i.kind === 'hydration'), [s]);
  const week = useMemo(
    () =>
      Array.from({ length: 7 }, (_, i) => {
        const d = addDays(new Date(), i - 6);
        return { label: DAY_SHORT[weekdayIndex(d)].charAt(0), value: sumMeals(s.meals.filter((m) => m.date === dayKey(d))).kcal };
      }),
    [s.meals]
  );

  return (
    <View>
      <Card>
        <View style={[styles.row, { gap: 18 }]}>
          <ProgressRing size={140} stroke={12} value={tot.kcal / t.kcal} color={colors.primary} colorEnd={colors.primaryLight}>
            <Text style={{ color: colors.text, fontSize: 26, fontWeight: '800' }}>{Math.round(tot.kcal).toLocaleString()}</Text>
            <Text style={{ color: colors.muted, fontSize: 11 }}>of {t.kcal.toLocaleString()} kcal</Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <MacroBar label="Protein" value={tot.protein} target={t.protein} color={colors.protein} />
            <MacroBar label="Carbs" value={tot.carbs} target={t.carbs} color={colors.carbs} />
            <MacroBar label="Fats" value={tot.fat} target={t.fat} color={colors.fat} />
          </View>
        </View>
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 6, fontSize: 13 }}>
          {t.kcal - tot.kcal >= 0 ? `${Math.round(t.kcal - tot.kcal)} kcal remaining` : `${Math.round(tot.kcal - t.kcal)} kcal over`}
        </Text>
      </Card>
      <View style={[styles.row, { gap: 10, marginTop: space.md }]}>
        <Button title="Log Meal" icon="restaurant" onPress={() => router.push('/nutrition/log')} style={{ flex: 1 }} />
        <Button title="Scan" icon="camera" variant="secondary" onPress={() => router.push('/nutrition/scan')} style={{ flex: 0.6 }} />
      </View>

      {insights.length ? (
        <View style={{ marginTop: space.lg, gap: 10 }}>
          {insights.slice(0, 2).map((i) => (
            <InsightCard key={i.id} insight={i} />
          ))}
        </View>
      ) : null}

      <SectionHeader title="Today's Meals" />
      <MealGroup day={key} />

      <SectionHeader title="Last 7 days" />
      <Card>
        <Bars data={week} target={t.kcal} color={colors.primary} />
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>Dashed line = your daily target ({t.kcal} kcal)</Text>
      </Card>
    </View>
  );
}

function Meals() {
  const [offset, setOffset] = useState(0);
  const meals = useStore((s) => s.meals);
  const targets = useStore((s) => s.targets)!;
  const d = addDays(new Date(), offset);
  const key = dayKey(d);
  const tot = sumMeals(meals.filter((m) => m.date === key));
  return (
    <View>
      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: space.md }]}>
        <IconButton icon="chevron-back" onPress={() => setOffset((o) => o - 1)} />
        <View style={{ alignItems: 'center' }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{offset === 0 ? 'Today' : offset === -1 ? 'Yesterday' : shortDate(key)}</Text>
          <Text style={{ color: colors.muted, fontSize: 12 }}>
            {Math.round(tot.kcal)} / {targets.kcal} kcal · {Math.round(tot.protein)} g protein
          </Text>
        </View>
        <IconButton icon="chevron-forward" onPress={() => setOffset((o) => Math.min(0, o + 1))} />
      </View>
      <MealGroup day={key} />
    </View>
  );
}

function Recipes() {
  const router = useRouter();
  const diet = useStore((s) => s.profile?.diet ?? 'none');
  const list = RECIPES.filter((r) => recipeAllowed(r, diet));
  return (
    <View style={{ gap: 10 }}>
      {diet !== 'none' ? <Text style={{ color: colors.muted, fontSize: 13 }}>Showing recipes that fit your {diet} diet.</Text> : null}
      {list.map((r) => {
        const n = recipeNutrition(r);
        return (
          <Card key={r.id} onPress={() => router.push({ pathname: '/nutrition/meal', params: { recipe: r.id } })} style={[styles.row, { gap: 14 }]}>
            <View style={[styles.emoji, { width: 60, height: 60, borderRadius: 16 }]}>
              <Text style={{ fontSize: 30 }}>{r.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '800', fontSize: 15 }}>{r.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {Math.round(n.kcal)} kcal · {Math.round(n.protein)} g protein · {r.minutes} min
              </Text>
              <View style={[styles.row, { gap: 6, marginTop: 6 }]}>
                {r.tags.slice(0, 2).map((t) => (
                  <Pill key={t} text={t} />
                ))}
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Card>
        );
      })}
    </View>
  );
}

function Plan() {
  const router = useRouter();
  const s = useStore();
  const [seed, setSeed] = useState(0);
  const plan = useMemo(() => buildMealPlan(s.targets!, s.profile!.diet, seed), [s.targets, s.profile, seed]);
  const tot = plan.reduce((a, p) => ({ kcal: a.kcal + p.kcal, protein: a.protein + p.protein }), { kcal: 0, protein: 0 });
  const addAllToGroceries = () => {
    const ids = new Set(plan.flatMap((p) => p.recipe.ingredients.map((i) => i.foodId)));
    ids.forEach((id) => {
      const f = FOODS.find((x) => x.id === id);
      if (f) s.addGrocery(f.name, f.emoji);
    });
    success();
    Alert.alert('Added to grocery list', `${ids.size} ingredients added.`);
  };
  return (
    <View>
      <Card tone="primary">
        <View style={[styles.row, { gap: 8 }]}>
          <Ionicons name="sparkles" size={16} color={colors.primaryLight} />
          <Text style={{ color: colors.primaryLight, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>AI MEAL PLAN</Text>
        </View>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 6 }}>
          {tot.kcal.toLocaleString()} kcal · {tot.protein} g protein
        </Text>
        <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
          Portions scaled to your {s.targets!.kcal} kcal target{s.profile!.diet !== 'none' ? ` and ${s.profile!.diet} diet` : ''}.
        </Text>
      </Card>
      <View style={{ gap: 10, marginTop: space.md }}>
        {plan.map((p) => (
          <Card key={p.meal} style={[styles.row, { gap: 12 }]}>
            <View style={styles.emoji}>
              <Text style={{ fontSize: 22 }}>{p.recipe.emoji}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1 }}>{p.meal.toUpperCase()}</Text>
              <Text style={{ color: colors.text, fontWeight: '700' }}>
                {p.recipe.name}
                {p.servings !== 1 ? ` ×${p.servings}` : ''}
              </Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {p.kcal} kcal · P {p.protein} g · C {p.carbs} g · F {p.fat} g
              </Text>
            </View>
            <Pressable
              hitSlop={8}
              onPress={() => (tap(), router.push({ pathname: '/nutrition/meal', params: { recipe: p.recipe.id, servings: String(p.servings), meal: p.meal } }))}
            >
              <Ionicons name="add-circle" size={28} color={colors.primary} />
            </Pressable>
          </Card>
        ))}
      </View>
      <View style={[styles.row, { gap: 10, marginTop: space.md }]}>
        <Button title="Shuffle" icon="shuffle" variant="secondary" onPress={() => setSeed((x) => x + 1)} style={{ flex: 1 }} />
        <Button title="To grocery list" icon="cart" onPress={addAllToGroceries} style={{ flex: 1.4 }} />
      </View>
    </View>
  );
}

function Grocery() {
  const s = useStore();
  const [text, setText] = useState('');
  const add = () => {
    if (!text.trim()) return;
    s.addGrocery(text.trim());
    setText('');
  };
  const open = s.groceries.filter((g) => !g.done);
  const done = s.groceries.filter((g) => g.done);
  return (
    <View>
      <View style={[styles.row, { gap: 10 }]}>
        <View style={{ flex: 1 }}>
          <Input placeholder="Add item…" value={text} onChangeText={setText} onSubmitEditing={add} returnKeyType="done" icon="cart-outline" />
        </View>
        <IconButton icon="add" bg={colors.primary} color="#fff" size={50} onPress={add} />
      </View>
      {s.groceries.length === 0 ? (
        <View style={{ marginTop: space.lg }}>
          <Empty icon="cart-outline" title="Your list is empty" body="Add items or send your AI meal plan here in one tap." />
        </View>
      ) : (
        <Card style={{ marginTop: space.lg, paddingVertical: 4 }}>
          {[...open, ...done].map((g) => (
            <Pressable key={g.id} onPress={() => (tap(), s.toggleGrocery(g.id))} style={[styles.row, { gap: 12, paddingVertical: 12 }]}>
              <Ionicons name={g.done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={g.done ? colors.success : colors.faint} />
              <Text style={{ fontSize: 18 }}>{g.emoji ?? '🛒'}</Text>
              <Text style={{ color: g.done ? colors.faint : colors.text, fontWeight: '600', flex: 1, textDecorationLine: g.done ? 'line-through' : 'none' }}>{g.name}</Text>
            </Pressable>
          ))}
        </Card>
      )}
      {done.length ? <Button title={`Clear ${done.length} checked`} variant="ghost" onPress={() => s.clearGroceries(true)} style={{ marginTop: 6 }} /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { width: 46, height: 46, borderRadius: 14, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
});
