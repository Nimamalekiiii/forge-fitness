import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, Image, Alert, StyleSheet, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { Screen, Header, Segmented, Card, SectionHeader, Button, Chip, Empty, IconButton, Pill, tap, success } from '../../src/components/ui';
import { LineChart, Sparkline } from '../../src/components/charts';
import { StatsBlock, RecordsList } from '../../src/components/StrengthStats';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { addDays, dayKey, shortDate } from '../../src/logic/date';
import { personalRecords, strengthSeries } from '../../src/logic/strength';
import { weeklyReport, reportSummary, weightTrend } from '../../src/logic/coach';
import { showWeight, weightUnit, showLength, lengthUnit } from '../../src/logic/units';
import { ProgressPhoto } from '../../src/types';

type Tab = 'overview' | 'stats' | 'photos' | 'records' | 'reports';
type Range = '1M' | '3M' | '6M' | '1Y' | 'All';
const RANGE_DAYS: Record<Range, number> = { '1M': 30, '3M': 91, '6M': 182, '1Y': 365, All: 100000 };

export default function Progress() {
  const [tab, setTab] = useState<Tab>('overview');
  const router = useRouter();
  return (
    <Screen>
      <Header large title="Progress" right={<IconButton icon="add" bg={colors.primary} color="#fff" onPress={() => router.push('/progress/log-body')} />} />
      <Segmented
        scroll
        value={tab}
        onChange={setTab}
        options={[
          { key: 'overview', label: 'Overview' },
          { key: 'stats', label: 'Stats' },
          { key: 'photos', label: 'Photos' },
          { key: 'records', label: 'Records' },
          { key: 'reports', label: 'Reports' },
        ]}
      />
      {tab === 'overview' && <Overview />}
      {tab === 'stats' && <StatsBlock />}
      {tab === 'photos' && <Photos />}
      {tab === 'records' && <RecordsList />}
      {tab === 'reports' && <Reports />}
    </Screen>
  );
}

function Overview() {
  const router = useRouter();
  const s = useStore();
  const units = s.profile?.units ?? 'metric';
  const [range, setRange] = useState<Range>('3M');
  const since = dayKey(addDays(new Date(), -RANGE_DAYS[range]));
  const body = s.body.filter((b) => b.date >= since);

  const series = (k: 'weightKg' | 'bodyFat' | 'muscleKg') => body.filter((b) => b[k] !== undefined).map((b) => ({ date: b.date, value: b[k]! }));
  const w = series('weightKg');
  const bf = series('bodyFat');
  const mm = series('muscleKg');

  const strength = useMemo(() => {
    const top = personalRecords(s.workouts).slice(0, 3);
    const pts: number[] = [];
    let change = 0;
    top.forEach((p) => {
      const ser = strengthSeries(s.workouts, p.exerciseId).filter((x) => x.date.slice(0, 10) >= since);
      if (ser.length > 1) change += (ser[ser.length - 1].value - ser[0].value) / ser[0].value;
      ser.forEach((x, i) => (pts[i] = (pts[i] ?? 0) + x.value));
    });
    return { pct: top.length ? Math.round((change / top.length) * 100) : 0, pts };
  }, [s.workouts, since]);

  const delta = (arr: { value: number }[]) => (arr.length > 1 ? Math.round((arr[arr.length - 1].value - arr[0].value) * 10) / 10 : 0);
  const trend = weightTrend(s, 28);
  const latest = [...s.body].reverse();
  const meas = (k: 'waistCm' | 'chestCm' | 'armCm' | 'thighCm') => latest.find((b) => b[k] !== undefined)?.[k];

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.md }}>
        {(Object.keys(RANGE_DAYS) as Range[]).map((r) => (
          <Chip key={r} label={r} active={r === range} onPress={() => setRange(r)} />
        ))}
      </View>

      <View style={styles.grid}>
        <MetricCard
          label="Weight"
          value={w.length ? `${showWeight(w[w.length - 1].value, units)}` : '—'}
          unit={weightUnit(units)}
          change={delta(w) ? `${delta(w) > 0 ? '+' : ''}${showWeight(delta(w), units)} ${weightUnit(units)}` : ''}
          good={s.profile?.goal === 'lose' ? delta(w) <= 0 : delta(w) >= 0}
          values={w.map((x) => x.value)}
        />
        <MetricCard label="Body Fat" value={bf.length ? `${bf[bf.length - 1].value}` : '—'} unit="%" change={delta(bf) ? `${delta(bf) > 0 ? '+' : ''}${delta(bf)}%` : ''} good={delta(bf) <= 0} values={bf.map((x) => x.value)} />
        <MetricCard
          label="Muscle Mass"
          value={mm.length ? `${showWeight(mm[mm.length - 1].value, units)}` : '—'}
          unit={weightUnit(units)}
          change={delta(mm) ? `${delta(mm) > 0 ? '+' : ''}${showWeight(delta(mm), units)} ${weightUnit(units)}` : ''}
          good={delta(mm) >= 0}
          values={mm.map((x) => x.value)}
        />
        <MetricCard label="Strength" value={`${strength.pct >= 0 ? '+' : ''}${strength.pct}`} unit="%" change={`vs ${range === 'All' ? 'start' : `last ${range}`}`} good values={strength.pts} neutralChange />
      </View>

      <SectionHeader title="Weight trend" action="Log weight" onAction={() => router.push('/progress/log-body')} />
      <Card>
        <LineChart data={w.map((x) => ({ label: shortDate(x.date), value: showWeight(x.value, units) }))} unit={` ${weightUnit(units)}`} decimals={1} />
        {trend ? (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 8 }}>
            Trending {trend.kgPerWeek >= 0 ? '+' : ''}
            {showWeight(trend.kgPerWeek, units)} {weightUnit(units)}/week · goal {showWeight(s.profile!.targetWeightKg, units)} {weightUnit(units)}
          </Text>
        ) : null}
      </Card>

      <SectionHeader title="Measurements" action="Update" onAction={() => router.push('/progress/log-body')} />
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {(
          [
            ['Waist', meas('waistCm')],
            ['Chest', meas('chestCm')],
            ['Arm', meas('armCm')],
            ['Thigh', meas('thighCm')],
          ] as const
        ).map(([l, v]) => (
          <View key={l} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{v ? showLength(v, units) : '—'}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>
              {l} {v ? `(${lengthUnit(units)})` : ''}
            </Text>
          </View>
        ))}
      </Card>

      <SectionHeader title="Personal Records" action="See All" onAction={() => router.push('/progress/stats')} />
      <RecordsList limit={3} />
    </View>
  );
}

function MetricCard({ label, value, unit, change, good, values, neutralChange }: { label: string; value: string; unit: string; change: string; good: boolean; values: number[]; neutralChange?: boolean }) {
  return (
    <Card style={{ width: '48.5%', padding: 14 }}>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 24, fontWeight: '800', marginTop: 4 }}>
        {value}
        <Text style={{ fontSize: 13, color: colors.muted }}> {unit}</Text>
      </Text>
      <Text style={{ color: neutralChange ? colors.muted : good ? colors.success : colors.warning, fontSize: 12, fontWeight: '700', marginTop: 2, height: 16 }}>{change}</Text>
      <View style={{ marginTop: 8 }}>
        <Sparkline values={values} color={colors.primary} />
      </View>
    </Card>
  );
}

const PHOTO_W = (Dimensions.get('window').width - space.lg * 2 - 10) / 2;

function Photos() {
  const s = useStore();
  const [pose, setPose] = useState<ProgressPhoto['pose']>('front');
  const list = s.photos.filter((p) => p.pose === pose).sort((a, b) => a.date.localeCompare(b.date));
  const add = async (camera: boolean) => {
    const perm = camera ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return Alert.alert('Permission needed');
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.7, allowsEditing: true, aspect: [3, 4] };
    const r = camera ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!r.canceled && r.assets[0]) {
      success();
      s.addPhoto(r.assets[0].uri, pose);
    }
  };
  const first = list[0];
  const last = list[list.length - 1];
  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.md }}>
        {(['front', 'side', 'back'] as const).map((p) => (
          <Chip key={p} label={p[0].toUpperCase() + p.slice(1)} active={pose === p} onPress={() => setPose(p)} />
        ))}
      </View>
      {first && last && first.id !== last.id ? (
        <Card style={{ marginBottom: space.md }}>
          <Text style={{ color: colors.text, fontWeight: '800', marginBottom: 10 }}>Before → After</Text>
          <View style={{ flexDirection: 'row', gap: 10 }}>
            {[first, last].map((p) => (
              <View key={p.id} style={{ flex: 1 }}>
                <Image source={{ uri: p.uri }} style={{ width: '100%', aspectRatio: 3 / 4, borderRadius: 12 }} />
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{shortDate(p.date)}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        <Button title="Take photo" icon="camera" onPress={() => add(true)} style={{ flex: 1 }} />
        <Button title="Library" icon="images" variant="secondary" onPress={() => add(false)} style={{ flex: 1 }} />
      </View>
      {list.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: space.lg }}>
          {[...list].reverse().map((p) => (
            <Pressable
              key={p.id}
              onLongPress={() =>
                Alert.alert('Delete photo?', '', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => s.removePhoto(p.id) },
                ])
              }
            >
              <Image source={{ uri: p.uri }} style={{ width: PHOTO_W, height: PHOTO_W * 1.33, borderRadius: 14 }} />
              <View style={{ position: 'absolute', bottom: 8, left: 8 }}>
                <Pill text={shortDate(p.date)} color="#fff" />
              </View>
            </Pressable>
          ))}
        </View>
      ) : (
        <View style={{ marginTop: space.lg }}>
          <Empty icon="camera-outline" title="No photos yet" body="Same pose, same light, every 2 weeks. Photos stay private on your phone." />
        </View>
      )}
    </View>
  );
}

function Reports() {
  const s = useStore();
  const [mode, setMode] = useState<'weekly' | 'monthly'>('weekly');
  const weeks = useMemo(() => [0, 1, 2, 3].map((n) => weeklyReport(s, n)), [s]);
  const month = useMemo(() => {
    const agg = weeks.reduce(
      (a, r) => ({ workouts: a.workouts + r.workouts, minutes: a.minutes + r.minutes, volume: a.volume + r.volume, prs: a.prs + r.prs }),
      { workouts: 0, minutes: 0, volume: 0, prs: 0 }
    );
    const since = dayKey(addDays(new Date(), -28));
    const ws = s.body.filter((b) => b.weightKg && b.date >= since);
    return { ...agg, weight: ws.length > 1 ? Math.round((ws[ws.length - 1].weightKg! - ws[0].weightKg!) * 10) / 10 : null };
  }, [weeks, s.body]);

  return (
    <View>
      <View style={{ flexDirection: 'row', gap: 8, marginBottom: space.md }}>
        <Chip label="Weekly" active={mode === 'weekly'} onPress={() => setMode('weekly')} />
        <Chip label="Monthly" active={mode === 'monthly'} onPress={() => setMode('monthly')} />
      </View>
      {mode === 'monthly' ? (
        <Card tone="primary">
          <Text style={{ color: colors.primaryLight, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>LAST 4 WEEKS</Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginTop: 12, rowGap: 14 }}>
            {(
              [
                ['Workouts', month.workouts],
                ['Hours', Math.round(month.minutes / 60)],
                ['Tonnes lifted', Math.round(month.volume / 1000)],
                ['New PRs', month.prs],
                ['Weight change', month.weight !== null ? `${month.weight >= 0 ? '+' : ''}${month.weight} kg` : '—'],
                ['Avg workouts/wk', (month.workouts / 4).toFixed(1)],
              ] as const
            ).map(([l, v]) => (
              <View key={l} style={{ width: '50%' }}>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{v}</Text>
                <Text style={{ color: colors.muted, fontSize: 12 }}>{l}</Text>
              </View>
            ))}
          </View>
        </Card>
      ) : (
        <View style={{ gap: 12 }}>
          {weeks.map((r, i) => (
            <Card key={i} tone={i === 0 ? 'primary' : 'default'}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{i === 0 ? 'This week' : i === 1 ? 'Last week' : `Week of ${shortDate(dayKey(r.start))}`}</Text>
                {r.prs ? <Pill text={`${r.prs} PR`} color={colors.warning} /> : null}
              </View>
              <View style={{ flexDirection: 'row', marginTop: 12 }}>
                {(
                  [
                    ['Workouts', r.workouts],
                    ['Avg kcal', r.avgKcal || '—'],
                    ['Avg protein', r.avgProtein ? `${r.avgProtein} g` : '—'],
                    ['Sleep', r.avgSleep ? `${r.avgSleep} h` : '—'],
                  ] as const
                ).map(([l, v]) => (
                  <View key={l} style={{ flex: 1 }}>
                    <Text style={{ color: colors.text, fontWeight: '800', fontSize: 16 }}>{v}</Text>
                    <Text style={{ color: colors.muted, fontSize: 11 }}>{l}</Text>
                  </View>
                ))}
              </View>
              <View style={{ flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'flex-start' }}>
                <Ionicons name="sparkles" size={14} color={colors.primaryLight} style={{ marginTop: 2 }} />
                <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, flex: 1 }}>{reportSummary(s, r)}</Text>
              </View>
            </Card>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: 10 },
});
