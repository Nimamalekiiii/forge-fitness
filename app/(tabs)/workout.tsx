import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Header, Segmented, Card, SectionHeader, Button, Empty, Pill, IconButton, tap, success, hexA } from '../../src/components/ui';
import { ExerciseList, ExerciseThumb } from '../../src/components/ExerciseList';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { nextWorkout, workoutDoneOn } from '../../src/logic/coach';
import { DAY_SHORT, DAY_LONG, addDays, dayKey, formatDuration, shortDate, startOfWeek } from '../../src/logic/date';
import { PROGRAM_LIBRARY } from '../../src/logic/program';
import { personalRecords } from '../../src/logic/strength';
import { exerciseById } from '../../src/data/exercises';
import { WorkoutTemplate } from '../../src/types';

type Tab = 'foryou' | 'programs' | 'library' | 'history';

export default function Workout() {
  const [tab, setTab] = useState<Tab>('foryou');
  const router = useRouter();
  return (
    <Screen>
      <Header
        large
        title="Workouts"
        right={<IconButton icon="add" bg={colors.primary} color="#fff" onPress={() => router.push('/workout/create')} />}
      />
      <Segmented
        value={tab}
        onChange={setTab}
        options={[
          { key: 'foryou', label: 'For You' },
          { key: 'programs', label: 'Programs' },
          { key: 'library', label: 'Exercises' },
          { key: 'history', label: 'History' },
        ]}
      />
      {tab === 'foryou' && <ForYou />}
      {tab === 'programs' && <Programs />}
      {tab === 'library' && <ExerciseList onPick={(ex) => router.push(`/exercise/${ex.id}`)} />}
      {tab === 'history' && <History />}
    </Screen>
  );
}

function ForYou() {
  const router = useRouter();
  const s = useStore();
  const nxt = nextWorkout(s);
  const prs = useMemo(() => personalRecords(s.workouts).slice(0, 3), [s.workouts]);
  const weekStart = startOfWeek();
  const start = (t: WorkoutTemplate) => router.push({ pathname: '/workout/active', params: { template: t.id } });

  return (
    <View>
      {s.active ? (
        <Card tone="primary" onPress={() => router.push('/workout/active')} style={{ marginBottom: space.lg, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
          <Ionicons name="pulse" size={22} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800' }}>{s.active.name} in progress</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Tap to resume</Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.primary} />
        </Card>
      ) : null}

      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: space.md }]}>
        <Text style={{ color: colors.text, fontSize: 20, fontWeight: '700' }}>{nxt?.inDays === 0 ? "Today's Workout" : 'Next Workout'}</Text>
        {nxt && nxt.inDays > 0 ? <Pill text={nxt.inDays === 1 ? 'Tomorrow' : DAY_LONG[s.program!.days.find((d) => d.id === nxt.template.id)!.weekday!]} /> : null}
      </View>

      {nxt ? (
        <LinearGradient colors={['#173A73', '#0F1B33', colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.hero}>
          <Ionicons name="barbell" size={150} color="rgba(255,255,255,0.05)" style={{ position: 'absolute', right: -20, top: -10, transform: [{ rotate: '-25deg' }] }} />
          <Text style={{ color: colors.primaryLight, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{s.program?.name.toUpperCase()}</Text>
          <Text style={{ color: '#fff', fontSize: 30, fontWeight: '800', marginTop: 6 }}>{nxt.template.name}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{nxt.template.focus}</Text>
          <View style={[styles.row, { gap: 16, marginTop: 12 }]}>
            <View style={[styles.row, { gap: 6 }]}>
              <Ionicons name="time-outline" size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{nxt.template.estMinutes} min</Text>
            </View>
            <View style={[styles.row, { gap: 6 }]}>
              <Ionicons name="list" size={16} color={colors.textSecondary} />
              <Text style={{ color: colors.textSecondary, fontWeight: '600' }}>{nxt.template.exercises.length} exercises</Text>
            </View>
          </View>
          <View style={{ marginTop: 14, gap: 6 }}>
            {nxt.template.exercises.slice(0, 4).map((e) => (
              <Text key={e.exerciseId} style={{ color: colors.textSecondary, fontSize: 13 }}>
                • {exerciseById(e.exerciseId)?.name} — {e.sets}×{e.repsMin}-{e.repsMax}
              </Text>
            ))}
            {nxt.template.exercises.length > 4 ? <Text style={{ color: colors.muted, fontSize: 13 }}>+ {nxt.template.exercises.length - 4} more</Text> : null}
          </View>
          <Button title="Start Workout" icon="play" onPress={() => start(nxt.template)} style={{ marginTop: 18 }} />
        </LinearGradient>
      ) : (
        <Empty icon="calendar" title="No program yet" body="Generate a program tailored to your goal." />
      )}

      {s.program ? (
        <>
          <SectionHeader
            title="This Week"
            action={`${s.workouts.filter((w) => new Date(w.startedAt) >= weekStart).length} / ${s.program.days.length} workouts`}
          />
          <Card style={{ paddingVertical: 4 }}>
            {s.program.days.map((d, i) => {
              const date = addDays(weekStart, d.weekday ?? 0);
              const done = workoutDoneOn(s, date);
              const isToday = dayKey(date) === dayKey();
              return (
                <Pressable
                  key={d.id}
                  onPress={() => (tap(), start(d))}
                  style={[styles.row, { paddingVertical: 12, gap: 12, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }]}
                >
                  <View style={[styles.dayBox, isToday && { backgroundColor: colors.primary }]}>
                    <Text style={{ color: isToday ? '#fff' : colors.primaryLight, fontWeight: '800', fontSize: 12 }}>{DAY_SHORT[d.weekday ?? 0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{d.name}</Text>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>
                      {d.focus} • {d.estMinutes} min
                    </Text>
                  </View>
                  <Ionicons name={done ? 'checkmark-circle' : 'ellipse-outline'} size={24} color={done ? colors.success : colors.faint} />
                </Pressable>
              );
            })}
          </Card>
        </>
      ) : null}

      <SectionHeader title="My Workouts" action="Create" onAction={() => router.push('/workout/create')} />
      {s.customWorkouts.length ? (
        <View style={{ gap: 10 }}>
          {s.customWorkouts.map((w) => (
            <Card key={w.id} onPress={() => start(w)} style={[styles.row, { gap: 12 }]}>
              <View style={[styles.dayBox, { backgroundColor: colors.card3 }]}>
                <Ionicons name="flash" size={18} color={colors.warning} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontWeight: '700' }}>{w.name}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>
                  {w.exercises.length} exercises • ~{w.estMinutes} min
                </Text>
              </View>
              <Pressable
                hitSlop={10}
                onPress={() =>
                  Alert.alert('Delete workout?', w.name, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => s.deleteCustomWorkout(w.id) },
                  ])
                }
              >
                <Ionicons name="trash-outline" size={18} color={colors.faint} />
              </Pressable>
              <Ionicons name="play-circle" size={28} color={colors.primary} />
            </Card>
          ))}
        </View>
      ) : (
        <Card onPress={() => router.push('/workout/create')} style={[styles.row, { gap: 12, borderStyle: 'dashed' }]}>
          <Ionicons name="add-circle" size={28} color={colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '700' }}>Create a custom workout</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>Pick exercises, sets and reps</Text>
          </View>
        </Card>
      )}
      <Button
        title="Quick empty workout"
        variant="secondary"
        icon="flash"
        style={{ marginTop: 10 }}
        onPress={() => {
          s.startWorkout();
          router.push('/workout/active');
        }}
      />

      <SectionHeader title="Personal Records" action="See All" onAction={() => router.push('/progress/stats')} />
      {prs.length ? (
        <Card style={{ paddingVertical: 4 }}>
          {prs.map((p, i) => {
            const ex = exerciseById(p.exerciseId)!;
            return (
              <Pressable
                key={p.exerciseId}
                onPress={() => router.push(`/exercise/${p.exerciseId}`)}
                style={[styles.row, { paddingVertical: 12, gap: 12, borderTopWidth: i ? StyleSheet.hairlineWidth : 0, borderColor: colors.border }]}
              >
                <ExerciseThumb ex={ex} size={42} />
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontWeight: '700' }}>{ex.name}</Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>
                    {p.kg} kg × {p.reps} reps • {shortDate(p.date)}
                  </Text>
                </View>
                <Ionicons name="trophy" size={18} color={colors.warning} />
              </Pressable>
            );
          })}
        </Card>
      ) : (
        <Empty icon="trophy-outline" title="No records yet" body="Finish your first workout and your PRs show up here." />
      )}
    </View>
  );
}

function Programs() {
  const s = useStore();
  const router = useRouter();
  const p = s.program;
  return (
    <View>
      {p ? (
        <Card tone="primary">
          <Pill text="ACTIVE PROGRAM" />
          <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 10 }}>{p.name}</Text>
          <Text style={{ color: colors.textSecondary, marginTop: 4 }}>{p.description}</Text>
          <Text style={{ color: colors.muted, marginTop: 8, fontSize: 12 }}>
            Started {shortDate(p.startedAt)} • Week {Math.min(p.weeks, Math.floor((Date.now() - new Date(p.startedAt).getTime()) / (7 * 86400000)) + 1)} of {p.weeks}
          </Text>
          <View style={{ marginTop: 14, gap: 12 }}>
            {p.days.map((d) => (
              <View key={d.id}>
                <Text style={{ color: colors.text, fontWeight: '800' }}>
                  {d.weekday !== null ? DAY_SHORT[d.weekday] : ''} · {d.name}
                </Text>
                {d.exercises.map((e) => (
                  <Text key={e.exerciseId} style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>
                    {exerciseById(e.exerciseId)?.name} — {e.sets} × {e.repsMin}-{e.repsMax}
                  </Text>
                ))}
              </View>
            ))}
          </View>
        </Card>
      ) : null}

      <SectionHeader title="AI-generated programs" />
      <Text style={{ color: colors.muted, marginTop: -6, marginBottom: 12, fontSize: 13 }}>
        Each program is rebuilt for your equipment, experience and session length.
      </Text>
      <View style={{ gap: 10 }}>
        {PROGRAM_LIBRARY.map((item) => (
          <Card
            key={item.key}
            onPress={() =>
              Alert.alert(`Switch to ${item.title}?`, 'Your history and records are kept.', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Switch',
                  onPress: () => {
                    success();
                    s.regenerateProgram({ daysPerWeek: item.days, goal: item.goal, experience: item.key === 'fb3' ? 'beginner' : item.key === 'ppl6' ? 'advanced' : s.profile?.experience });
                  },
                },
              ])
            }
            style={[styles.row, { gap: 12 }]}
          >
            <View style={[styles.dayBox, { width: 48, height: 48, backgroundColor: hexA(colors.primary, 0.15) }]}>
              <Text style={{ color: colors.primaryLight, fontWeight: '800', fontSize: 16 }}>{item.days}×</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{item.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.faint} />
          </Card>
        ))}
      </View>
      <Button
        title="Rebuild from my profile"
        icon="sparkles"
        variant="secondary"
        style={{ marginTop: space.lg }}
        onPress={() => {
          success();
          s.regenerateProgram();
        }}
      />
      <Button title="Create custom workout" variant="ghost" style={{ marginTop: 6 }} onPress={() => router.push('/workout/create')} />
    </View>
  );
}

function History() {
  const s = useStore();
  const [open, setOpen] = useState<string | null>(null);
  const list = [...s.workouts].sort((a, b) => b.startedAt.localeCompare(a.startedAt));
  if (!list.length) return <Empty icon="time-outline" title="No workouts yet" body="Your completed sessions show up here." />;
  return (
    <View style={{ gap: 10 }}>
      {list.slice(0, 60).map((w) => (
        <Card key={w.id} onPress={() => setOpen(open === w.id ? null : w.id)}>
          <View style={[styles.row, { gap: 12 }]}>
            <View style={styles.dayBox}>
              <Text style={{ color: colors.primaryLight, fontWeight: '800', fontSize: 11 }}>{shortDate(w.startedAt)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>{w.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12 }}>
                {formatDuration(w.durationSec)} • {(w.volume / 1000).toFixed(1)} t volume • {w.exercises.length} exercises
              </Text>
            </View>
            {w.prs.length ? <Pill text={`${w.prs.length} PR`} color={colors.warning} /> : null}
          </View>
          {open === w.id ? (
            <View style={{ marginTop: 12, gap: 8 }}>
              {w.exercises.map((e) => (
                <View key={e.exerciseId}>
                  <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                    {exerciseById(e.exerciseId)?.name} {w.prs.includes(e.exerciseId) ? '🏆' : ''}
                  </Text>
                  <Text style={{ color: colors.muted, fontSize: 12 }}>{e.sets.map((x) => `${x.kg}×${x.reps}`).join('  ·  ')}</Text>
                </View>
              ))}
              <Button
                small
                variant="danger"
                title="Delete"
                style={{ alignSelf: 'flex-start', marginTop: 6 }}
                onPress={() =>
                  Alert.alert('Delete this workout?', '', [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Delete', style: 'destructive', onPress: () => s.deleteWorkoutLog(w.id) },
                  ])
                }
              />
            </View>
          ) : null}
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  hero: { borderRadius: 20, padding: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(61,139,255,0.25)' },
  dayBox: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
});
