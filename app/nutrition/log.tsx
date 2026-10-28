import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Segmented, Input, Card, Button, Chip, Stepper, Empty, IconButton, tap, success } from '../../src/components/ui';
import { Sheet } from '../../src/components/Sheet';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { FOODS, Food, allowedForDiet, scaleFood } from '../../src/data/foods';
import { RECIPES, recipeAllowed, recipeNutrition } from '../../src/data/recipes';
import { MealType } from '../../src/types';
import { MEAL_LABEL, mealForNow } from '../../src/logic/meals';
import { dayKey } from '../../src/logic/date';

type Tab = 'search' | 'recent' | 'recipes' | 'custom';

export default function LogMeal() {
  const router = useRouter();
  const params = useLocalSearchParams<{ meal?: MealType; date?: string }>();
  const s = useStore();
  const [tab, setTab] = useState<Tab>('search');
  const [meal, setMeal] = useState<MealType>(params.meal ?? mealForNow());
  const date = params.date ?? dayKey();
  const [q, setQ] = useState('');
  const [picked, setPicked] = useState<Food | null>(null);
  const [grams, setGrams] = useState(100);
  const diet = s.profile?.diet ?? 'none';

  const foods = useMemo(() => {
    const ql = q.trim().toLowerCase();
    return FOODS.filter((f) => !ql || f.name.toLowerCase().includes(ql)).sort(
      (a, b) => Number(allowedForDiet(b, diet)) - Number(allowedForDiet(a, diet))
    );
  }, [q, diet]);

  const recent = useMemo(() => {
    const seen = new Set<string>();
    return [...s.meals]
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
      .filter((m) => (seen.has(m.name) ? false : (seen.add(m.name), true)))
      .slice(0, 20);
  }, [s.meals]);

  const addFood = () => {
    if (!picked) return;
    const n = scaleFood(picked, grams);
    s.addMeal(
      {
        name: picked.name,
        emoji: picked.emoji,
        meal,
        items: [{ name: picked.name, emoji: picked.emoji, grams, ...n }],
        ...n,
        source: 'db',
      },
      meal,
      date
    );
    success();
    setPicked(null);
    router.back();
  };

  // Custom
  const [c, setC] = useState({ name: '', kcal: '', protein: '', carbs: '', fat: '' });
  const num = (v: string) => Number(v.replace(',', '.')) || 0;

  return (
    <Screen>
      <Header back title="Log Meal" right={<IconButton icon="scan" onPress={() => router.replace('/nutrition/scan')} />} />
      <View style={[styles.row, { gap: 8, marginBottom: space.md, flexWrap: 'wrap' }]}>
        {(Object.keys(MEAL_LABEL) as MealType[]).map((m) => (
          <Chip key={m} label={MEAL_LABEL[m]} active={meal === m} onPress={() => setMeal(m)} />
        ))}
      </View>
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'search', label: 'Search' },
          { key: 'recent', label: 'Recent' },
          { key: 'recipes', label: 'Recipes' },
          { key: 'custom', label: 'Custom' },
        ]}
      />

      {tab === 'search' && (
        <View>
          <Input icon="search" placeholder="Search for a food…" value={q} onChangeText={setQ} autoCorrect={false} />
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: space.lg, marginBottom: 4 }}>{q ? 'Results' : 'Popular'}</Text>
          {foods.map((f) => {
            const ok = allowedForDiet(f, diet);
            return (
              <Pressable
                key={f.id}
                onPress={() => {
                  tap();
                  setPicked(f);
                  setGrams(f.portion);
                }}
                style={[styles.row, { gap: 12, paddingVertical: 10, opacity: ok ? 1 : 0.45 }]}
              >
                <View style={styles.emoji}>
                  <Text style={{ fontSize: 24 }}>{f.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{f.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {f.unit ? `${Math.round((f.kcal * f.portion) / 100)} kcal / ${f.unit}` : `${f.kcal} kcal / 100 g`} · {f.protein} g P
                  </Text>
                </View>
                <View style={styles.plus}>
                  <Ionicons name="add" size={20} color={colors.text} />
                </View>
              </Pressable>
            );
          })}
          {q && !foods.length ? (
            <Empty icon="search" title="No match" body="Try the scanner or add it as a custom food." action="Add custom" onAction={() => (setC((x) => ({ ...x, name: q })), setTab('custom'))} />
          ) : null}
        </View>
      )}

      {tab === 'recent' &&
        (recent.length ? (
          <View>
            {recent.map((m) => (
              <Pressable
                key={m.id}
                onPress={() => {
                  tap();
                  const { id: _i, createdAt: _c, date: _d, ...rest } = m;
                  s.addMeal({ ...rest, meal }, meal, date);
                  success();
                  router.back();
                }}
                style={[styles.row, { gap: 12, paddingVertical: 10 }]}
              >
                <View style={styles.emoji}>
                  <Text style={{ fontSize: 24 }}>{m.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{m.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {m.kcal} kcal · {Math.round(m.protein)} g protein
                  </Text>
                </View>
                <View style={styles.plus}>
                  <Ionicons name="add" size={20} color={colors.text} />
                </View>
              </Pressable>
            ))}
          </View>
        ) : (
          <Empty icon="time-outline" title="Nothing yet" body="Meals you log appear here for one-tap re-logging." />
        ))}

      {tab === 'recipes' && (
        <View>
          {RECIPES.filter((r) => recipeAllowed(r, diet)).map((r) => {
            const n = recipeNutrition(r);
            return (
              <Pressable
                key={r.id}
                onPress={() => router.push({ pathname: '/nutrition/meal', params: { recipe: r.id, meal, date } })}
                style={[styles.row, { gap: 12, paddingVertical: 10 }]}
              >
                <View style={styles.emoji}>
                  <Text style={{ fontSize: 24 }}>{r.emoji}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{r.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {Math.round(n.kcal)} kcal · {Math.round(n.protein)} g protein
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.faint} />
              </Pressable>
            );
          })}
        </View>
      )}

      {tab === 'custom' && (
        <View style={{ gap: 10 }}>
          <Input placeholder="Name, e.g. Homemade lasagna" value={c.name} onChangeText={(name) => setC({ ...c, name })} />
          <Input placeholder="Calories" keyboardType="number-pad" value={c.kcal} onChangeText={(kcal) => setC({ ...c, kcal })} suffix="kcal" />
          <View style={[styles.row, { gap: 8 }]}>
            {(['protein', 'carbs', 'fat'] as const).map((k) => (
              <View key={k} style={{ flex: 1 }}>
                <Input placeholder={k[0].toUpperCase() + k.slice(1)} keyboardType="decimal-pad" value={c[k]} onChangeText={(v) => setC({ ...c, [k]: v })} suffix="g" />
              </View>
            ))}
          </View>
          <Text style={{ color: colors.muted, fontSize: 12 }}>Tip: leave calories empty and we'll calculate them from the macros.</Text>
          <Button
            title="Add to diary"
            disabled={!c.name.trim()}
            onPress={() => {
              const p = num(c.protein);
              const cb = num(c.carbs);
              const f = num(c.fat);
              const kcal = num(c.kcal) || Math.round(p * 4 + cb * 4 + f * 9);
              s.addMeal(
                { name: c.name.trim(), emoji: '🍽️', meal, items: [{ name: c.name.trim(), kcal, protein: p, carbs: cb, fat: f }], kcal, protein: p, carbs: cb, fat: f, source: 'custom' },
                meal,
                date
              );
              success();
              router.back();
            }}
          />
        </View>
      )}

      <Sheet visible={!!picked} onClose={() => setPicked(null)} title={picked ? `${picked.emoji}  ${picked.name}` : ''}>
        {picked ? (
          <View>
            <View style={{ alignItems: 'center' }}>
              {picked.unit ? (
                <Stepper value={Math.round((grams / picked.portion) * 2) / 2} onChange={(v) => setGrams(Math.round(v * picked.portion))} step={0.5} min={0.5} max={20} decimals={1} suffix={picked.unit} />
              ) : (
                <Stepper value={grams} onChange={setGrams} step={10} min={5} max={2000} suffix="g" />
              )}
              <Text style={{ color: colors.muted, marginTop: 6, fontSize: 12 }}>{grams} g</Text>
            </View>
            <View style={[styles.row, { marginTop: space.lg, justifyContent: 'space-around' }]}>
              {(() => {
                const n = scaleFood(picked, grams);
                return (
                  [
                    ['Calories', `${n.kcal}`, colors.text],
                    ['Protein', `${n.protein} g`, colors.protein],
                    ['Carbs', `${n.carbs} g`, colors.carbs],
                    ['Fat', `${n.fat} g`, colors.fat],
                  ] as const
                ).map(([l, v, col]) => (
                  <View key={l} style={{ alignItems: 'center' }}>
                    <Text style={{ color: col, fontSize: 18, fontWeight: '800' }}>{v}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{l}</Text>
                  </View>
                ));
              })()}
            </View>
            <Button title={`Add to ${MEAL_LABEL[meal]}`} onPress={addFood} style={{ marginTop: space.xl }} />
          </View>
        ) : null}
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  emoji: { width: 48, height: 48, borderRadius: 14, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  plus: { width: 32, height: 32, borderRadius: 16, backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' },
});
