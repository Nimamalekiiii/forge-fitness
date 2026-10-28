import React, { useMemo, useState } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Sheet } from '../../src/components/Sheet';
import { Screen, Card, SectionHeader, ProgressRing, ProgressBar, IconBadge, Chip, Button, Stepper, tap, success, hexA, IconName } from '../../src/components/ui';
import { InsightCard, useInsightAction } from '../../src/components/InsightCard';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { coachInsights, recovery, todayTotals, todaysTemplate, weeklyProgress, workoutDoneOn } from '../../src/logic/coach';
import { DAY_SHORT, dayKey, greeting, weekDays } from '../../src/logic/date';
import { useStepSync } from '../../src/logic/useStepSync';

export default function Home() {
  const router = useRouter();
  const s = useStore();
  const stepsAuto = useStepSync();
  const [sleepOpen, setSleepOpen] = useState(false);
  const [stepsOpen, setStepsOpen] = useState(false);
  const runInsight = useInsightAction();

  const profile = s.profile!;
  const targets = s.targets!;
  const now = new Date();
  const totals = useMemo(() => todayTotals(s, now), [s.meals, s.daily, s.targets]); // eslint-disable-line react-hooks/exhaustive-deps
  const insights = useMemo(() => coachInsights(s, now), [s]); // eslint-disable-line react-hooks/exhaustive-deps
  const weekly = useMemo(() => weeklyProgress(s, now), [s]); // eslint-disable-line react-hooks/exhaustive-deps
  const rec = useMemo(() => recovery(s), [s.workouts, s.daily]); // eslint-disable-line react-hooks/exhaustive-deps
  const tpl = todaysTemplate(s, now);
  const trained = workoutDoneOn(s, now);
  const { remaining, eaten, day } = totals;
  const top = s.settings.ai.proactive ? insights[0] : undefined;

  const focus: { icon: IconName; color: string; title: string; sub: string; done: boolean; onPress: () => void }[] = [
    {
      icon: 'barbell',
      color: colors.primary,
      title: tpl ? `${tpl.name} workout` : 'Rest & recover',
      sub: tpl ? (trained ? 'Completed — great work' : `${tpl.exercises.length} exercises • ${tpl.estMinutes} min`) : 'Light walk + stretching',
      done: trained,
      onPress: () => (tpl && !trained ? router.push({ pathname: '/workout/active', params: { template: tpl.id } }) : router.push('/(tabs)/workout')),
    },
    {
      icon: 'flame',
      color: colors.carbs,
      title: remaining.kcal >= 0 ? `${remaining.kcal.toLocaleString()} kcal remaining` : `${Math.abs(remaining.kcal)} kcal over`,
      sub: `${Math.round(eaten.kcal).toLocaleString()} / ${targets.kcal.toLocaleString()} kcal eaten`,
      done: remaining.kcal <= 0,
      onPress: () => router.push('/(tabs)/nutrition'),
    },
    {
      icon: 'restaurant',
      color: colors.protein,
      title: remaining.protein > 0 ? `${remaining.protein} g protein remaining` : 'Protein goal hit',
      sub: `${Math.round(eaten.protein)} / ${targets.protein} g`,
      done: remaining.protein <= 0,
      onPress: () => router.push('/nutrition/log'),
    },
    {
      icon: 'water',
      color: colors.water,
      title: remaining.waterMl > 0 ? `${(remaining.waterMl / 1000).toFixed(1)} L water remaining` : 'Hydration goal hit',
      sub: `${(day.waterMl / 1000).toFixed(1)} / ${(targets.waterMl / 1000).toFixed(1)} L`,
      done: remaining.waterMl <= 0,
      onPress: () => (success(), s.addWater(250)),
    },
  ];

  return (
    <Screen>
      {/* Header */}
      <View style={[styles.row, { justifyContent: 'space-between', paddingTop: space.sm }]}>
        <View>
          <Text style={{ color: colors.muted, fontSize: 15, fontWeight: '600' }}>{greeting(now)},</Text>
          <Text style={{ color: colors.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.6 }}>{profile.name} 👋</Text>
        </View>
        <View style={[styles.row, { gap: 10 }]}>
          <Pressable onPress={() => router.push('/coach')} style={styles.coachBtn}>
            <Ionicons name="sparkles" size={18} color={colors.primaryLight} />
          </Pressable>
          <Pressable onPress={() => router.push('/(tabs)/profile')}>
            <LinearGradient colors={[colors.primaryLight, colors.primaryDeep]} style={styles.avatar}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{profile.name.charAt(0).toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </View>

      {/* Week strip */}
      <View style={[styles.row, { justifyContent: 'space-between', marginTop: space.lg }]}>
        {weekDays(now).map((d, i) => {
          const isToday = dayKey(d) === dayKey(now);
          const did = s.workouts.some((w) => dayKey(new Date(w.startedAt)) === dayKey(d));
          const planned = s.program?.days.some((t) => t.weekday === i);
          return (
            <View key={i} style={[styles.dayPill, isToday && { backgroundColor: colors.primary, borderColor: colors.primary }]}>
              <Text style={{ color: isToday ? '#fff' : colors.muted, fontSize: 11, fontWeight: '600' }}>{DAY_SHORT[i]}</Text>
              <Text style={{ color: isToday ? '#fff' : colors.text, fontSize: 16, fontWeight: '800', marginTop: 2 }}>{d.getDate()}</Text>
              <View
                style={{
                  width: 5,
                  height: 5,
                  borderRadius: 3,
                  marginTop: 4,
                  backgroundColor: did ? (isToday ? '#fff' : colors.success) : planned ? (isToday ? 'rgba(255,255,255,0.5)' : colors.faint) : 'transparent',
                }}
              />
            </View>
          );
        })}
      </View>

      {/* Weekly goal + Today's focus */}
      <Card style={{ marginTop: space.lg }}>
        <View style={[styles.row, { gap: 16 }]}>
          <ProgressRing size={84} stroke={9} value={weekly.percent / 100} color={colors.primary} colorEnd={colors.primaryLight}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 18 }}>{weekly.percent}%</Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800', lineHeight: 22 }}>
              You're {weekly.percent}% toward your weekly goal.
            </Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 4 }}>
              {weekly.done}/{weekly.planned} workouts • {weekly.nutritionDays} on-target nutrition days
            </Text>
          </View>
        </View>
        <View style={{ height: 1, backgroundColor: colors.border, marginVertical: space.lg }} />
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', letterSpacing: 1, marginBottom: 6 }}>TODAY'S FOCUS</Text>
        {focus.map((f) => (
          <Pressable key={f.icon} onPress={() => (tap(), f.onPress())} style={({ pressed }) => [styles.row, { paddingVertical: 9, gap: 12, opacity: pressed ? 0.7 : 1 }]}>
            <IconBadge icon={f.icon} color={f.color} size={36} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{f.title}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 1 }}>{f.sub}</Text>
            </View>
            <Ionicons name={f.done ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={f.done ? colors.success : colors.faint} />
          </Pressable>
        ))}
      </Card>

      {/* AI Coach */}
      {top ? (
        <>
          <SectionHeader title="AI Coach" action={insights.length > 1 ? `${insights.length} insights` : 'Ask coach'} onAction={() => router.push('/coach')} />
          <LinearGradient colors={[hexA(colors.primary, 0.5), hexA(colors.recovery, 0.35)]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 1.2 }}>
            <View style={{ backgroundColor: colors.card, borderRadius: 17, padding: 16 }}>
              <View style={[styles.row, { gap: 8, marginBottom: 8 }]}>
                <Ionicons name="sparkles" size={14} color={colors.primaryLight} />
                <Text style={{ color: colors.primaryLight, fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>RECOMMENDATION</Text>
              </View>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{top.title}</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 14, lineHeight: 20, marginTop: 4 }}>{top.body}</Text>
              <View style={[styles.row, { gap: 10, marginTop: 14 }]}>
                {top.action ? <Button small title={top.action.label} onPress={() => runInsight(top)} /> : null}
                <Button small variant="secondary" title="Ask coach" icon="chatbubble-ellipses" onPress={() => router.push('/coach')} />
              </View>
            </View>
          </LinearGradient>
          {insights.slice(1, 3).map((i) => (
            <View key={i.id} style={{ marginTop: 10 }}>
              <InsightCard insight={i} />
            </View>
          ))}
        </>
      ) : null}

      {/* Daily goals */}
      <SectionHeader title="Daily Goals" />
      <View style={styles.grid}>
        <GoalTile
          icon="flame"
          color={colors.carbs}
          label="Calories"
          value={Math.round(eaten.kcal).toLocaleString()}
          target={`/ ${targets.kcal.toLocaleString()}`}
          pct={eaten.kcal / targets.kcal}
          onPress={() => router.push('/(tabs)/nutrition')}
        />
        <GoalTile
          icon="restaurant"
          color={colors.protein}
          label="Protein"
          value={`${Math.round(eaten.protein)} g`}
          target={`/ ${targets.protein} g`}
          pct={eaten.protein / targets.protein}
          onPress={() => router.push('/nutrition/log')}
        />
        <GoalTile
          icon="water"
          color={colors.water}
          label="Water"
          value={`${(day.waterMl / 1000).toFixed(2)} L`}
          target={`/ ${(targets.waterMl / 1000).toFixed(1)} L`}
          pct={day.waterMl / targets.waterMl}
          extra={
            <View style={[styles.row, { gap: 6, marginTop: 10 }]}>
              {[250, 500].map((ml) => (
                <Pressable key={ml} onPress={() => (success(), s.addWater(ml))} style={styles.miniBtn}>
                  <Text style={{ color: colors.water, fontWeight: '700', fontSize: 12 }}>+{ml}</Text>
                </Pressable>
              ))}
            </View>
          }
        />
        <GoalTile
          icon="walk"
          color={colors.steps}
          label={stepsAuto ? 'Steps • synced' : 'Steps'}
          value={day.steps.toLocaleString()}
          target={`/ ${targets.steps.toLocaleString()}`}
          pct={day.steps / targets.steps}
          onPress={stepsAuto ? undefined : () => setStepsOpen(true)}
        />
      </View>

      {/* Recovery */}
      <SectionHeader title="Recovery" action={rec.sleep ? `${rec.sleep} h sleep` : 'Log sleep'} onAction={() => setSleepOpen(true)} />
      <Card>
        <View style={[styles.row, { gap: 16 }]}>
          <ProgressRing size={76} stroke={8} value={rec.score / 100} color={rec.color}>
            <Text style={{ color: colors.text, fontWeight: '800', fontSize: 20 }}>{rec.score}</Text>
          </ProgressRing>
          <View style={{ flex: 1 }}>
            <Text style={{ color: rec.color, fontWeight: '800', fontSize: 16 }}>{rec.label}</Text>
            <Text style={{ color: colors.muted, fontSize: 13, marginTop: 3 }}>Based on sleep, energy and the muscles you trained in the last 72 h.</Text>
          </View>
        </View>
        <View style={{ marginTop: space.lg, gap: 10 }}>
          {[...rec.muscles]
            .sort((a, b) => a.readiness - b.readiness)
            .slice(0, 4)
            .map((m) => (
              <View key={m.muscle} style={[styles.row, { gap: 10 }]}>
                <Text style={{ color: colors.textSecondary, width: 86, fontSize: 13, fontWeight: '600' }}>{m.muscle}</Text>
                <View style={{ flex: 1 }}>
                  <ProgressBar value={m.readiness / 100} color={m.readiness > 75 ? colors.success : m.readiness > 50 ? colors.warning : colors.danger} />
                </View>
                <Text style={{ color: colors.muted, width: 38, textAlign: 'right', fontSize: 12 }}>{m.readiness}%</Text>
              </View>
            ))}
        </View>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700', marginTop: space.lg, marginBottom: 8 }}>HOW DO YOU FEEL TODAY?</Text>
        <View style={[styles.row, { justifyContent: 'space-between' }]}>
          {(['😫', '😕', '😐', '🙂', '💪'] as const).map((e, i) => {
            const val = (i + 1) as 1 | 2 | 3 | 4 | 5;
            const active = day.energy === val;
            return (
              <Pressable
                key={e}
                onPress={() => (tap(), s.setEnergy(val))}
                style={[styles.energy, active && { backgroundColor: colors.primaryDim, borderColor: colors.primary }]}
              >
                <Text style={{ fontSize: 22 }}>{e}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      {/* Quick actions */}
      <SectionHeader title="Quick Actions" />
      <View style={[styles.row, { gap: 10 }]}>
        {(
          [
            ['Log Meal', 'restaurant', '/nutrition/log'],
            ['Workout', 'play-circle', tpl && !trained ? `/workout/active?template=${tpl.id}` : '/(tabs)/workout'],
            ['Scan Food', 'scan', '/nutrition/scan'],
            ['Weigh In', 'scale', '/progress/log-body'],
          ] as [string, IconName, string][]
        ).map(([label, icon, href], i) => (
          <Pressable
            key={label}
            onPress={() => (tap(), router.push(href as never))}
            style={({ pressed }) => [styles.quick, i === 0 && { backgroundColor: colors.primary, borderColor: colors.primary }, { opacity: pressed ? 0.8 : 1 }]}
          >
            <Ionicons name={icon} size={24} color={i === 0 ? '#fff' : colors.text} />
            <Text style={{ color: i === 0 ? '#fff' : colors.textSecondary, fontSize: 11, fontWeight: '700', marginTop: 6 }}>{label}</Text>
          </Pressable>
        ))}
      </View>

      {/* Sleep modal */}
      <Sheet visible={sleepOpen} onClose={() => setSleepOpen(false)} title="How long did you sleep?">
        <View style={[styles.row, { flexWrap: 'wrap', gap: 8 }]}>
          {[5, 5.5, 6, 6.5, 7, 7.5, 8, 8.5, 9].map((h) => (
            <Chip key={h} label={`${h} h`} active={rec.sleep === h} onPress={() => (s.setSleep(h), setSleepOpen(false))} />
          ))}
        </View>
      </Sheet>

      <StepsSheet visible={stepsOpen} onClose={() => setStepsOpen(false)} initial={day.steps} onSave={(v) => s.setSteps(v)} />
    </Screen>
  );
}

function GoalTile({
  icon,
  color,
  label,
  value,
  target,
  pct,
  onPress,
  extra,
}: {
  icon: IconName;
  color: string;
  label: string;
  value: string;
  target: string;
  pct: number;
  onPress?: () => void;
  extra?: React.ReactNode;
}) {
  return (
    <View style={{ width: '48.5%' }}>
    <Card onPress={onPress} style={{ padding: 14 }}>
      <View style={[styles.row, { justifyContent: 'space-between' }]}>
        <IconBadge icon={icon} color={color} size={32} />
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '700' }}>{Math.min(999, Math.round(pct * 100))}%</Text>
      </View>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginTop: 10 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800', marginTop: 2 }} numberOfLines={1}>
        {value}
      </Text>
      <Text style={{ color: colors.faint, fontSize: 12, marginBottom: 8 }}>{target}</Text>
      <ProgressBar value={pct} color={color} />
      {extra}
    </Card>
    </View>
  );
}

function StepsSheet({ visible, onClose, initial, onSave }: { visible: boolean; onClose: () => void; initial: number; onSave: (v: number) => void }) {
  const [v, setV] = useState(initial);
  return (
    <Sheet visible={visible} onClose={onClose} title="Today's steps">
      <View style={{ alignItems: 'center' }}>
        <Stepper value={v} onChange={setV} step={500} max={60000} />
      </View>
      <Button
        title="Save"
        style={{ marginTop: 20 }}
        onPress={() => {
          onSave(v);
          onClose();
        }}
      />
    </Sheet>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  avatar: { width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center' },
  coachBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primaryDim,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(61,139,255,0.35)',
  },
  dayPill: {
    width: 44,
    paddingVertical: 8,
    borderRadius: 14,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, justifyContent: 'space-between' },
  miniBtn: { flex: 1, alignItems: 'center', paddingVertical: 6, borderRadius: 8, backgroundColor: hexA(colors.water, 0.12) },
  energy: { width: 54, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card2, borderWidth: 1, borderColor: colors.border },
  quick: { flex: 1, height: 82, borderRadius: 16, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
});
