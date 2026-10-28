import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { EXERCISES, MUSCLES, Muscle, Exercise } from '../data/exercises';
import { colors, space } from '../theme';
import { Chip, Input, tap, hexA, IconName } from './ui';

const MUSCLE_COLOR: Record<Muscle, string> = {
  Chest: '#3D8BFF',
  Back: '#2ED47A',
  Shoulders: '#A78BFA',
  Biceps: '#F5A623',
  Triceps: '#FF7A45',
  Quads: '#4FC3F7',
  Hamstrings: '#F472B6',
  Glutes: '#FB7185',
  Calves: '#34D399',
  Core: '#FACC15',
};

const EQUIP_ICON: Record<string, IconName> = {
  Barbell: 'barbell',
  Dumbbell: 'barbell-outline',
  Cable: 'git-commit',
  Machine: 'cog',
  Bodyweight: 'body',
  Kettlebell: 'bowling-ball',
  Band: 'infinite',
};

export const muscleColor = (m: Muscle) => MUSCLE_COLOR[m];

export function ExerciseThumb({ ex, size = 52 }: { ex: Exercise; size?: number }) {
  const c = MUSCLE_COLOR[ex.muscle];
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: 14,
        backgroundColor: hexA(c, 0.14),
        borderWidth: 1,
        borderColor: hexA(c, 0.25),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={EQUIP_ICON[ex.equipment] ?? 'barbell'} size={size * 0.45} color={c} />
    </View>
  );
}

export function ExerciseList({
  onPick,
  selected,
  allowed,
  header,
}: {
  onPick: (ex: Exercise) => void;
  selected?: string[];
  allowed?: string[];
  header?: React.ReactNode;
}) {
  const [q, setQ] = useState('');
  const [muscle, setMuscle] = useState<Muscle | 'All'>('All');
  const list = useMemo(
    () =>
      EXERCISES.filter(
        (e) =>
          (muscle === 'All' || e.muscle === muscle || e.secondary.includes(muscle)) &&
          (!q || e.name.toLowerCase().includes(q.toLowerCase()) || e.equipment.toLowerCase().includes(q.toLowerCase())) &&
          (!allowed || allowed.includes(e.equipment))
      ).sort((a, b) => (a.muscle === muscle ? -1 : 0) - (b.muscle === muscle ? -1 : 0)),
    [q, muscle, allowed]
  );
  return (
    <View>
      {header}
      <Input icon="search" placeholder="Search exercises…" value={q} onChangeText={setQ} autoCorrect={false} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingVertical: space.md }}>
        <Chip label="All" active={muscle === 'All'} onPress={() => setMuscle('All')} />
        {MUSCLES.map((m) => (
          <Chip key={m} label={m} active={muscle === m} onPress={() => setMuscle(m)} />
        ))}
      </ScrollView>
      <Text style={{ color: colors.muted, fontSize: 12, marginBottom: 4 }}>{list.length} exercises</Text>
      {list.map((ex) => {
        const isSel = selected?.includes(ex.id);
        return (
          <Pressable
            key={ex.id}
            onPress={() => (tap(), onPick(ex))}
            style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, opacity: pressed ? 0.7 : 1 })}
          >
            <ExerciseThumb ex={ex} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{ex.name}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>
                {ex.muscle} • {ex.equipment}
              </Text>
            </View>
            {selected ? (
              <Ionicons name={isSel ? 'checkmark-circle' : 'add-circle'} size={26} color={isSel ? colors.success : colors.primary} />
            ) : (
              <Ionicons name="chevron-forward" size={18} color={colors.faint} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
}
