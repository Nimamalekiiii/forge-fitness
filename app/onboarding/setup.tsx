import React, { useEffect, useMemo, useRef, useState } from 'react';
import { View, Text, Pressable, ScrollView, KeyboardAvoidingView, Platform, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button, IconButton, Input, ProgressBar, Stepper, Card, tap, success, IconName } from '../../src/components/ui';
import { colors, font, space } from '../../src/theme';
import { Profile } from '../../src/types';
import { computeTargets } from '../../src/logic/nutrition';
import { generateProgram } from '../../src/logic/program';
import { exerciseById } from '../../src/data/exercises';
import { useStore } from '../../src/store/useStore';
import { DAY_SHORT } from '../../src/logic/date';

type Opt<T> = { key: T; title: string; desc?: string; icon: IconName };

function OptionList<T extends string | number>({ options, value, onChange }: { options: Opt<T>[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={{ gap: 10 }}>
      {options.map((o) => {
        const active = o.key === value;
        return (
          <Pressable
            key={String(o.key)}
            onPress={() => {
              tap();
              onChange(o.key);
            }}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 14,
              padding: 16,
              borderRadius: 16,
              borderWidth: 1.5,
              borderColor: active ? colors.primary : colors.border,
              backgroundColor: active ? colors.primaryDim : colors.card,
            }}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 14,
                backgroundColor: active ? colors.primary : colors.card2,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Ionicons name={o.icon} size={22} color={active ? '#fff' : colors.textSecondary} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: colors.text, fontSize: 16, fontWeight: '700' }}>{o.title}</Text>
              {o.desc ? <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }}>{o.desc}</Text> : null}
            </View>
            <Ionicons name={active ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={active ? colors.primary : colors.faint} />
          </Pressable>
        );
      })}
    </View>
  );
}

const STEPS = ['name', 'goal', 'basics', 'body', 'experience', 'schedule', 'equipment', 'activity', 'diet', 'building', 'plan'] as const;

export default function Setup() {
  const router = useRouter();
  const complete = useStore((s) => s.completeOnboarding);
  const [step, setStep] = useState(0);
  const [p, setP] = useState<Profile>({
    name: '',
    sex: 'male',
    age: 25,
    heightCm: 180,
    weightKg: 75,
    targetWeightKg: 78,
    goal: 'build',
    experience: 'intermediate',
    daysPerWeek: 4,
    sessionMinutes: 50,
    activity: 'moderate',
    equipment: 'gym',
    diet: 'none',
    units: 'metric',
  });
  const set = (patch: Partial<Profile>) => setP((x) => ({ ...x, ...patch }));
  const current = STEPS[step];

  const next = () => setStep((s) => Math.min(STEPS.length - 1, s + 1));
  const back = () => (step === 0 ? router.back() : setStep((s) => s - 1));

  // When goal changes, suggest a target weight
  useEffect(() => {
    const delta = p.goal === 'build' ? 3 : p.goal === 'lose' ? -5 : 0;
    set({ targetWeightKg: Math.round(p.weightKg + delta) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [p.goal, p.weightKg]);

  const targets = useMemo(() => computeTargets(p), [p]);
  const program = useMemo(() => (current === 'plan' ? generateProgram(p) : null), [current, p]);

  const canNext = current !== 'name' || p.name.trim().length > 0;
  const title: Record<(typeof STEPS)[number], string> = {
    name: "What's your name?",
    goal: "What's your main goal?",
    basics: 'Tell us about you',
    body: 'Your body today',
    experience: 'Training experience',
    schedule: 'Your schedule',
    equipment: 'Where do you train?',
    activity: 'Daily activity level',
    diet: 'Diet preference',
    building: '',
    plan: `Your plan is ready, ${p.name.split(' ')[0]}`,
  };
  const subtitle: Partial<Record<(typeof STEPS)[number], string>> = {
    name: 'Your coach will use it to keep things personal.',
    goal: 'This decides your calories, macros and program style.',
    basics: 'Used to calculate your metabolism accurately.',
    body: 'You can update this anytime in Progress.',
    experience: 'Sets your volume, rep ranges and progression.',
    schedule: 'Be realistic — consistency beats intensity.',
    equipment: "We'll only pick exercises you can actually do.",
    activity: 'Outside of your workouts.',
    diet: 'Meal suggestions and recipes respect this.',
    plan: 'Built by your AI coach from your answers. It adapts as you log.',
  };

  if (current === 'building') return <Building onDone={next} />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: space.lg, height: 56 }}>
          {current !== 'plan' ? <IconButton icon="chevron-back" onPress={back} /> : <View style={{ width: 40 }} />}
          <View style={{ flex: 1 }}>
            <ProgressBar value={(step + 1) / STEPS.length} />
          </View>
          <Text style={{ color: colors.muted, fontWeight: '700', width: 40, textAlign: 'right' }}>
            {Math.min(step + 1, 9)}/9
          </Text>
        </View>

        <ScrollView contentContainerStyle={{ padding: space.lg, paddingBottom: 40 }} keyboardShouldPersistTaps="handled">
          <Text style={[font.h1, { color: colors.text }]}>{title[current]}</Text>
          {subtitle[current] ? <Text style={{ color: colors.muted, fontSize: 15, marginTop: 6, marginBottom: 24 }}>{subtitle[current]}</Text> : null}

          {current === 'name' && (
            <Input value={p.name} onChangeText={(name) => set({ name })} placeholder="First name" autoFocus returnKeyType="next" onSubmitEditing={() => canNext && next()} icon="person" />
          )}

          {current === 'goal' && (
            <OptionList
              value={p.goal}
              onChange={(goal) => set({ goal })}
              options={[
                { key: 'build', title: 'Build Muscle', desc: 'Gain size and strength with a lean surplus', icon: 'barbell' },
                { key: 'lose', title: 'Lose Fat', desc: 'Drop fat while keeping your muscle', icon: 'flame' },
                { key: 'maintain', title: 'Maintain & Get Fit', desc: 'Recomp, stay strong, feel great', icon: 'pulse' },
              ]}
            />
          )}

          {current === 'basics' && (
            <View style={{ gap: 16 }}>
              <OptionList
                value={p.sex}
                onChange={(sex) => set({ sex })}
                options={[
                  { key: 'male', title: 'Male', icon: 'male' },
                  { key: 'female', title: 'Female', icon: 'female' },
                ]}
              />
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Age</Text>
                <Stepper value={p.age} onChange={(age) => set({ age })} min={13} max={90} suffix="yrs" />
              </Card>
            </View>
          )}

          {current === 'body' && (
            <View style={{ gap: 12 }}>
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Height</Text>
                <Stepper value={p.heightCm} onChange={(heightCm) => set({ heightCm })} min={120} max={230} suffix="cm" />
              </Card>
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Weight</Text>
                <Stepper value={p.weightKg} onChange={(weightKg) => set({ weightKg })} step={0.5} decimals={1} min={35} max={250} suffix="kg" />
              </Card>
              <Card style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <Text style={{ color: colors.text, fontWeight: '700', fontSize: 16 }}>Goal weight</Text>
                <Stepper value={p.targetWeightKg} onChange={(targetWeightKg) => set({ targetWeightKg })} step={0.5} decimals={1} min={35} max={250} suffix="kg" />
              </Card>
            </View>
          )}

          {current === 'experience' && (
            <OptionList
              value={p.experience}
              onChange={(experience) => set({ experience })}
              options={[
                { key: 'beginner', title: 'Beginner', desc: 'Less than 1 year of consistent training', icon: 'leaf' },
                { key: 'intermediate', title: 'Intermediate', desc: '1–3 years, know the main lifts', icon: 'trending-up' },
                { key: 'advanced', title: 'Advanced', desc: '3+ years, progress has slowed', icon: 'rocket' },
              ]}
            />
          )}

          {current === 'schedule' && (
            <View>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 10 }}>Training days per week</Text>
              <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
                {[2, 3, 4, 5, 6].map((d) => (
                  <Pressable
                    key={d}
                    onPress={() => (tap(), set({ daysPerWeek: d }))}
                    style={{
                      flex: 1,
                      height: 64,
                      borderRadius: 16,
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: p.daysPerWeek === d ? colors.primary : colors.card,
                      borderWidth: 1,
                      borderColor: p.daysPerWeek === d ? colors.primary : colors.border,
                    }}
                  >
                    <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800' }}>{d}</Text>
                  </Pressable>
                ))}
              </View>
              <Text style={{ color: colors.textSecondary, fontWeight: '700', marginBottom: 10 }}>Session length</Text>
              <OptionList
                value={p.sessionMinutes}
                onChange={(sessionMinutes) => set({ sessionMinutes })}
                options={[
                  { key: 35, title: '30–40 min', desc: 'Efficient, fewer exercises', icon: 'timer-outline' },
                  { key: 50, title: '45–60 min', desc: 'The sweet spot for most', icon: 'timer' },
                  { key: 70, title: '60–80 min', desc: 'Higher volume', icon: 'hourglass' },
                ]}
              />
            </View>
          )}

          {current === 'equipment' && (
            <OptionList
              value={p.equipment}
              onChange={(equipment) => set({ equipment })}
              options={[
                { key: 'gym', title: 'Full gym', desc: 'Barbells, machines, cables', icon: 'business' },
                { key: 'home', title: 'Home gym', desc: 'Barbell, dumbbells, bench', icon: 'home' },
                { key: 'dumbbells', title: 'Dumbbells only', desc: 'Adjustable or a few pairs', icon: 'barbell-outline' },
                { key: 'bodyweight', title: 'Bodyweight', desc: 'No equipment needed', icon: 'body' },
              ]}
            />
          )}

          {current === 'activity' && (
            <OptionList
              value={p.activity}
              onChange={(activity) => set({ activity })}
              options={[
                { key: 'sedentary', title: 'Sedentary', desc: 'Desk job, little walking', icon: 'desktop-outline' },
                { key: 'light', title: 'Lightly active', desc: '5–7k steps a day', icon: 'walk-outline' },
                { key: 'moderate', title: 'Moderate', desc: '7–10k steps, on your feet often', icon: 'walk' },
                { key: 'active', title: 'Active', desc: 'Physical job or 10k+ steps', icon: 'bicycle' },
                { key: 'very', title: 'Very active', desc: 'Heavy labour or athlete', icon: 'flash' },
              ]}
            />
          )}

          {current === 'diet' && (
            <OptionList
              value={p.diet}
              onChange={(diet) => set({ diet })}
              options={[
                { key: 'none', title: 'No preference', desc: 'I eat everything', icon: 'restaurant' },
                { key: 'vegetarian', title: 'Vegetarian', icon: 'leaf' },
                { key: 'vegan', title: 'Vegan', icon: 'flower' },
                { key: 'pescatarian', title: 'Pescatarian', icon: 'fish' },
                { key: 'keto', title: 'Low carb / Keto', icon: 'nutrition' },
              ]}
            />
          )}

          {current === 'plan' && program && (
            <View style={{ gap: 12 }}>
              <Card tone="primary">
                <Text style={{ color: colors.primaryLight, fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>DAILY TARGETS</Text>
                <Text style={{ color: colors.text, fontSize: 36, fontWeight: '800', marginTop: 6 }}>
                  {targets.kcal.toLocaleString()} <Text style={{ fontSize: 16, color: colors.muted }}>kcal</Text>
                </Text>
                <View style={{ flexDirection: 'row', marginTop: 14, gap: 10 }}>
                  {[
                    ['Protein', targets.protein, colors.protein],
                    ['Carbs', targets.carbs, colors.carbs],
                    ['Fat', targets.fat, colors.fat],
                  ].map(([l, v, c]) => (
                    <View key={l as string} style={{ flex: 1, backgroundColor: colors.card, borderRadius: 12, padding: 12 }}>
                      <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: c as string, marginBottom: 6 }} />
                      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>{v as number} g</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }}>{l as string}</Text>
                    </View>
                  ))}
                </View>
                <Text style={{ color: colors.muted, fontSize: 12, marginTop: 12 }}>
                  + {(targets.waterMl / 1000).toFixed(1)} L water • {targets.steps.toLocaleString()} steps / day
                </Text>
              </Card>

              <Card>
                <Text style={{ color: colors.primaryLight, fontWeight: '700', fontSize: 12, letterSpacing: 1 }}>YOUR PROGRAM</Text>
                <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', marginTop: 6 }}>{program.name}</Text>
                <Text style={{ color: colors.muted, marginTop: 2, marginBottom: 12 }}>{program.description}</Text>
                {program.days.map((d) => (
                  <View key={d.id} style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 8, gap: 12 }}>
                    <View style={{ width: 42, height: 42, borderRadius: 12, backgroundColor: colors.card2, alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ color: colors.primaryLight, fontWeight: '800', fontSize: 12 }}>{d.weekday !== null ? DAY_SHORT[d.weekday] : '—'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: colors.text, fontWeight: '700' }}>{d.name}</Text>
                      <Text style={{ color: colors.muted, fontSize: 12 }} numberOfLines={1}>
                        {d.exercises.map((e) => exerciseById(e.exerciseId)?.name).join(' • ')}
                      </Text>
                    </View>
                    <Text style={{ color: colors.muted, fontSize: 12 }}>{d.estMinutes} min</Text>
                  </View>
                ))}
              </Card>
            </View>
          )}
        </ScrollView>

        <View style={{ padding: space.lg, paddingTop: 0 }}>
          {current === 'plan' ? (
            <Button
              title="Start my journey"
              icon="arrow-forward"
              onPress={() => {
                success();
                complete(p);
                router.replace('/(tabs)');
              }}
            />
          ) : (
            <Button title="Continue" onPress={next} disabled={!canNext} />
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Building({ onDone }: { onDone: () => void }) {
  const steps = ['Calculating your metabolism', 'Setting calorie & macro targets', 'Selecting exercises for your equipment', 'Scheduling your training week', 'Personalising your AI coach'];
  const [i, setI] = useState(0);
  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(spin, { toValue: 1, duration: 1400, useNativeDriver: true })).start();
    const t = setInterval(() => setI((x) => x + 1), 550);
    return () => clearInterval(t);
  }, [spin]);
  useEffect(() => {
    if (i >= steps.length + 1) onDone();
  }, [i, onDone, steps.length]);
  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg, alignItems: 'center', justifyContent: 'center', padding: 32 }}>
      <Animated.View style={{ transform: [{ rotate }], marginBottom: 32 }}>
        <Ionicons name="sparkles" size={56} color={colors.primary} />
      </Animated.View>
      <Text style={[font.h2, { color: colors.text, marginBottom: 24 }]}>Building your plan…</Text>
      <View style={{ alignSelf: 'stretch', gap: 14 }}>
        {steps.map((s, idx) => (
          <View key={s} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, opacity: idx <= i ? 1 : 0.3 }}>
            <Ionicons name={idx < i ? 'checkmark-circle' : 'ellipse-outline'} size={22} color={idx < i ? colors.success : colors.faint} />
            <Text style={{ color: colors.text, fontSize: 15, fontWeight: '600' }}>{s}</Text>
          </View>
        ))}
      </View>
    </SafeAreaView>
  );
}
