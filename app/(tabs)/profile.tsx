import React from 'react';
import { View, Text, Switch, Alert, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Screen, Header, Card, ListRow, Divider, SectionHeader, Button, Segmented, success } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { showHeight, showWeight, weightUnit } from '../../src/logic/units';
import { bmi } from '../../src/logic/nutrition';

const GOAL = { build: 'Build muscle', lose: 'Lose fat', maintain: 'Maintain & get fit' };
const ACT = { sedentary: 'Sedentary', light: 'Lightly active', moderate: 'Moderate', active: 'Active', very: 'Very active' };
const EQUIP = { gym: 'Full gym', home: 'Home gym', dumbbells: 'Dumbbells only', bodyweight: 'Bodyweight' };
const DIET = { none: 'No preference', vegetarian: 'Vegetarian', vegan: 'Vegan', pescatarian: 'Pescatarian', keto: 'Low carb / Keto' };

export default function Profile() {
  const router = useRouter();
  const s = useStore();
  const p = s.profile!;
  const t = s.targets!;
  const edit = (field: string) => router.push({ pathname: '/profile/edit', params: { field } });
  const n = s.settings.notifications;
  const ai = s.settings.ai;

  return (
    <Screen>
      <Header large title="Profile" />
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <LinearGradient colors={[colors.primaryLight, colors.primaryDeep]} style={styles.avatar}>
            <Text style={{ color: '#fff', fontSize: 26, fontWeight: '800' }}>{p.name.charAt(0).toUpperCase()}</Text>
          </LinearGradient>
          <View style={{ flex: 1 }}>
            <Text style={{ color: colors.text, fontSize: 20, fontWeight: '800' }}>{p.name}</Text>
            <Text style={{ color: colors.muted, marginTop: 2 }}>
              {GOAL[p.goal]} · {p.experience}
            </Text>
          </View>
        </View>
        <View style={{ flexDirection: 'row', marginTop: space.lg }}>
          {(
            [
              [p.age, 'Age'],
              [showHeight(p.heightCm, p.units), 'Height'],
              [`${showWeight(p.weightKg, p.units)} ${weightUnit(p.units)}`, 'Weight'],
              [bmi(p).toFixed(1), 'BMI'],
            ] as const
          ).map(([v, l]) => (
            <View key={l} style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ color: colors.text, fontSize: 17, fontWeight: '800' }}>{v}</Text>
              <Text style={{ color: colors.muted, fontSize: 12, marginTop: 2 }}>{l}</Text>
            </View>
          ))}
        </View>
      </Card>

      <SectionHeader title="Daily targets" action="Adjust" onAction={() => edit('targets')} />
      <Card style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        {(
          [
            [t.kcal.toLocaleString(), 'kcal', colors.text],
            [`${t.protein} g`, 'protein', colors.protein],
            [`${t.carbs} g`, 'carbs', colors.carbs],
            [`${t.fat} g`, 'fat', colors.fat],
          ] as const
        ).map(([v, l, c]) => (
          <View key={l} style={{ alignItems: 'center', flex: 1 }}>
            <Text style={{ color: c, fontWeight: '800', fontSize: 16 }}>{v}</Text>
            <Text style={{ color: colors.muted, fontSize: 12 }}>{l}</Text>
          </View>
        ))}
      </Card>
      {s.kcalAdjust ? (
        <Text style={{ color: colors.muted, fontSize: 12, marginTop: 6 }}>
          Includes {s.kcalAdjust > 0 ? '+' : ''}
          {s.kcalAdjust} kcal from AI coach adjustments.
        </Text>
      ) : null}

      <SectionHeader title="Me" />
      <Card style={{ paddingVertical: 2 }}>
        <ListRow icon="flag" title="Goals" subtitle={`${GOAL[p.goal]} → ${showWeight(p.targetWeightKg, p.units)} ${weightUnit(p.units)}`} chevron onPress={() => edit('goal')} />
        <Divider />
        <ListRow icon="body" iconColor={colors.recovery} title="Body stats" subtitle={`${p.sex === 'male' ? 'Male' : 'Female'}, ${p.age} yrs, ${showHeight(p.heightCm, p.units)}`} chevron onPress={() => edit('body')} />
        <Divider />
        <ListRow icon="walk" iconColor={colors.steps} title="Activity level" subtitle={ACT[p.activity]} chevron onPress={() => edit('activity')} />
        <Divider />
        <ListRow icon="barbell" iconColor={colors.primaryLight} title="Training preferences" subtitle={`${p.daysPerWeek} days/week · ${p.sessionMinutes} min · ${p.experience}`} chevron onPress={() => edit('training')} />
        <Divider />
        <ListRow icon="construct" iconColor={colors.warning} title="Equipment" subtitle={EQUIP[p.equipment]} chevron onPress={() => edit('equipment')} />
        <Divider />
        <ListRow icon="nutrition" iconColor={colors.success} title="Diet preference" subtitle={DIET[p.diet]} chevron onPress={() => edit('diet')} />
      </Card>

      <SectionHeader title="Units" />
      <Segmented
        value={p.units}
        onChange={(units) => s.updateProfile({ units })}
        options={[
          { key: 'metric', label: 'Metric (kg, cm)' },
          { key: 'imperial', label: 'Imperial (lb, in)' },
        ]}
      />

      <SectionHeader title="Notifications" />
      <Card style={{ paddingVertical: 2 }}>
        {(
          [
            ['workout', 'Workout reminders', 'barbell-outline'],
            ['meals', 'Meal logging reminders', 'restaurant-outline'],
            ['water', 'Hydration nudges', 'water-outline'],
            ['weeklyReport', 'Weekly AI report', 'document-text-outline'],
          ] as const
        ).map(([k, label, icon], i) => (
          <View key={k}>
            {i ? <Divider /> : null}
            <ListRow
              icon={icon}
              title={label}
              right={
                <Switch
                  value={n[k]}
                  trackColor={{ true: colors.primary, false: colors.card3 }}
                  onValueChange={(v) => s.updateSettings((st) => ({ ...st, notifications: { ...st.notifications, [k]: v } }))}
                />
              }
            />
          </View>
        ))}
      </Card>

      <SectionHeader title="AI Coach" />
      <Card style={{ paddingVertical: 2 }}>
        <ListRow
          icon="sparkles"
          title="Proactive recommendations"
          subtitle="Show coach insights on Home"
          right={<Switch value={ai.proactive} trackColor={{ true: colors.primary, false: colors.card3 }} onValueChange={(v) => s.updateSettings((st) => ({ ...st, ai: { ...st.ai, proactive: v } }))} />}
        />
        <Divider />
        <ListRow
          icon="analytics"
          iconColor={colors.recovery}
          title="Suggest calorie adjustments"
          subtitle="Learns from your weight trend"
          right={<Switch value={ai.autoAdjustTargets} trackColor={{ true: colors.primary, false: colors.card3 }} onValueChange={(v) => s.updateSettings((st) => ({ ...st, ai: { ...st.ai, autoAdjustTargets: v } }))} />}
        />
        <Divider />
        <ListRow icon="chatbubbles" title="Coach tone" subtitle={ai.tone === 'supportive' ? 'Supportive' : 'Direct'} chevron onPress={() => s.updateSettings((st) => ({ ...st, ai: { ...st.ai, tone: st.ai.tone === 'supportive' ? 'direct' : 'supportive' } }))} />
        <Divider />
        <ListRow icon="cloud" iconColor={colors.water} title="AI server" subtitle={ai.serverUrl || process.env.EXPO_PUBLIC_AI_URL || 'Not connected — offline coach & demo scanner'} chevron onPress={() => edit('ai')} />
      </Card>

      {s.coachLog.length ? (
        <>
          <SectionHeader title="Coach history" />
          <Card style={{ gap: 10 }}>
            {s.coachLog.slice(-5).reverse().map((c, i) => (
              <Text key={i} style={{ color: colors.textSecondary, fontSize: 13 }}>
                {c.date}: {c.message}
              </Text>
            ))}
          </Card>
        </>
      ) : null}

      <SectionHeader title="App" />
      <Card style={{ gap: 10 }}>
        <Button
          title="Load demo data"
          icon="flask"
          variant="secondary"
          onPress={() =>
            Alert.alert('Load 12 weeks of demo data?', 'Fills workouts, meals, weight and sleep so you can test charts and the AI coach. This replaces your current logs.', [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Load', onPress: () => (s.loadDemoData(), success()) },
            ])
          }
        />
        <Button
          title="Reset everything"
          icon="trash"
          variant="danger"
          onPress={() =>
            Alert.alert('Reset app?', 'Deletes all your data and restarts onboarding.', [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'Reset',
                style: 'destructive',
                onPress: () => {
                  router.replace('/onboarding');
                  setTimeout(() => useStore.getState().resetAll(), 300);
                },
              },
            ])
          }
        />
      </Card>
      <Text style={{ color: colors.faint, textAlign: 'center', fontSize: 12, marginTop: space.lg }}>
        Forge 1.0 · Not medical advice. Talk to a professional before major diet or training changes.
      </Text>
    </Screen>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 64, height: 64, borderRadius: 32, alignItems: 'center', justifyContent: 'center' },
});
