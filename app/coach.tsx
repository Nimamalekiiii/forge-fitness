import React, { useMemo, useRef, useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Header, IconButton, Card, ProgressRing, Chip, tap } from '../src/components/ui';
import { InsightCard } from '../src/components/InsightCard';
import { colors, space } from '../src/theme';
import { useStore } from '../src/store/useStore';
import { coachInsights, localCoachReply, recovery, reportSummary, todayTotals, weeklyProgress, weeklyReport, nextWorkout } from '../src/logic/coach';
import { askCoach } from '../src/ai/client';
import { personalRecords } from '../src/logic/strength';
import { exerciseById } from '../src/data/exercises';

type Msg = { role: 'user' | 'coach'; text: string };

const PROMPTS = ['What should I eat now?', "What's my workout today?", 'How is my recovery?', 'Am I eating enough protein?', 'Show my PRs', 'How is my weight trending?'];

export default function Coach() {
  const router = useRouter();
  const s = useStore();
  const insights = useMemo(() => coachInsights(s), [s]);
  const weekly = useMemo(() => weeklyProgress(s), [s]);
  const rec = useMemo(() => recovery(s), [s]);
  const report = useMemo(() => weeklyReport(s, 0), [s]);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState('');
  const [thinking, setThinking] = useState(false);
  const scroll = useRef<ScrollView>(null);

  const send = async (q: string) => {
    if (!q.trim() || thinking) return;
    tap();
    setText('');
    setMsgs((m) => [...m, { role: 'user', text: q }]);
    setThinking(true);
    let reply: string | null = null;
    try {
      const t = todayTotals(s);
      const nxt = nextWorkout(s);
      reply = await askCoach(
        q,
        {
          profile: s.profile,
          targets: s.targets,
          today: { eaten: t.eaten, remaining: t.remaining },
          recovery: { score: rec.score, sleep: rec.sleep, fatigued: rec.muscles.filter((m) => m.readiness < 60).map((m) => m.muscle) },
          weeklyGoalPercent: weekly.percent,
          nextWorkout: nxt ? { name: nxt.template.name, inDays: nxt.inDays, exercises: nxt.template.exercises.map((e) => exerciseById(e.exerciseId)?.name) } : null,
          topLifts: personalRecords(s.workouts).slice(0, 5).map((p) => ({ exercise: exerciseById(p.exerciseId)?.name, kg: p.kg, reps: p.reps })),
          tone: s.settings.ai.tone,
        },
        s.settings.ai.serverUrl
      );
    } catch {
      reply = null;
    }
    if (!reply) {
      await new Promise((r) => setTimeout(r, 500));
      reply = localCoachReply(q, s);
    }
    setMsgs((m) => [...m, { role: 'coach', text: reply! }]);
    setThinking(false);
    setTimeout(() => scroll.current?.scrollToEnd({ animated: true }), 100);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }} edges={['top', 'bottom']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ paddingHorizontal: space.lg }}>
          <Header title="AI Coach" subtitle="Learns from your training, food & recovery" right={<IconButton icon="close" onPress={() => router.back()} />} />
        </View>
        <ScrollView ref={scroll} contentContainerStyle={{ padding: space.lg, paddingBottom: 20 }} keyboardShouldPersistTaps="handled">
          <LinearGradient colors={['#173A73', colors.card]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 20, padding: 18, flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <ProgressRing size={74} stroke={8} value={weekly.percent / 100} color={colors.primaryLight}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>{weekly.percent}%</Text>
            </ProgressRing>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 16 }}>Weekly goal</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {weekly.done}/{weekly.planned} workouts · recovery {rec.score}/100
              </Text>
              <Text style={{ color: colors.textSecondary, fontSize: 12, marginTop: 6, lineHeight: 17 }} numberOfLines={3}>
                {reportSummary(s, report)}
              </Text>
            </View>
          </LinearGradient>

          {insights.length ? (
            <View style={{ gap: 10, marginTop: space.lg }}>
              <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800' }}>Today's recommendations</Text>
              {insights.map((i) => (
                <InsightCard key={i.id} insight={i} />
              ))}
            </View>
          ) : (
            <Card style={{ marginTop: space.lg }}>
              <Text style={{ color: colors.text, fontWeight: '700' }}>You're on track today ✅</Text>
              <Text style={{ color: colors.muted, marginTop: 4 }}>No recommendations right now — keep logging and I'll keep learning.</Text>
            </Card>
          )}

          <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginTop: space.xl, marginBottom: space.md }}>Ask your coach</Text>
          {msgs.map((m, i) => (
            <View
              key={i}
              style={{
                alignSelf: m.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '86%',
                backgroundColor: m.role === 'user' ? colors.primary : colors.card,
                borderWidth: m.role === 'user' ? 0 : 1,
                borderColor: colors.border,
                padding: 12,
                borderRadius: 16,
                borderBottomRightRadius: m.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: m.role === 'user' ? 16 : 4,
                marginBottom: 8,
              }}
            >
              <Text style={{ color: '#fff', fontSize: 14, lineHeight: 20 }}>{m.text}</Text>
            </View>
          ))}
          {thinking ? (
            <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <ActivityIndicator color={colors.primary} size="small" />
              <Text style={{ color: colors.muted }}>Coach is thinking…</Text>
            </View>
          ) : null}
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
            {PROMPTS.map((p) => (
              <Chip key={p} label={p} onPress={() => send(p)} />
            ))}
          </View>
        </ScrollView>
        <View style={{ flexDirection: 'row', gap: 10, padding: space.md, paddingHorizontal: space.lg, borderTopWidth: 1, borderColor: colors.border, alignItems: 'center' }}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Ask about food, training, recovery…"
            placeholderTextColor={colors.faint}
            style={{ flex: 1, height: 46, borderRadius: 23, backgroundColor: colors.card, color: colors.text, paddingHorizontal: 18, borderWidth: 1, borderColor: colors.border }}
            onSubmitEditing={() => send(text)}
            returnKeyType="send"
          />
          <Pressable onPress={() => send(text)} style={{ width: 46, height: 46, borderRadius: 23, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' }}>
            <Ionicons name="arrow-up" size={22} color="#fff" />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
