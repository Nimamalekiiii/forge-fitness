import React, { useEffect, useRef, useState } from 'react';
import { View, Text, Pressable, Image, Animated, StyleSheet, Alert, Easing } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import { IconButton, tap, success } from '../../src/components/ui';
import { colors } from '../../src/theme';
import { recognizeFood } from '../../src/ai/client';
import { useStore } from '../../src/store/useStore';
import { mealForNow } from '../../src/logic/meals';

export default function ScanFood() {
  const router = useRouter();
  const serverUrl = useStore((s) => s.settings.ai.serverUrl);
  const setDraft = useStore((s) => s.setDraftMeal);
  const [uri, setUri] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const scan = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!busy) return;
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scan, { toValue: 1, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
        Animated.timing(scan, { toValue: 0, duration: 1100, easing: Easing.inOut(Easing.quad), useNativeDriver: true }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [busy, scan]);

  const analyse = async (asset: ImagePicker.ImagePickerAsset) => {
    setUri(asset.uri);
    setBusy(true);
    try {
      const result = await recognizeFood(asset.base64 ?? '', serverUrl);
      if (!result.items.length) {
        Alert.alert('No food found', 'Try again with the whole plate in frame and good light.');
        setBusy(false);
        return;
      }
      success();
      setDraft({ ...result, meal: mealForNow(), photoUri: asset.uri });
      router.replace('/nutrition/meal');
    } catch (e) {
      setBusy(false);
      Alert.alert('Scan failed', `${(e as Error).message}\n\nCheck your AI server URL in Profile → AI settings.`);
    }
  };

  const pick = async (source: 'camera' | 'library') => {
    tap();
    const perm = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission needed', `Allow ${source === 'camera' ? 'camera' : 'photo'} access in Settings to scan meals.`);
      return;
    }
    const opts: ImagePicker.ImagePickerOptions = { mediaTypes: ['images'], quality: 0.5, base64: true, allowsEditing: false };
    const res = source === 'camera' ? await ImagePicker.launchCameraAsync(opts) : await ImagePicker.launchImageLibraryAsync(opts);
    if (!res.canceled && res.assets[0]) analyse(res.assets[0]);
  };

  const translateY = scan.interpolate({ inputRange: [0, 1], outputRange: [0, 280] });

  return (
    <View style={{ flex: 1, backgroundColor: '#000' }}>
      {uri ? <Image source={{ uri }} style={StyleSheet.absoluteFill} resizeMode="cover" /> : null}
      <LinearGradient colors={['rgba(0,0,0,0.7)', 'transparent', 'rgba(0,0,0,0.85)']} locations={[0, 0.4, 1]} style={StyleSheet.absoluteFill} />
      <SafeAreaView style={{ flex: 1 }}>
        <View style={styles.top}>
          <IconButton icon="close" bg="rgba(255,255,255,0.12)" onPress={() => router.back()} />
          <Text style={{ color: '#fff', fontWeight: '800', fontSize: 17 }}>Scan Food</Text>
          <IconButton icon="images-outline" bg="rgba(255,255,255,0.12)" onPress={() => pick('library')} />
        </View>

        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <View style={styles.frame}>
            {[styles.tl, styles.tr, styles.bl, styles.br].map((c, i) => (
              <View key={i} style={[styles.corner, c]} />
            ))}
            {busy ? <Animated.View style={[styles.scanLine, { transform: [{ translateY }] }]} /> : null}
            {!uri ? (
              <View style={{ alignItems: 'center', gap: 10 }}>
                <Ionicons name="restaurant-outline" size={54} color="rgba(255,255,255,0.35)" />
                <Text style={{ color: 'rgba(255,255,255,0.6)', fontWeight: '600' }}>Fit the whole plate in the frame</Text>
              </View>
            ) : null}
          </View>
          {busy ? (
            <View style={styles.status}>
              <Ionicons name="sparkles" size={16} color={colors.primaryLight} />
              <Text style={{ color: '#fff', fontWeight: '700' }}>Analysing your meal…</Text>
            </View>
          ) : null}
        </View>

        <View style={{ alignItems: 'center', paddingBottom: 12 }}>
          <Pressable onPress={() => pick('camera')} disabled={busy} style={({ pressed }) => [styles.shutter, { opacity: busy ? 0.4 : pressed ? 0.8 : 1 }]}>
            <View style={styles.shutterInner} />
          </Pressable>
          <View style={styles.info}>
            <View style={styles.infoIcon}>
              <Ionicons name="sparkles" size={20} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#fff', fontWeight: '800' }}>AI Food Recognition</Text>
              <Text style={{ color: colors.textSecondary, fontSize: 13, marginTop: 2 }}>
                {serverUrl || process.env.EXPO_PUBLIC_AI_URL
                  ? 'Take a photo of your meal and get instant nutrition information.'
                  : 'Demo mode — connect your AI server in Profile → AI settings for real recognition.'}
              </Text>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const C = 34;
const styles = StyleSheet.create({
  top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, height: 56 },
  frame: { width: 300, height: 300, alignItems: 'center', justifyContent: 'center' },
  corner: { position: 'absolute', width: C, height: C, borderColor: '#fff' },
  tl: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 18 },
  tr: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 18 },
  bl: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 18 },
  br: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 18 },
  scanLine: { position: 'absolute', top: 10, left: 12, right: 12, height: 3, borderRadius: 2, backgroundColor: colors.primaryLight, shadowColor: colors.primary, shadowOpacity: 1, shadowRadius: 12 },
  status: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 20, backgroundColor: 'rgba(17,21,28,0.9)', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 999 },
  shutter: { width: 82, height: 82, borderRadius: 41, borderWidth: 4, borderColor: '#fff', alignItems: 'center', justifyContent: 'center', marginBottom: 20 },
  shutterInner: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#fff' },
  info: { flexDirection: 'row', gap: 12, alignItems: 'center', marginHorizontal: 16, padding: 14, borderRadius: 18, backgroundColor: 'rgba(17,21,28,0.92)', borderWidth: 1, borderColor: colors.border },
  infoIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center' },
});
