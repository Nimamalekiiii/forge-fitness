import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { Button } from '../../src/components/ui';
import { colors } from '../../src/theme';

export default function Welcome() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg }}>
      <LinearGradient
        colors={['#0B1A33', '#08101F', colors.bg]}
        locations={[0, 0.5, 1]}
        style={StyleSheet.absoluteFill}
      />
      {/* Decorative hero */}
      <View style={styles.hero}>
        <View style={[styles.orb, { width: 340, height: 340, opacity: 0.08 }]} />
        <View style={[styles.orb, { width: 250, height: 250, opacity: 0.12 }]} />
        <View style={[styles.orb, { width: 160, height: 160, opacity: 0.22 }]} />
        <LinearGradient colors={[colors.primaryLight, colors.primaryDeep]} style={styles.logo}>
          <Ionicons name="barbell" size={54} color="#fff" />
        </LinearGradient>
        <View style={[styles.float, { top: 70, left: 40 }]}>
          <Ionicons name="flame" size={16} color={colors.carbs} />
          <Text style={styles.floatText}>1,850 kcal</Text>
        </View>
        <View style={[styles.float, { top: 120, right: 30 }]}>
          <Ionicons name="trophy" size={16} color={colors.warning} />
          <Text style={styles.floatText}>New PR</Text>
        </View>
        <View style={[styles.float, { bottom: 60, left: 50 }]}>
          <Ionicons name="sparkles" size={16} color={colors.primaryLight} />
          <Text style={styles.floatText}>AI Coach</Text>
        </View>
        <View style={[styles.float, { bottom: 30, right: 50 }]}>
          <Ionicons name="trending-up" size={16} color={colors.success} />
          <Text style={styles.floatText}>+18% strength</Text>
        </View>
      </View>

      <SafeAreaView edges={['bottom']} style={{ paddingHorizontal: 24, paddingBottom: 12 }}>
        <Text style={styles.title}>Build a{'\n'}Stronger You</Text>
        <Text style={styles.sub}>
          Personalized workouts, nutrition and progress tracking — with an AI coach that learns from you. All in one app.
        </Text>
        <Button title="Get Started" onPress={() => router.push('/onboarding/setup')} style={{ marginTop: 28 }} />
        <Text style={styles.legal}>Takes about 60 seconds. Your data stays on your phone.</Text>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  hero: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  orb: { position: 'absolute', borderRadius: 999, backgroundColor: colors.primary },
  logo: {
    width: 110,
    height: 110,
    borderRadius: 34,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 10 },
  },
  float: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(17,21,28,0.92)',
    borderColor: colors.border,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
  },
  floatText: { color: colors.text, fontWeight: '700', fontSize: 12 },
  title: { color: colors.text, fontSize: 42, fontWeight: '800', letterSpacing: -1.2, lineHeight: 46 },
  sub: { color: colors.textSecondary, fontSize: 16, lineHeight: 23, marginTop: 14 },
  legal: { color: colors.faint, textAlign: 'center', fontSize: 12, marginTop: 14 },
});
