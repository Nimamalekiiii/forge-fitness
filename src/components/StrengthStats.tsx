import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Card, Chip, SectionHeader, Empty, Stat } from './ui';
import { LineChart, Bars } from './charts';
import { ExerciseThumb } from './ExerciseList';
import { colors, space } from '../theme';
import { useStore } from '../store/useStore';
import { personalRecords, strengthSeries } from '../logic/strength';
import { exerciseById } from '../data/exercises';
import { addDays, shortDate, startOfWeek, MONTH_SHORT } from '../logic/date';

export function StrengthChart() {
  const workouts = useStore((s) => s.workouts);
  const prs = useMemo(() => personalRecords(workouts), [workouts]);
  const [sel, setSel] = useState<string | null>(null);
  const id = sel ?? prs[0]?.exerciseId;
  const series = useMemo(() => (id ? strengthSeries(workouts, id) : []), [workouts, id]);
  if (!prs.length) return <Empty icon="analytics-outline" title="No strength data yet" body="Complete a workout to start tracking your strength." />;
  const first = series[0]?.value ?? 0;
  const last = series[series.length - 1]?.value ?? 0;
  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: space.md }}>
        {prs.slice(0, 10).map((p) => (
          <Chip key={p.exerciseId} label={exerciseById(p.exerciseId)?.name ?? p.exerciseId} active={p.exerciseId === id} onPress={() => setSel(p.exerciseId)} />
        ))}
      </ScrollView>
      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: space.md }}>
          <Stat label="Est. 1RM" value={Math.round(last)} unit="kg" />
          <Stat label="Since start" value={`${last - first >= 0 ? '+' : ''}${Math.round(last - first)}`} unit="kg" subColor={colors.success} sub={first ? `${Math.round(((last - first) / first) * 100)}%` : ''} />
          <Stat label="Sessions" value={series.length} />
        </View>
        <LineChart data={series.slice(-16).map((p) => ({ label: MONTH_SHORT[new Date(p.date).getMonth()], value: p.value }))} unit=" kg" height={210} />
      </Card>
    </View>
  );
}

export function WeeklyVolume() {
  const workouts = useStore((s) => s.workouts);
  const data = useMemo(() => {
    const start = startOfWeek();
    return Array.from({ length: 8 }, (_, i) => {
      const ws = addDays(start, -7 * (7 - i));
      const we = addDays(ws, 7);
      const vol = workouts.filter((w) => new Date(w.startedAt) >= ws && new Date(w.startedAt) < we).reduce((a, w) => a + w.volume, 0);
      return { label: `${ws.getDate()}/${ws.getMonth() + 1}`, value: Math.round(vol / 1000) };
    });
  }, [workouts]);
  return (
    <Card>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginBottom: 8 }}>WEEKLY VOLUME (tonnes)</Text>
      <Bars data={data} height={140} />
    </Card>
  );
}

export function RecordsList({ limit }: { limit?: number }) {
  const router = useRouter();
  const workouts = useStore((s) => s.workouts);
  const prs = useMemo(() => personalRecords(workouts), [workouts]);
  if (!prs.length) return <Empty icon="trophy-outline" title="No records yet" body="Every best lift you log is saved here automatically." />;
  return (
    <Card style={{ paddingVertical: 4 }}>
      {prs.slice(0, limit ?? prs.length).map((p, i) => {
        const ex = exerciseById(p.exerciseId)!;
        return (
          <Pressable
            key={p.exerciseId}
            onPress={() => router.push(`/exercise/${p.exerciseId}`)}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: i ? 0.5 : 0, borderColor: colors.border }}
          >
            <ExerciseThumb ex={ex} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{ex.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {p.kg} kg × {p.reps} reps · {shortDate(p.date)}
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ color: colors.text, fontWeight: '800' }}>{Math.round(p.e1rm)} kg</Text>
              <Text style={{ color: colors.muted, fontSize: 11 }}>est. 1RM</Text>
            </View>
            {i < 3 ? <Ionicons name="trophy" size={16} color={[colors.warning, '#C0C7D2', '#CD7F32'][i]} /> : null}
          </Pressable>
        );
      })}
    </Card>
  );
}

export function StatsBlock() {
  return (
    <View>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700', marginBottom: space.md }}>Strength Progress</Text>
      <StrengthChart />
      <SectionHeader title="Training Volume" />
      <WeeklyVolume />
      <SectionHeader title="Personal Records" />
      <RecordsList />
    </View>
  );
}
