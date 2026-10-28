import React, { useState } from 'react';
import { View, Text, ScrollView, Modal, Pressable, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Button, Card, Header, IconButton, Input, Empty, success } from '../../src/components/ui';
import { ExerciseList, ExerciseThumb } from '../../src/components/ExerciseList';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { exerciseById } from '../../src/data/exercises';
import { PlannedExercise, WorkoutTemplate } from '../../src/types';
import { uid } from '../../src/logic/date';

function MiniStepper({ label, value, onChange, step = 1, min = 1, max = 99 }: { label: string; value: number; onChange: (v: number) => void; step?: number; min?: number; max?: number }) {
  return (
    <View style={{ alignItems: 'center', flex: 1 }}>
      <Text style={{ color: colors.muted, fontSize: 11, fontWeight: '700', marginBottom: 6 }}>{label}</Text>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <Pressable hitSlop={6} onPress={() => onChange(Math.max(min, value - step))}>
          <Ionicons name="remove-circle" size={24} color={colors.faint} />
        </Pressable>
        <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16, minWidth: 30, textAlign: 'center' }}>{value}</Text>
        <Pressable hitSlop={6} onPress={() => onChange(Math.min(max, value + step))}>
          <Ionicons name="add-circle" size={24} color={colors.primary} />
        </Pressable>
      </View>
    </View>
  );
}

export default function CreateWorkout() {
  const router = useRouter();
  const save = useStore((s) => s.saveCustomWorkout);
  const startWorkout = useStore((s) => s.startWorkout);
  const [name, setName] = useState('');
  const [items, setItems] = useState<PlannedExercise[]>([]);
  const [picking, setPicking] = useState(false);

  const update = (i: number, patch: Partial<PlannedExercise>) => setItems((x) => x.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const build = (): WorkoutTemplate => ({
    id: uid(),
    name: name.trim() || 'My Workout',
    focus: [...new Set(items.map((i) => exerciseById(i.exerciseId)?.muscle))].join(' • '),
    weekday: null,
    exercises: items,
    estMinutes: Math.round(items.reduce((m, e) => m + e.sets * (45 + e.restSec), 0) / 60 + 5),
  });

  const onSave = (start: boolean) => {
    if (!items.length) return Alert.alert('Add at least one exercise');
    const t = build();
    save(t);
    success();
    if (start) {
      startWorkout(t);
      router.replace('/workout/active');
    } else router.back();
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: space.lg }}>
        <Header back title="Create Workout" />
      </View>
      <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 160 }} keyboardShouldPersistTaps="handled">
        <Input placeholder="Workout name, e.g. Arm Day" value={name} onChangeText={setName} icon="create-outline" />
        <View style={{ height: space.lg }} />
        {items.length === 0 ? (
          <Empty icon="barbell-outline" title="No exercises yet" body="Add exercises from the library." action="Add exercise" onAction={() => setPicking(true)} />
        ) : (
          <View style={{ gap: 10 }}>
            {items.map((it, i) => {
              const ex = exerciseById(it.exerciseId)!;
              return (
                <Card key={`${it.exerciseId}-${i}`}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <ExerciseThumb ex={ex} size={42} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700' }}>{ex.name}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{ex.muscle}</Text>
                    </View>
                    <Pressable hitSlop={8} onPress={() => setItems((x) => x.filter((_, j) => j !== i))}>
                      <Ionicons name="close-circle" size={22} color={colors.faint} />
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: 'row', marginTop: 14 }}>
                    <MiniStepper label="SETS" value={it.sets} onChange={(v) => update(i, { sets: v })} max={10} />
                    <MiniStepper label="MIN REPS" value={it.repsMin} onChange={(v) => update(i, { repsMin: v, repsMax: Math.max(v, it.repsMax) })} />
                    <MiniStepper label="MAX REPS" value={it.repsMax} onChange={(v) => update(i, { repsMax: Math.max(v, it.repsMin) })} />
                    <MiniStepper label="REST s" value={it.restSec} step={15} min={15} max={300} onChange={(v) => update(i, { restSec: v })} />
                  </View>
                </Card>
              );
            })}
            <Button title="Add exercise" icon="add" variant="secondary" onPress={() => setPicking(true)} />
          </View>
        )}
      </ScrollView>
      <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, padding: space.lg, paddingBottom: 34, backgroundColor: colors.bg, borderTopWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 10 }}>
        <Button title="Save" variant="secondary" onPress={() => onSave(false)} style={{ flex: 1 }} />
        <Button title="Save & Start" icon="play" onPress={() => onSave(true)} style={{ flex: 1.4 }} />
      </View>

      <Modal visible={picking} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setPicking(false)}>
        <View style={{ flex: 1, backgroundColor: colors.bg }}>
          <View style={{ paddingHorizontal: space.lg }}>
            <Header title="Add exercises" right={<IconButton icon="checkmark" bg={colors.primary} color="#fff" onPress={() => setPicking(false)} />} />
          </View>
          <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 60 }} keyboardShouldPersistTaps="handled">
            <ExerciseList
              selected={items.map((i) => i.exerciseId)}
              onPick={(ex) =>
                setItems((x) =>
                  x.some((i) => i.exerciseId === ex.id)
                    ? x.filter((i) => i.exerciseId !== ex.id)
                    : [...x, { exerciseId: ex.id, sets: 3, repsMin: ex.compound ? 6 : 10, repsMax: ex.compound ? 10 : 15, restSec: ex.compound ? 120 : 75 }]
                )
              }
            />
          </ScrollView>
        </View>
      </Modal>
    </SafeAreaView>
  );
}
