import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, Card, tap } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { exerciseById } from '../../src/data/exercises';
import { formatDuration } from '../../src/logic/date';
import { suggestMeal, todayTotals } from '../../src/logic/coach';

export default function Summary() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const s = useStore();
  const log = s.workouts.find((w) => w.id === id);
  const totals = useMemo(() => (s.targets ? todayTotals(s) : null), [s]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!log || !totals) return null;
  const sets = log.exercises.reduce((a, e) => a + e.sets.length, 0);
  const meal = suggestMeal(s, totals.remaining.kcal, totals.remaining.protein);
  const setFeeling = (f: 1 | 2 | 3 | 4 | 5) =>
    useStore.setState({ workouts: s.workouts.map((w) => (w.id === log.id ? { ...w, feeling: f } : w)) });

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }}>
        <LinearGradient colors={['#173A73', colors.bg]} style={{ borderRadius: 24, padding: 24, alignItems: 'center' }}>
          <Text style={{ fontSize: 56 }}>{log.prs.length ? '🏆' : '💪'}</Text>
          <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800', marginTop: 8 }}>Workout complete!</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{log.name}</Text>
          <View style={{ flexDirection: 'row', marginTop: 20, gap: 10 }}>
            {[
              ['Duration', formatDuration(log.durationSec)],
              ['Volume', `${(log.volume / 1000).toFixed(1)} t`],
              ['Sets', String(sets)],
              ['PRs', String(log.prs.length)],
            ].map(([l, v]) => (
              <View key={l} style={{ flex: 1, alignItems: 'center', backgroundColor: 'rgba(17,21,28,0.8)', borderRadius: 14, paddingVertical: 12 }}>
                <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{v}</Text>
                <Text style={{ color: colors.muted, fontSize: 11, marginTop: 2 }}>{l}</Text>
              </View>
            ))}
          </View>
        </LinearGradient>

        {log.prs.length ? (
          <Card style={{ marginTop: space.lg }}>
            <Text style={{ color: colors.warning, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>NEW PERSONAL RECORDS</Text>
            {log.prs.map((pid) => {
              const e = log.exercises.find((x) => x.exerciseId === pid)!;
              const best = [...e.sets].sort((a, b) => b.kg * (1 + b.reps / 30) - a.kg * (1 + a.reps / 30))[0];
              return (
                <View key={pid} style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{exerciseById(pid)?.name}</Text>
                  <Text style={{ color: colors.textSecondary, fontWeight: '700' }}>
                    {best.kg} kg × {best.reps}
                  </Text>
                </View>
              );
            })}
          </Card>
        ) : null}

        <Card style={{ marginTop: space.lg }}>
          <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>How did it feel?</Text>
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>Your coach uses this to tune intensity.</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
            {(['😫', '😕', '😐', '🙂', '🔥'] as const).map((e, i) => {
              const v = (i + 1) as 1 | 2 | 3 | 4 | 5;
              const active = log.feeling === v;
              return (
                <Pressable
                  key={e}
                  onPress={() => (tap(), setFeeling(v))}
                  style={{
                    width: 56,
                    height: 52,
                    borderRadius: 14,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: active ? colors.primaryDim : colors.card2,
                    borderWidth: 1,
                    borderColor: active ? colors.primary : colors.border,
                  }}
                >
                  <Text style={{ fontSize: 24 }}>{e}</Text>
                </Pressable>
              );
            })}
          </View>
        </Card>

        <Card tone="primary" style={{ marginTop: space.lg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Ionicons name="sparkles" size={16} color={colors.primaryLight} />
            <Text style={{ color: colors.primaryLight, fontWeight: '800', letterSpacing: 1, fontSize: 12 }}>RECOVERY FUEL</Text>
          </View>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, marginTop: 8, lineHeight: 21 }}>
            {totals.remaining.protein > 0
              ? `Get 30–50 g protein in the next 2 hours. You have ${totals.remaining.protein} g left today.`
              : 'Protein is covered today — add carbs to refill glycogen.'}
          </Text>
          {meal ? (
            <Button
              small
              title={`Log ${meal.r.name}`}
              icon="restaurant"
              style={{ marginTop: 12, alignSelf: 'flex-start' }}
              onPress={() => router.replace({ pathname: '/nutrition/meal', params: { recipe: meal.r.id } })}
            />
          ) : null}
        </Card>

        <Button title="Done" onPress={() => router.replace('/(tabs)')} style={{ marginTop: space.xl }} />
      </ScrollView>
    </SafeAreaView>
  );
}
