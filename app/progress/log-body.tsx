import React, { useState } from 'react';
import { View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import { Screen, Header, Input, Button, Card, IconButton, success } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { dayKey } from '../../src/logic/date';
import { showLength, showWeight, toCm, toKg, weightUnit, lengthUnit } from '../../src/logic/units';
import { BodyLog } from '../../src/types';

export default function LogBody() {
  const router = useRouter();
  const s = useStore();
  const units = s.profile?.units ?? 'metric';
  const last = (k: keyof BodyLog) => [...s.body].reverse().find((b) => b[k] !== undefined)?.[k] as number | undefined;
  const str = (v?: number) => (v === undefined ? '' : String(v));

  const [f, setF] = useState({
    weight: str(last('weightKg') !== undefined ? showWeight(last('weightKg')!, units) : undefined),
    bodyFat: str(last('bodyFat')),
    muscle: str(last('muscleKg') !== undefined ? showWeight(last('muscleKg')!, units) : undefined),
    waist: '',
    chest: '',
    arm: '',
    thigh: '',
  });
  const n = (v: string) => {
    const x = Number(v.replace(',', '.'));
    return v.trim() && !isNaN(x) && x > 0 ? x : undefined;
  };

  const save = () => {
    const log: BodyLog = { date: dayKey() };
    const w = n(f.weight);
    if (w) log.weightKg = Math.round(toKg(w, units) * 10) / 10;
    if (n(f.bodyFat)) log.bodyFat = n(f.bodyFat);
    if (n(f.muscle)) log.muscleKg = Math.round(toKg(n(f.muscle)!, units) * 10) / 10;
    if (n(f.waist)) log.waistCm = toCm(n(f.waist)!, units);
    if (n(f.chest)) log.chestCm = toCm(n(f.chest)!, units);
    if (n(f.arm)) log.armCm = toCm(n(f.arm)!, units);
    if (n(f.thigh)) log.thighCm = toCm(n(f.thigh)!, units);
    s.addBodyLog(log);
    success();
    router.back();
  };

  const wu = weightUnit(units);
  const lu = lengthUnit(units);
  const ph = (k: keyof BodyLog) => {
    const v = last(k);
    return v !== undefined ? `Last: ${showLength(v, units)}` : 'Optional';
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header title="Log body stats" right={<IconButton icon="close" onPress={() => router.back()} />} />
      <Text style={{ color: colors.muted, marginBottom: space.lg }}>Weigh in the morning after the bathroom, before eating, for the most reliable trend.</Text>
      <Card style={{ gap: 10 }}>
        <Text style={{ color: colors.text, fontWeight: '800' }}>Body composition</Text>
        <Input placeholder="Weight" keyboardType="decimal-pad" value={f.weight} onChangeText={(weight) => setF({ ...f, weight })} suffix={wu} icon="scale-outline" autoFocus />
        <Input placeholder="Body fat (optional)" keyboardType="decimal-pad" value={f.bodyFat} onChangeText={(bodyFat) => setF({ ...f, bodyFat })} suffix="%" icon="water-outline" />
        <Input placeholder="Muscle mass (optional)" keyboardType="decimal-pad" value={f.muscle} onChangeText={(muscle) => setF({ ...f, muscle })} suffix={wu} icon="body-outline" />
      </Card>
      <Card style={{ gap: 10, marginTop: space.md }}>
        <Text style={{ color: colors.text, fontWeight: '800' }}>Measurements</Text>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input placeholder={`Waist · ${ph('waistCm')}`} keyboardType="decimal-pad" value={f.waist} onChangeText={(waist) => setF({ ...f, waist })} suffix={lu} />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder={`Chest · ${ph('chestCm')}`} keyboardType="decimal-pad" value={f.chest} onChangeText={(chest) => setF({ ...f, chest })} suffix={lu} />
          </View>
        </View>
        <View style={{ flexDirection: 'row', gap: 10 }}>
          <View style={{ flex: 1 }}>
            <Input placeholder={`Arm · ${ph('armCm')}`} keyboardType="decimal-pad" value={f.arm} onChangeText={(arm) => setF({ ...f, arm })} suffix={lu} />
          </View>
          <View style={{ flex: 1 }}>
            <Input placeholder={`Thigh · ${ph('thighCm')}`} keyboardType="decimal-pad" value={f.thigh} onChangeText={(thigh) => setF({ ...f, thigh })} suffix={lu} />
          </View>
        </View>
      </Card>
      <Button title="Save" onPress={save} style={{ marginTop: space.xl }} disabled={!n(f.weight) && !n(f.bodyFat) && !n(f.waist) && !n(f.arm) && !n(f.chest) && !n(f.thigh) && !n(f.muscle)} />
    </Screen>
  );
}
