import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Insight } from '../logic/coach';
import { useStore } from '../store/useStore';
import { colors } from '../theme';
import { hexA, success, tap, IconName } from './ui';

export function useInsightAction() {
  const router = useRouter();
  const apply = useStore((s) => s.applyCoachAdjustment);
  const addWater = useStore((s) => s.addWater);
  return (i: Insight) => {
    const a = i.action;
    if (!a) return;
    if ('route' in a) {
      router.push({ pathname: a.route as never, params: a.params });
    } else if (a.kind === 'applyKcal') {
      Alert.alert('Adjust calories?', a.message, [
        { text: 'Not now', style: 'cancel' },
        {
          text: 'Apply',
          onPress: () => {
            success();
            apply(a.value, a.message);
          },
        },
      ]);
    } else if (a.kind === 'water') {
      success();
      addWater(a.value);
    }
  };
}

export function InsightCard({ insight, compact }: { insight: Insight; compact?: boolean }) {
  const run = useInsightAction();
  const dismiss = useStore((s) => s.dismissInsight);
  return (
    <View
      style={{
        backgroundColor: colors.card,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: colors.border,
        padding: 14,
        flexDirection: 'row',
        gap: 12,
      }}
    >
      <View
        style={{
          width: 38,
          height: 38,
          borderRadius: 12,
          backgroundColor: hexA(insight.color, 0.16),
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Ionicons name={insight.icon as IconName} size={19} color={insight.color} />
      </View>
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15, flex: 1 }}>{insight.title}</Text>
          {!compact ? (
            <Pressable hitSlop={10} onPress={() => (tap(), dismiss(insight.id))}>
              <Ionicons name="close" size={16} color={colors.faint} />
            </Pressable>
          ) : null}
        </View>
        <Text style={{ color: colors.textSecondary, fontSize: 13, lineHeight: 19, marginTop: 3 }}>{insight.body}</Text>
        {insight.action ? (
          <Pressable
            onPress={() => (tap(), run(insight))}
            style={({ pressed }) => ({
              alignSelf: 'flex-start',
              marginTop: 10,
              backgroundColor: hexA(insight.color, 0.16),
              paddingHorizontal: 14,
              paddingVertical: 7,
              borderRadius: 999,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ color: insight.color, fontWeight: '700', fontSize: 13 }}>{insight.action.label}</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
