import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Header, Card, SectionHeader, Stat, Pill, Button, Empty, hexA } from '../../src/components/ui';
import { LineChart } from '../../src/components/charts';
import { muscleColor } from '../../src/components/ExerciseList';
import { colors, space } from '../../src/theme';
import { exerciseById } from '../../src/data/exercises';
import { useStore } from '../../src/store/useStore';
import { personalRecords, strengthSeries } from '../../src/logic/strength';
import { shortDate } from '../../src/logic/date';

export default function ExerciseDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const ex = exerciseById(id);
  const workouts = useStore((s) => s.workouts);
  const startWorkout = useStore((s) => s.startWorkout);
  const series = useMemo(() => (ex ? strengthSeries(workouts, ex.id) : []), [workouts, ex]);
  const pr = useMemo(() => personalRecords(workouts).find((p) => p.exerciseId === id), [workouts, id]);
  const history = useMemo(
    () =>
      [...workouts]
        .filter((w) => w.exercises.some((e) => e.exerciseId === id))
        .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
        .slice(0, 8),
    [workouts, id]
  );
  if (!ex) return null;
  const c = muscleColor(ex.muscle);
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  const gain = first ? Math.round(((last - first) / first) * 100) : 0;

  return (
    <Screen>
      <Header back title={ex.name} />
      <LinearGradient colors={[hexA(c, 0.4), hexA(c, 0.05)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ height: 170, borderRadius: 20, alignItems: 'center', justifyContent: 'center' }}>
        <Ionicons name="barbell" size={90} color={c} />
      </LinearGradient>
      <View style={{ flexDirection: 'row', gap: 8, marginTop: space.md, flexWrap: 'wrap' }}>
        <Pill text={ex.muscle} color={c} />
        {ex.secondary.map((m) => (
          <Pill key={m} text={m} color={colors.muted} />
        ))}
        <Pill text={ex.equipment} color={colors.primaryLight} />
        <Pill text={ex.compound ? 'Compound' : 'Isolation'} color={colors.recovery} />
      </View>

      {ex.cues.length ? (
        <>
          <SectionHeader title="Form cues" />
          <Card style={{ gap: 8 }}>
            {ex.cues.map((cue, i) => (
              <View key={cue} style={{ flexDirection: 'row', gap: 10 }}>
                <Text style={{ color: colors.primary, fontWeight: '800' }}>{i + 1}</Text>
                <Text style={{ color: colors.textSecondary, flex: 1 }}>{cue}</Text>
              </View>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="Your progress" />
      {pr ? (
        <>
          <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Stat label="Best set" value={`${pr.kg}×${pr.reps}`} unit="kg" />
            <Stat label="Est. 1RM" value={Math.round(pr.e1rm)} unit="kg" />
            <Stat label="Change" value={`${gain >= 0 ? '+' : ''}${gain}%`} subColor={colors.success} sub={`${series.length} sessions`} />
          </Card>
          <Card style={{ marginTop: 10 }}>
            <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>ESTIMATED 1RM (kg)</Text>
            <LineChart data={series.map((p) => ({ label: shortDate(p.date), value: p.value }))} unit=" kg" color={c} />
          </Card>
          <SectionHeader title="History" />
          <Card style={{ gap: 12 }}>
            {history.map((w) => {
              const e = w.exercises.find((x) => x.exerciseId === id)!;
              return (
                <View key={w.id}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{shortDate(w.startedAt)} · {w.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{e.sets.map((x) => `${x.kg}×${x.reps}`).join('  ·  ')}</Text>
                </View>
              );
            })}
          </Card>
        </>
      ) : (
        <Empty icon="analytics-outline" title="No data yet" body="Log this exercise and your strength curve appears here." />
      )}

      <Button
        title="Train this now"
        icon="play"
        style={{ marginTop: space.xl }}
        onPress={() => {
          startWorkout({
            id: `quick-${ex.id}`,
            name: ex.name,
            focus: ex.muscle,
            weekday: null,
            estMinutes: 10,
            exercises: [{ exerciseId: ex.id, sets: 3, repsMin: ex.compound ? 6 : 10, repsMax: ex.compound ? 10 : 15, restSec: ex.compound ? 120 : 75 }],
          });
          router.push('/workout/active');
        }}
      />
    </Screen>
  );
}
