import React, { useState } from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Header, Card, Button, Stepper, Input, Chip, tap, success } from '../../src/components/ui';
import { colors, space } from '../../src/theme';
import { useStore } from '../../src/store/useStore';
import { Profile } from '../../src/types';
import { computeTargets } from '../../src/logic/nutrition';
import { aiBaseUrl } from '../../src/ai/client';

function Options<T extends string>({ value, onChange, options }: { value: T; onChange: (v: T) => void; options: [T, string, string?][] }) {
  return (
    <View style={{ gap: 10 }}>
      {options.map(([k, title, desc]) => {
        const active = k === value;
        return (
          <Pressable
            key={k}
            onPress={() => (tap(), onChange(k))}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              padding: 16,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primaryDim : colors.card,
            }}
          >
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }}>{title}</Text>
              {desc ? <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{desc}</Text> : null}
            </View>
            <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={active ? colors.primary : colors.faint} />
          </Pressable>
        );
      })}
    </View>
  );
}

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => (
  <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
    <Text style={{ color: colors.text, fontWeight: '700' }}>{label}</Text>
    {children}
  </Card>
);

const TITLES: Record<string, string> = {
  goal: 'Goals',
  body: 'Body stats',
  activity: 'Activity level',
  training: 'Training preferences',
  equipment: 'Equipment',
  diet: 'Diet preference',
  targets: 'Daily targets',
  ai: 'AI server',
};

export default function EditProfile() {
  const { field = 'goal' } = useLocalSearchParams<{ field: string }>();
  const router = useRouter();
  const s = useStore();
  const [p, setP] = useState<Profile>(s.profile!);
  const [kcalAdj, setKcalAdj] = useState(s.kcalAdjust);
  const [url, setUrl] = useState(s.settings.ai.serverUrl);
  const [testing, setTesting] = useState(false);
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const preview = computeTargets(p, kcalAdj);

  const programFields = ['goal', 'training', 'equipment'];

  const save = () => {
    if (field === 'ai') {
      s.updateSettings((st) => ({ ...st, ai: { ...st.ai, serverUrl: url.trim() } }));
      success();
      return router.back();
    }
    if (field === 'targets') {
      useStore.setState({ kcalAdjust: kcalAdj });
    }
    s.updateProfile(p);
    success();
    if (programFields.includes(field)) {
      Alert.alert('Rebuild your program?', 'Your coach can rebuild your training program to match the new settings. History and PRs are kept.', [
        { text: 'Keep current', style: 'cancel', onPress: () => router.back() },
        {
          text: 'Rebuild',
          onPress: () => {
            s.regenerateProgram();
            router.back();
          },
        },
      ]);
    } else router.back();
  };

  const testServer = async () => {
    const base = aiBaseUrl(url);
    if (!base) return Alert.alert('Enter a URL first');
    setTesting(true);
    try {
      const r = await fetch(`${base}/health`);
      const j = await r.json();
      Alert.alert('Connected ✅', `Model: ${j.model ?? 'unknown'}`);
    } catch (e) {
      Alert.alert('Could not connect', String((e as Error).message));
    } finally {
      setTesting(false);
    }
  };

  return (
    <Screen edges={['top', 'bottom']}>
      <Header back title={TITLES[field] ?? 'Edit'} />
      <View style={{ gap: 12 }}>
        {field === 'goal' && (
          <>
            <Options
              value={p.goal}
              onChange={(goal) => set({ goal })}
              options={[
                ['build', 'Build muscle', 'Lean surplus, hypertrophy focus'],
                ['lose', 'Lose fat', 'Moderate deficit, keep strength'],
                ['maintain', 'Maintain & get fit', 'Maintenance calories, recomp'],
              ]}
            />
            <Row label="Goal weight">
              <Stepper value={p.targetWeightKg} onChange={(targetWeightKg) => set({ targetWeightKg })} step={0.5} decimals={1} min={35} max={250} suffix="kg" />
            </Row>
          </>
        )}

        {field === 'body' && (
          <>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Chip label="Male" active={p.sex === 'male'} onPress={() => set({ sex: 'male' })} />
              <Chip label="Female" active={p.sex === 'female'} onPress={() => set({ sex: 'female' })} />
            </View>
            <Row label="Age">
              <Stepper value={p.age} onChange={(age) => set({ age })} min={13} max={90} suffix="yrs" />
            </Row>
            <Row label="Height">
              <Stepper value={p.heightCm} onChange={(heightCm) => set({ heightCm })} min={120} max={230} suffix="cm" />
            </Row>
            <Row label="Weight">
              <Stepper value={p.weightKg} onChange={(weightKg) => set({ weightKg })} step={0.5} decimals={1} min={35} max={250} suffix="kg" />
            </Row>
          </>
        )}

        {field === 'activity' && (
          <Options
            value={p.activity}
            onChange={(activity) => set({ activity })}
            options={[
              ['sedentary', 'Sedentary', 'Desk job, little walking'],
              ['light', 'Lightly active', '5–7k steps a day'],
              ['moderate', 'Moderate', '7–10k steps'],
              ['active', 'Active', 'Physical job or 10k+ steps'],
              ['very', 'Very active', 'Heavy labour or athlete'],
            ]}
          />
        )}

        {field === 'training' && (
          <>
            <Row label="Days per week">
              <Stepper value={p.daysPerWeek} onChange={(daysPerWeek) => set({ daysPerWeek })} min={2} max={6} />
            </Row>
            <Row label="Session length">
              <Stepper value={p.sessionMinutes} onChange={(sessionMinutes) => set({ sessionMinutes })} step={5} min={20} max={120} suffix="min" />
            </Row>
            <Options
              value={p.experience}
              onChange={(experience) => set({ experience })}
              options={[
                ['beginner', 'Beginner', '< 1 year'],
                ['intermediate', 'Intermediate', '1–3 years'],
                ['advanced', 'Advanced', '3+ years'],
              ]}
            />
          </>
        )}

        {field === 'equipment' && (
          <Options
            value={p.equipment}
            onChange={(equipment) => set({ equipment })}
            options={[
              ['gym', 'Full gym', 'Barbells, machines, cables'],
              ['home', 'Home gym', 'Barbell, dumbbells, bench'],
              ['dumbbells', 'Dumbbells only'],
              ['bodyweight', 'Bodyweight', 'No equipment'],
            ]}
          />
        )}

        {field === 'diet' && (
          <Options
            value={p.diet}
            onChange={(diet) => set({ diet })}
            options={[
              ['none', 'No preference'],
              ['vegetarian', 'Vegetarian'],
              ['vegan', 'Vegan'],
              ['pescatarian', 'Pescatarian'],
              ['keto', 'Low carb / Keto'],
            ]}
          />
        )}

        {field === 'targets' && (
          <>
            <Text style={{ color: colors.muted }}>
              Targets are calculated from your profile (Mifflin-St Jeor + activity). Fine-tune calories here — macros follow automatically.
            </Text>
            <Row label="Calorie adjustment">
              <Stepper value={kcalAdj} onChange={setKcalAdj} step={50} min={-800} max={800} suffix="kcal" />
            </Row>
            <Card>
              <Text style={{ color: colors.text, fontSize: 28, fontWeight: '800' }}>{preview.kcal.toLocaleString()} kcal</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Protein {preview.protein} g · Carbs {preview.carbs} g · Fat {preview.fat} g
              </Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>
                Water {(preview.waterMl / 1000).toFixed(1)} L · Steps {preview.steps.toLocaleString()}
              </Text>
            </Card>
          </>
        )}

        {field === 'ai' && (
          <>
            <Text style={{ color: colors.muted, lineHeight: 20 }}>
              Run the small server in the project's /server folder on your computer (it holds your API key safely), then enter its address — e.g. http://192.168.1.20:8787. Leave empty to use the offline coach.
            </Text>
            <Input value={url} onChangeText={setUrl} placeholder="http://192.168.x.x:8787" autoCapitalize="none" autoCorrect={false} keyboardType="url" icon="cloud-outline" />
            <Button title="Test connection" variant="secondary" icon="pulse" loading={testing} onPress={testServer} />
          </>
        )}
      </View>
      <Button title="Save" onPress={save} style={{ marginTop: space.xl }} />
    </Screen>
  );
}
