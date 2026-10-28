import { useEffect, useState } from 'react';
import { Platform } from 'react-native';
import { Pedometer } from 'expo-sensors';
import { useStore } from '../store/useStore';

/** Reads today's steps from the phone (iOS Motion) and stores them. Falls back to manual entry. */
export function useStepSync() {
  const setSteps = useStore((s) => s.setSteps);
  const [available, setAvailable] = useState<boolean | null>(null);

  useEffect(() => {
    let sub: { remove: () => void } | null = null;
    let cancelled = false;
    (async () => {
      try {
        const ok = await Pedometer.isAvailableAsync();
        if (!ok || Platform.OS !== 'ios') {
          if (!cancelled) setAvailable(false);
          return;
        }
        const perm = await Pedometer.requestPermissionsAsync();
        if (!perm.granted) {
          if (!cancelled) setAvailable(false);
          return;
        }
        const start = new Date();
        start.setHours(0, 0, 0, 0);
        const res = await Pedometer.getStepCountAsync(start, new Date());
        if (cancelled) return;
        setAvailable(true);
        const base = res.steps;
        setSteps(base);
        sub = Pedometer.watchStepCount((r) => setSteps(base + r.steps));
      } catch {
        if (!cancelled) setAvailable(false);
      }
    })();
    return () => {
      cancelled = true;
      sub?.remove();
    };
  }, [setSteps]);

  return available;
}
