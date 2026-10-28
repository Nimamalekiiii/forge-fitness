import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, Image, Pressable, TextInput, Alert, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Header, Card, Button, Chip, Stepper, Pill, IconButton, success } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { RECIPES } from '../../src/data/recipes';
import { FOODS, scaleFood } from '../../src/data/foods';
import { DraftMeal, FoodItem, MealType } from '../../src/types';
import { MEAL_LABEL, mealForNow } from '../../src/logic/meals';
import { dayKey } from '../../src/logic/date';

function fromRecipe(id: string): DraftMeal | null {
  const r = RECIPES.find((x) => x.id === id);
  if (!r) return null;
  const items: FoodItem[] = r.ingredients.map((ing) => {
    const f = FOODS.find((x) => x.id === ing.foodId)!;
    return { name: f.name, emoji: f.emoji, grams: ing.grams, ...scaleFood(f, ing.grams) };
  });
  return { name: r.name, emoji: r.emoji, meal: mealForNow(), items, kcal: 0, protein: 0, carbs: 0, fat: 0, source: 'recipe' };
}

const total = (items: FoodItem[], k: number) =>
  items.reduce(
    (a, i) => ({ kcal: a.kcal + i.kcal * k, protein: a.protein + i.protein * k, carbs: a.carbs + i.carbs * k, fat: a.fat + i.fat * k }),
    { kcal: 0, protein: 0, carbs: 0, fat: 0 }
  );

export default function MealDetails() {
  const router = useRouter();
  const params = useLocalSearchParams<{ recipe?: string; servings?: string; meal?: MealType; entry?: string; date?: string }>();
  const s = useStore();
  const existing = params.entry ? s.meals.find((m) => m.id === params.entry) : undefined;

  const initial = useMemo<DraftMeal | null>(() => {
    if (existing) return { ...existing };
    if (params.recipe) return fromRecipe(params.recipe);
    return s.draftMeal;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [name, setName] = useState(initial?.name ?? '');
  const [items, setItems] = useState<FoodItem[]>(initial?.items ?? []);
  const [servings, setServings] = useState(Number(params.servings) || 1);
  const [meal, setMeal] = useState<MealType>(params.meal ?? initial?.meal ?? mealForNow());
  const [editing, setEditing] = useState(false);

  useEffect(() => () => s.setDraftMeal(null), []); // eslint-disable-line react-hooks/exhaustive-deps

  if (!initial) {
    return (
      <Screen>
        <Header back title="Your Meal" />
        <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 40 }}>Nothing to show.</Text>
      </Screen>
    );
  }

  // Items without breakdown (e.g. older entries) fall back to the meal totals
  const t = items.length ? total(items, servings) : { kcal: initial.kcal, protein: initial.protein, carbs: initial.carbs, fat: initial.fat };

  const scaleItem = (i: number, grams: number) =>
    setItems((list) =>
      list.map((it, j) => {
        if (j !== i || !it.grams) return it;
        const k = grams / it.grams;
        return { ...it, grams, kcal: Math.round(it.kcal * k), protein: +(it.protein * k).toFixed(1), carbs: +(it.carbs * k).toFixed(1), fat: +(it.fat * k).toFixed(1) };
      })
    );

  const save = () => {
    const draft: DraftMeal = {
      name: name.trim() || 'Meal',
      emoji: initial.emoji,
      photoUri: initial.photoUri,
      meal,
      items: items.map((i) => ({ ...i, grams: i.grams ? Math.round(i.grams * servings) : undefined, kcal: Math.round(i.kcal * servings), protein: +(i.protein * servings).toFixed(1), carbs: +(i.carbs * servings).toFixed(1), fat: +(i.fat * servings).toFixed(1) })),
      kcal: Math.round(t.kcal),
      protein: Math.round(t.protein),
      carbs: Math.round(t.carbs),
      fat: Math.round(t.fat),
      source: initial.source,
    };
    if (existing) s.removeMeal(existing.id);
    s.addMeal(draft, meal, existing?.date ?? params.date ?? dayKey());
    success();
    router.back();
  };

  const readOnly = !!existing && !editing;

  return (
    <Screen>
      <Header
        back
        title={existing ? 'Meal' : 'Your Meal'}
        right={existing ? <IconButton icon={editing ? 'close' : 'pencil'} onPress={() => setEditing((e) => !e)} /> : undefined}
      />
      {initial.photoUri ? (
        <Image source={{ uri: initial.photoUri }} style={styles.photo} />
      ) : (
        <LinearGradient colors={['#1A2740', colors.card]} style={[styles.photo, { alignItems: 'center', justifyContent: 'center' }]}>
          <Text style={{ fontSize: 72 }}>{initial.emoji}</Text>
        </LinearGradient>
      )}

      {initial.demo ? (
        <Card style={{ marginTop: space.md, flexDirection: 'row', gap: 10, alignItems: 'center', borderColor: colors.warning }}>
          <Ionicons name="information-circle" size={20} color={colors.warning} />
          <Text style={{ color: colors.textSecondary, fontSize: 12, flex: 1 }}>Demo result — connect your AI server for real recognition. Edit anything below.</Text>
        </Card>
      ) : null}

      <View style={{ marginTop: space.lg }}>
        {readOnly ? (
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800' }}>{name}</Text>
        ) : (
          <TextInput value={name} onChangeText={setName} style={{ color: colors.text, fontSize: 24, fontWeight: '800', padding: 0 }} placeholder="Meal name" placeholderTextColor={colors.faint} />
        )}
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 6 }}>
          <Text style={{ color: colors.muted }}>
            {servings} serving{servings !== 1 ? 's' : ''}
          </Text>
          {initial.confidence ? <Pill text={`${Math.round(initial.confidence * 100)}% match`} color={colors.success} /> : null}
          {initial.source === 'scan' ? <Pill text="AI scan" /> : null}
        </View>
      </View>

      <Card style={{ marginTop: space.lg, flexDirection: 'row', paddingHorizontal: 0 }}>
        {(
          [
            ['Calories', Math.round(t.kcal), ''],
            ['Protein', Math.round(t.protein), 'g'],
            ['Carbs', Math.round(t.carbs), 'g'],
            ['Fats', Math.round(t.fat), 'g'],
          ] as const
        ).map(([l, v, u], i) => (
          <View key={l} style={{ flex: 1, alignItems: 'center', borderLeftWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>
              {v}
              {u ? <Text style={{ fontSize: 13, color: colors.muted }}> {u}</Text> : null}
            </Text>
            <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{l}</Text>
          </View>
        ))}
      </Card>

      {!readOnly ? (
        <Card style={{ marginTop: space.md, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontWeight: '700' }}>Servings</Text>
          <Stepper value={servings} onChange={setServings} step={0.25} min={0.25} max={6} decimals={2} />
        </Card>
      ) : null}

      {items.length ? (
        <>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: space.xl, marginBottom: space.md }}>Ingredients</Text>
          <Card style={{ paddingVertical: 4 }}>
            {items.map((it, i) => (
              <View key={`${it.name}-${i}`} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }}>
                <View style={styles.emoji}>
                  <Text style={{ fontSize: 20 }}>{it.emoji ?? '🍽️'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{it.name}</Text>
                  {it.grams ? (
                    readOnly ? (
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{Math.round(it.grams * servings)} g</Text>
                    ) : (
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 4 }}>
                        <Pressable hitSlop={6} onPress={() => scaleItem(i, Math.max(5, it.grams! - 10))}>
                          <Ionicons name="remove-circle-outline" size={20} color={colors.muted} />
                        </Pressable>
                        <Text style={{ color: colors.textSecondary, fontSize: 13, fontWeight: '700', minWidth: 44, textAlign: 'center' }}>{it.grams} g</Text>
                        <Pressable hitSlop={6} onPress={() => scaleItem(i, it.grams! + 10)}>
                          <Ionicons name="add-circle-outline" size={20} color={colors.primary} />
                        </Pressable>
                      </View>
                    )
                  ) : null}
                </View>
                <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>{Math.round(it.kcal * servings)} kcal</Text>
                {!readOnly ? (
                  <Pressable hitSlop={8} onPress={() => setItems((l) => l.filter((_, j) => j !== i))}>
                    <Ionicons name="close" size={18} color={colors.faint} />
                  </Pressable>
                ) : null}
              </View>
            ))}
          </Card>
        </>
      ) : null}

      {!readOnly ? (
        <>
          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: space.xl, marginBottom: space.md }}>Add to</Text>
          <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
            {(Object.keys(MEAL_LABEL) as MealType[]).map((m) => (
              <Chip key={m} label={MEAL_LABEL[m]} active={meal === m} onPress={() => setMeal(m)} />
            ))}
          </View>
          <Button title={existing ? 'Save changes' : 'Add to Diary'} onPress={save} style={{ marginTop: space.xl }} />
        </>
      ) : (
        <Button
          title="Delete meal"
          variant="danger"
          icon="trash-outline"
          style={{ marginTop: space.xl }}
          onPress={() =>
            Alert.alert('Delete meal?', name, [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Delete',
                style: 'destructive',
                onPress: () => {
                  s.removeMeal(existing!.id);
                  router.back();
                },
              },
            ])
          }
        />
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  photo: { height: 210, borderRadius: 20, width: '100%' },
  emoji: { width: 40, height: 40, borderRadius: 12, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
});
