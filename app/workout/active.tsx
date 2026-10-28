import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, TextInput, Alert, StyleSheet, Modal, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Button, IconButton, ProgressBar, Chip, tap, success, hexA, Header } from '../../src/components/ui';
import { ExerciseList, muscleColor } from '../../src/components/ExerciseList';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { exerciseById } from '../../src/data/exercises';
import { e1rm, lastPerformance, personalRecords, suggestNext } from '../../src/logic/strength';
import { formatDuration } from '../../src/logic/date';
import { swapOptions } from '../../src/logic/program';
import { SetLog } from '../../src/types';

export default function ActiveWorkout() {
  const router = useRouter();
  const { template } = useLocalSearchParams<{ template?: string }>();
  const s = useStore();
  const active = s.active;
  const [now, setNow] = useState(Date.now());
  const [restEnd, setRestEnd] = useState<number | null>(null);
  const [picker, setPicker] = useState<'add' | 'swap' | null>(null);
  const started = useRef(false);

  // Start or resume
  useEffect(() => {
    if (started.current) return;
    started.current = true;
    const tpl = [...(s.program?.days ?? []), ...s.customWorkouts].find((t) => t.id === template);
    if (!active && tpl) s.startWorkout(tpl);
    else if (!active && !tpl) s.startWorkout();
    else if (active && tpl && active.templateId !== tpl.id) {
      Alert.alert('Workout in progress', `You have "${active.name}" running. Discard it and start ${tpl.name}?`, [
        { text: 'Resume current', style: 'cancel' },
        { text: 'Start new', style: 'destructive', onPress: () => s.startWorkout(tpl) },
      ]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const restLeft = restEnd ? Math.max(0, Math.round((restEnd - now) / 1000)) : 0;
  useEffect(() => {
    if (restEnd && restLeft === 0) {
      success();
      setRestEnd(null);
    }
  }, [restLeft, restEnd]);

  const prs = useMemo(() => personalRecords(s.workouts), [s.workouts]);

  if (!active) return <View style={{ flex: 1, backgroundColor: colors.bg }} />;

  const idx = Math.min(active.currentIndex, Math.max(0, active.exercises.length - 1));
  const cur = active.exercises[idx];
  const ex = cur ? exerciseById(cur.exerciseId) : undefined;
  const elapsed = Math.round((now - new Date(active.startedAt).getTime()) / 1000);
  const totalSets = active.exercises.reduce((a, e) => a + e.sets.length, 0);
  const doneSets = active.exercises.reduce((a, e) => a + e.sets.filter((x) => x.done).length, 0);
  const prev = cur ? lastPerformance(s.workouts, cur.exerciseId) : null;
  const sug = cur?.target ? suggestNext(s.workouts, cur.target) : null;
  const bestE1rm = cur ? prs.find((p) => p.exerciseId === cur.exerciseId)?.e1rm ?? 0 : 0;

  const updateSet = (si: number, patch: Partial<SetLog>) =>
    s.updateActive((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) => (i === idx ? { ...e, sets: e.sets.map((st, j) => (j === si ? { ...st, ...patch } : st)) } : e)),
    }));

  const goTo = (i: number) => s.updateActive((a) => ({ ...a, currentIndex: Math.max(0, Math.min(a.exercises.length - 1, i)) }));

  const logNextSet = () => {
    if (!cur) return;
    const si = cur.sets.findIndex((x) => !x.done);
    if (si === -1) {
      if (idx < active.exercises.length - 1) goTo(idx + 1);
      return;
    }
    toggleSet(si);
  };

  const toggleSet = (si: number) => {
    if (!cur) return;
    const wasDone = cur.sets[si].done;
    updateSet(si, { done: !wasDone });
    if (!wasDone) {
      success();
      setRestEnd(Date.now() + (cur.target?.restSec ?? 90) * 1000);
      // Prefill next set with this set's values
      const nextSet = cur.sets[si + 1];
      if (nextSet && !nextSet.done && nextSet.kg === 0) updateSet(si + 1, { kg: cur.sets[si].kg });
      const allDone = cur.sets.every((x, j) => (j === si ? true : x.done));
      if (allDone && idx < active.exercises.length - 1) setTimeout(() => goTo(idx + 1), 600);
    }
  };

  const addSet = () =>
    s.updateActive((a) => ({
      ...a,
      exercises: a.exercises.map((e, i) =>
        i === idx ? { ...e, sets: [...e.sets, { kg: e.sets[e.sets.length - 1]?.kg ?? 0, reps: e.sets[e.sets.length - 1]?.reps ?? 8, done: false }] } : e
      ),
    }));

  const removeExercise = () =>
    s.updateActive((a) => ({ ...a, exercises: a.exercises.filter((_, i) => i !== idx), currentIndex: Math.max(0, idx - 1) }));

  const finish = () => {
    if (doneSets === 0) {
      Alert.alert('No sets logged', 'Discard this workout?', [
        { text: 'Keep going', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => (s.discardWorkout(), router.back()) },
      ]);
      return;
    }
    Alert.alert('Finish workout?', `${doneSets} of ${totalSets} sets completed.`, [
      { text: 'Keep going', style: 'cancel' },
      {
        text: 'Finish',
        onPress: () => {
          const log = s.finishWorkout();
          if (log) router.replace({ pathname: '/workout/summary', params: { id: log.id } });
        },
      },
    ]);
  };

  const mColor = ex ? muscleColor(ex.muscle) : colors.primary;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {/* Top bar */}
        <View style={[styles.row, { paddingHorizontal: space.lg, height: 56, justifyContent: 'space-between' }]}>
          <IconButton icon="chevron-down" onPress={() => router.back()} />
          <View style={{ alignItems: 'center' }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{active.name}</Text>
            <View style={[styles.row, { gap: 4 }]}>
              <Ionicons name="time-outline" size={12} color={colors.muted} />
              <Text style={{ color: colors.muted, fontSize: 12, fontVariant: ['tabular-nums'] }}>{formatDuration(elapsed)}</Text>
            </View>
          </View>
          <Pressable onPress={finish} style={styles.finish}>
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: 13 }}>Finish</Text>
          </Pressable>
        </View>
        <View style={[styles.row, { paddingHorizontal: space.lg, gap: 10 }]}>
          <View style={{ flex: 1 }}>
            <ProgressBar value={totalSets ? doneSets / totalSets : 0} />
          </View>
          <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>
            {active.exercises.length ? idx + 1 : 0}/{active.exercises.length}
          </Text>
        </View>

        {/* Exercise chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: space.lg, paddingVertical: space.md }} style={{ flexGrow: 0 }}>
          {active.exercises.map((e, i) => {
            const done = e.sets.length > 0 && e.sets.every((x) => x.done);
            return (
              <Chip
                key={`${e.exerciseId}-${i}`}
                label={`${done ? '✓ ' : ''}${exerciseById(e.exerciseId)?.name ?? ''}`}
                active={i === idx}
                onPress={() => goTo(i)}
              />
            );
          })}
          <Chip label="+ Add" icon="add" onPress={() => setPicker('add')} />
        </ScrollView>

        {!cur || !ex ? (
          <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
            <Ionicons name="barbell-outline" size={48} color={colors.faint} />
            <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: 12 }}>Add your first exercise</Text>
            <Button title="Add exercise" icon="add" onPress={() => setPicker('add')} style={{ marginTop: 16, alignSelf: 'stretch' }} />
          </View>
        ) : (
          <ScrollView contentContainerStyle={{ paddingHorizontal: space.lg, paddingBottom: 200 }} keyboardShouldPersistTaps="handled">
            <View style={styles.exCard}>
              <View style={[styles.row, { justifyContent: 'space-between' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{ex.name}</Text>
                  <Text style={{ color: colors.muted, marginTop: 2 }}>
                    {cur.sets.length} sets • {cur.target ? `${cur.target.repsMin}–${cur.target.repsMax} reps` : 'free'} • rest {cur.target?.restSec ?? 90}s
                  </Text>
                </View>
                <IconButton icon="swap-horizontal" onPress={() => setPicker('swap')} />
              </View>

              <LinearGradient colors={[hexA(mColor, 0.35), hexA(mColor, 0.05)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.visual}>
                <Ionicons name="barbell" size={86} color={hexA(mColor, 0.9)} />
                <View style={[styles.row, { position: 'absolute', bottom: 10, left: 12, gap: 6 }]}>
                  <View style={[styles.tag, { backgroundColor: hexA(mColor, 0.25) }]}>
                    <Text style={{ color: '#fff', fontSize: 11, fontWeight: '700' }}>{ex.muscle}</Text>
                  </View>
                  {ex.secondary.slice(0, 2).map((m) => (
                    <View key={m} style={[styles.tag, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
                      <Text style={{ color: colors.textSecondary, fontSize: 11, fontWeight: '700' }}>{m}</Text>
                    </View>
                  ))}
                </View>
              </LinearGradient>

              {ex.cues.length ? (
                <View style={{ marginTop: 12, gap: 4 }}>
                  {ex.cues.map((c) => (
                    <Text key={c} style={{ color: colors.textSecondary, fontSize: 13 }}>
                      • {c}
                    </Text>
                  ))}
                </View>
              ) : null}

              {sug ? (
                <View style={styles.coach}>
                  <Ionicons name="sparkles" size={16} color={colors.primaryLight} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>
                      {sug.kg > 0 ? `Target: ${sug.kg} kg × ${sug.reps}` : 'Coach tip'}
                    </Text>
                    <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                      {sug.note}
                      {prev ? `  Last: ${prev.map((p) => `${p.kg}×${p.reps}`).join(', ')}` : ''}
                    </Text>
                  </View>
                  {sug.kg > 0 ? (
                    <Pressable
                      onPress={() => {
                        tap();
                        cur.sets.forEach((st, i) => !st.done && updateSet(i, { kg: sug.kg, reps: sug.reps }));
                      }}
                    >
                      <Text style={{ color: colors.primary, fontWeight: '800', fontSize: 13 }}>Apply</Text>
                    </Pressable>
                  ) : null}
                </View>
              ) : null}
            </View>

            {/* Sets */}
            <View style={[styles.row, { paddingHorizontal: 6, marginTop: space.lg, marginBottom: 6 }]}>
              <Text style={[styles.colHead, { width: 36 }]}>SET</Text>
              <Text style={[styles.colHead, { flex: 1 }]}>KG</Text>
              <Text style={[styles.colHead, { flex: 1 }]}>REPS</Text>
              <View style={{ width: 44 }} />
            </View>
            {cur.sets.map((st, si) => {
              const isPR = st.done && st.kg > 0 && e1rm(st.kg, st.reps) > bestE1rm + 0.01;
              const isNext = !st.done && cur.sets.findIndex((x) => !x.done) === si;
              return (
                <View key={si} style={[styles.setRow, isNext && { borderColor: colors.primary, backgroundColor: colors.primaryDim }, st.done && { opacity: 0.75 }]}>
                  <View style={styles.setNum}>
                    <Text style={{ color: colors.text, fontWeight: '800' }}>{si + 1}</Text>
                  </View>
                  <NumInput value={st.kg} onChange={(kg) => updateSet(si, { kg })} decimal />
                  <NumInput value={st.reps} onChange={(reps) => updateSet(si, { reps })} />
                  {isPR ? <Text style={{ position: 'absolute', right: 56, fontSize: 16 }}>🏆</Text> : null}
                  <Pressable onPress={() => toggleSet(si)} hitSlop={8} style={{ width: 44, alignItems: 'center' }}>
                    <Ionicons name={st.done ? 'checkmark-circle' : 'ellipse-outline'} size={30} color={st.done ? colors.success : isNext ? colors.primary : colors.faint} />
                  </Pressable>
                </View>
              );
            })}
            <View style={[styles.row, { gap: 10, marginTop: 6 }]}>
              <Button small variant="secondary" title="Add set" icon="add" onPress={addSet} style={{ flex: 1 }} />
              <Button
                small
                variant="secondary"
                title="Remove"
                icon="trash-outline"
                onPress={() =>
                  Alert.alert('Remove exercise?', ex.name, [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Remove', style: 'destructive', onPress: removeExercise },
                  ])
                }
                style={{ flex: 1 }}
              />
            </View>
          </ScrollView>
        )}

        {/* Bottom controls */}
        {cur ? (
          <View style={styles.bottom}>
            {restEnd ? (
              <View style={[styles.row, styles.rest]}>
                <Ionicons name="hourglass-outline" size={18} color={colors.primaryLight} />
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, flex: 1, fontVariant: ['tabular-nums'] }}>Rest {formatDuration(restLeft)}</Text>
                <Pressable onPress={() => setRestEnd((r) => (r ?? Date.now()) + 30000)} hitSlop={8}>
                  <Text style={{ color: colors.primary, fontWeight: '800' }}>+30s</Text>
                </Pressable>
                <Pressable onPress={() => setRestEnd(null)} hitSlop={8} style={{ marginLeft: 16 }}>
                  <Text style={{ color: colors.muted, fontWeight: '800' }}>Skip</Text>
                </Pressable>
              </View>
            ) : null}
            <Button title={cur.sets.every((x) => x.done) ? (idx < active.exercises.length - 1 ? 'Next Exercise' : 'Finish Workout') : 'Log Set'} onPress={cur.sets.every((x) => x.done) && idx >= active.exercises.length - 1 ? finish : logNextSet} />
            <View style={[styles.row, { justifyContent: 'space-between', marginTop: 10 }]}>
              <Pressable onPress={() => goTo(idx - 1)} disabled={idx === 0} hitSlop={8}>
                <Text style={{ color: idx === 0 ? colors.faint : colors.textSecondary, fontWeight: '700' }}>‹ Previous</Text>
              </Pressable>
              <Pressable onPress={() => goTo(idx + 1)} disabled={idx >= active.exercises.length - 1} hitSlop={8}>
                <Text style={{ color: idx >= active.exercises.length - 1 ? colors.faint : colors.primary, fontWeight: '700' }}>Skip Exercise ›</Text>
              </Pressable>
            </View>
          </View>
        ) : null}
      </KeyboardAvoidingView>

      <Modal visible={!!picker} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicker(null)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ paddingHorizontal: space.lg }}>
            <Header title={picker === 'swap' ? 'Swap exercise' : 'Add exercise'} right={<IconButton icon="close" onPress={() => setPicker(null)} />} />
          </View>
          <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            {picker === 'swap' && ex && s.profile ? (
              <View style={{ marginBottom: space.lg }}>
                <Text style={{ color: colors.muted, fontWeight: '700', fontSize: 12, marginBottom: 6 }}>SUGGESTED ALTERNATIVES</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {swapOptions(ex.id, s.profile.equipment).slice(0, 4).map((alt) => (
                  <Chip
                    key={alt.id}
                    label={alt.name}
                    onPress={() => {
                      s.updateActive((a) => ({ ...a, exercises: a.exercises.map((e, i) => (i === idx ? { ...e, exerciseId: alt.id } : e)) }));
                      setPicker(null);
                    }}
                  />
                ))}
                </View>
              </View>
            ) : null}
            <ExerciseList
              onPick={(picked) => {
                if (picker === 'swap') {
                  s.updateActive((a) => ({ ...a, exercises: a.exercises.map((e, i) => (i === idx ? { ...e, exerciseId: picked.id } : e)) }));
                } else {
                  const last = lastPerformance(s.workouts, picked.id);
                  s.updateActive((a) => ({
                    ...a,
                    currentIndex: a.exercises.length,
                    exercises: [
                      ...a.exercises,
                      {
                        exerciseId: picked.id,
                        target: { exerciseId: picked.id, sets: 3, repsMin: 8, repsMax: 12, restSec: picked.compound ? 120 : 75 },
                        sets: Array.from({ length: 3 }, () => ({ kg: last?.[0]?.kg ?? 0, reps: 10, done: false })),
                      },
                    ],
                  }));
                }
                setPicker(null);
              }}
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

function NumInput({ value, onChange, decimal }: { value: number; onChange: (v: number) => void; decimal?: boolean }) {
  const [text, setText] = useState(String(value || ''));
  useEffect(() => {
    if (Number(text.replace(',', '.')) !== value) setText(value ? String(value) : '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);
  return (
    <View style={styles.numBox}>
      <TextInput
        value={text}
        onChangeText={(t) => {
          setText(t);
          const n = Number(t.replace(',', '.'));
          if (!isNaN(n)) onChange(n);
        }}
        keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
        selectTextOnFocus
        placeholder="0"
        placeholderTextColor={colors.faint}
        style={{ color: colors.text, fontSize: 17, fontWeight: '800', textAlign: 'center', paddingVertical: 0 }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  finish: { backgroundColor: colors.primary, paddingHorizontal: 16, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  exCard: { backgroundColor: colors.card, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 },
  visual: { height: 150, borderRadius: 16, marginTop: 14, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  tag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999 },
  coach: { flexDirection: 'row', gap: 10, alignItems: 'center', marginTop: 14, padding: 12, borderRadius: 14, backgroundColor: colors.primaryDim },
  colHead: { color: colors.muted, fontSize: 11, fontWeight: '800', letterSpacing: 1, textAlign: 'center' },
  setRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 6,
    marginBottom: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
  },
  setNum: { width: 36, height: 36, borderRadius: 10, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' },
  numBox: { flex: 1, height: 42, borderRadius: 10, backgroundColor: colors.card2, justifyContent: 'center' },
  bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: 34, backgroundColor: 'rgba(7,9,13,0.97)', borderTopWidth: 1, borderColor: colors.border },
  rest: { gap: 10, marginBottom: 12, padding: 12, borderRadius: 14, backgroundColor: colors.card2 },
});
