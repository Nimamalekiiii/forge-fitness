import React, { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextInputProps,
  View,
  ViewStyle,
  RefreshControlProps,
} from 'react-native';
import { SafeAreaView, Edge } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { colors, font, radius, space } from '../theme';

export type IconName = React.ComponentProps<typeof Ionicons>['name'];

export const tap = () => Haptics.selectionAsync().catch(() => {});
export const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});

// ───────── Layout ─────────

export function Screen({
  children,
  scroll = true,
  edges = ['top'],
  padded = true,
  footer,
  refreshControl,
}: {
  children: ReactNode;
  scroll?: boolean;
  edges?: Edge[];
  padded?: boolean;
  footer?: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
}) {
  return (
    <SafeAreaView style={styles.screen} edges={edges}>
      {scroll ? (
        <ScrollView
          contentContainerStyle={[padded && { paddingHorizontal: space.lg }, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={refreshControl}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[{ flex: 1 }, padded && { paddingHorizontal: space.lg }]}>{children}</View>
      )}
      {footer}
    </SafeAreaView>
  );
}

export function Header({
  title,
  subtitle,
  back,
  right,
  large,
  onBack,
}: {
  title: string;
  subtitle?: string;
  back?: boolean;
  right?: ReactNode;
  large?: boolean;
  onBack?: () => void;
}) {
  const router = useRouter();
  if (large) {
    return (
      <View style={[styles.row, { paddingTop: space.sm, paddingBottom: space.lg, justifyContent: 'space-between' }]}>
        <View style={{ flex: 1 }}>
          <Text style={[font.h1, { color: colors.text }]}>{title}</Text>
          {subtitle ? <Text style={[font.small, { color: colors.muted, marginTop: 2 }]}>{subtitle}</Text> : null}
        </View>
        {right}
      </View>
    );
  }
  return (
    <View style={[styles.row, { height: 52, justifyContent: 'space-between' }]}>
      <View style={{ width: 44 }}>
        {back ? (
          <IconButton icon="chevron-back" onPress={() => (onBack ? onBack() : router.back())} />
        ) : null}
      </View>
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Text style={[font.h3, { color: colors.text }]} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? <Text style={[font.tiny, { color: colors.muted }]}>{subtitle}</Text> : null}
      </View>
      <View style={{ width: 44, alignItems: 'flex-end' }}>{right}</View>
    </View>
  );
}

export function Card({
  children,
  style,
  onPress,
  tone = 'default',
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  onPress?: () => void;
  tone?: 'default' | 'raised' | 'primary';
}) {
  const bg = tone === 'raised' ? colors.card2 : tone === 'primary' ? colors.primaryDim : colors.card;
  const border = tone === 'primary' ? 'rgba(61,139,255,0.35)' : colors.border;
  const content = <View style={[styles.card, { backgroundColor: bg, borderColor: border }, style]}>{children}</View>;
  if (!onPress) return content;
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1, transform: [{ scale: pressed ? 0.99 : 1 }] })}
    >
      {content}
    </Pressable>
  );
}

export function SectionHeader({ title, action, onAction }: { title: string; action?: string; onAction?: () => void }) {
  return (
    <View style={[styles.row, { justifyContent: 'space-between', marginTop: space.xl, marginBottom: space.md }]}>
      <Text style={[font.h2, { color: colors.text }]}>{title}</Text>
      {action ? (
        <Pressable onPress={onAction} hitSlop={10}>
          <Text style={[font.small, { color: colors.primary, fontWeight: '600' }]}>{action}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

// ───────── Controls ─────────

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading,
  disabled,
  style,
  small,
}: {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
  icon?: IconName;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
  small?: boolean;
}) {
  const bg =
    variant === 'primary' ? colors.primary : variant === 'secondary' ? colors.card2 : variant === 'danger' ? colors.dangerDim : 'transparent';
  const fg = variant === 'primary' ? '#fff' : variant === 'danger' ? colors.danger : variant === 'ghost' ? colors.primary : colors.text;
  return (
    <Pressable
      disabled={disabled || loading}
      onPress={() => {
        tap();
        onPress();
      }}
      style={({ pressed }) => [
        styles.button,
        small && { height: 40, paddingHorizontal: space.lg },
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.85 : 1 },
        variant === 'secondary' && { borderWidth: 1, borderColor: colors.border },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={fg} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={small ? 16 : 18} color={fg} style={{ marginRight: 8 }} /> : null}
          <Text style={{ color: fg, fontSize: small ? 14 : 16, fontWeight: '700' }}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

export function IconButton({
  icon,
  onPress,
  color = colors.text,
  bg = colors.card2,
  size = 40,
}: {
  icon: IconName;
  onPress: () => void;
  color?: string;
  bg?: string;
  size?: number;
}) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress();
      }}
      hitSlop={8}
      style={({ pressed }) => ({
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Ionicons name={icon} size={size * 0.5} color={color} />
    </Pressable>
  );
}

export function Chip({ label, active, onPress, icon }: { label: string; active?: boolean; onPress?: () => void; icon?: IconName }) {
  return (
    <Pressable
      onPress={() => {
        tap();
        onPress?.();
      }}
      style={[
        styles.chip,
        { backgroundColor: active ? colors.primary : colors.card2, borderColor: active ? colors.primary : colors.border },
      ]}
    >
      {icon ? <Ionicons name={icon} size={14} color={active ? '#fff' : colors.textSecondary} style={{ marginRight: 6 }} /> : null}
      <Text style={{ color: active ? '#fff' : colors.textSecondary, fontSize: 13, fontWeight: '600' }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  scroll,
}: {
  options: { key: T; label: string }[];
  value: T;
  onChange: (v: T) => void;
  scroll?: boolean;
}) {
  const inner = options.map((o) => {
    const active = o.key === value;
    return (
      <Pressable
        key={o.key}
        onPress={() => {
          tap();
          onChange(o.key);
        }}
        style={[
          styles.segment,
          !scroll && { flex: 1 },
          scroll && { backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
          active && { backgroundColor: colors.primary, borderColor: colors.primary },
        ]}
      >
        <Text style={{ color: active ? '#fff' : colors.muted, fontWeight: '700', fontSize: 13 }}>{o.label}</Text>
      </Pressable>
    );
  });
  if (scroll) {
    return (
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }} style={{ marginBottom: space.lg }}>
        {inner}
      </ScrollView>
    );
  }
  return <View style={styles.segmented}>{inner}</View>;
}

export function Input(props: TextInputProps & { icon?: IconName; suffix?: string }) {
  const { icon, suffix, style, ...rest } = props;
  return (
    <View style={styles.input}>
      {icon ? <Ionicons name={icon} size={18} color={colors.muted} style={{ marginRight: 8 }} /> : null}
      <TextInput
        placeholderTextColor={colors.faint}
        selectionColor={colors.primary}
        style={[{ flex: 1, color: colors.text, fontSize: 15, paddingVertical: 0 }, style]}
        {...rest}
      />
      {suffix ? <Text style={{ color: colors.muted, fontWeight: '600', marginLeft: 6 }}>{suffix}</Text> : null}
    </View>
  );
}

export function Stepper({
  value,
  onChange,
  step = 1,
  min = 0,
  max = 9999,
  suffix,
  decimals = 0,
}: {
  value: number;
  onChange: (v: number) => void;
  step?: number;
  min?: number;
  max?: number;
  suffix?: string;
  decimals?: number;
}) {
  const set = (v: number) => onChange(Math.min(max, Math.max(min, Math.round(v * 100) / 100)));
  return (
    <View style={[styles.row, { gap: 10 }]}>
      <IconButton icon="remove" size={36} onPress={() => set(value - step)} />
      <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', minWidth: 64, textAlign: 'center' }}>
        {value.toFixed(decimals)}
        {suffix ? <Text style={{ color: colors.muted, fontSize: 13 }}> {suffix}</Text> : null}
      </Text>
      <IconButton icon="add" size={36} onPress={() => set(value + step)} />
    </View>
  );
}

// ───────── Data display ─────────

export function IconBadge({ icon, color = colors.primary, size = 40, filled }: { icon: IconName; color?: string; size?: number; filled?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.32,
        backgroundColor: filled ? color : hexA(color, 0.15),
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Ionicons name={icon} size={size * 0.5} color={filled ? '#fff' : color} />
    </View>
  );
}

export function ProgressBar({ value, color = colors.primary, height = 6, track = colors.card3 }: { value: number; color?: string; height?: number; track?: string }) {
  const pct = Math.max(0, Math.min(1, isFinite(value) ? value : 0));
  return (
    <View style={{ height, borderRadius: height, backgroundColor: track, overflow: 'hidden' }}>
      <View style={{ width: `${pct * 100}%`, height, borderRadius: height, backgroundColor: color }} />
    </View>
  );
}

export function ProgressRing({
  size = 120,
  stroke = 10,
  value,
  color = colors.primary,
  colorEnd,
  children,
  track = colors.card3,
}: {
  size?: number;
  stroke?: number;
  value: number;
  color?: string;
  colorEnd?: string;
  children?: ReactNode;
  track?: string;
}) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, isFinite(value) ? value : 0));
  const gid = `g${color.replace('#', '')}${size}`;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <View style={{ position: 'absolute', transform: [{ rotate: '-90deg' }] }}>
      <Svg width={size} height={size}>
        <Defs>
          <SvgGradient id={gid} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={color} />
            <Stop offset="1" stopColor={colorEnd ?? color} />
          </SvgGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={track} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={`url(#${gid})`}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c} ${c}`}
          strokeDashoffset={c * (1 - pct)}
        />
      </Svg>
      </View>
      {children}
    </View>
  );
}

export function MacroBar({ label, value, target, color }: { label: string; value: number; target: number; color: string }) {
  return (
    <View style={{ marginBottom: space.md }}>
      <View style={[styles.row, { justifyContent: 'space-between', marginBottom: 6 }]}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 13 }}>{label}</Text>
        <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600' }}>
          {Math.round(value)} / {target} g
        </Text>
      </View>
      <ProgressBar value={value / target} color={color} />
    </View>
  );
}

export function Stat({ label, value, unit, sub, subColor }: { label: string; value: string | number; unit?: string; sub?: string; subColor?: string }) {
  return (
    <View>
      <Text style={{ color: colors.muted, fontSize: 12, fontWeight: '600', marginBottom: 4 }}>{label}</Text>
      <Text style={{ color: colors.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>
        {value}
        {unit ? <Text style={{ fontSize: 13, color: colors.muted }}> {unit}</Text> : null}
      </Text>
      {sub ? <Text style={{ color: subColor ?? colors.muted, fontSize: 12, fontWeight: '600', marginTop: 2 }}>{sub}</Text> : null}
    </View>
  );
}

export function ListRow({
  icon,
  iconColor,
  emoji,
  title,
  subtitle,
  right,
  onPress,
  chevron,
}: {
  icon?: IconName;
  iconColor?: string;
  emoji?: string;
  title: string;
  subtitle?: string;
  right?: ReactNode;
  onPress?: () => void;
  chevron?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress ? () => (tap(), onPress()) : undefined}
      style={({ pressed }) => [styles.row, { paddingVertical: 12, gap: 12, opacity: pressed && onPress ? 0.7 : 1 }]}
    >
      {emoji ? (
        <View style={styles.emojiBox}>
          <Text style={{ fontSize: 24 }}>{emoji}</Text>
        </View>
      ) : icon ? (
        <IconBadge icon={icon} color={iconColor} />
      ) : null}
      <View style={{ flex: 1 }}>
        <Text style={{ color: colors.text, fontWeight: '700', fontSize: 15 }} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={{ color: colors.muted, fontSize: 13, marginTop: 2 }} numberOfLines={2}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {right}
      {chevron ? <Ionicons name="chevron-forward" size={18} color={colors.faint} /> : null}
    </Pressable>
  );
}

export function Divider() {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: colors.border }} />;
}

export function Empty({ icon, title, body, action, onAction }: { icon: IconName; title: string; body?: string; action?: string; onAction?: () => void }) {
  return (
    <Card style={{ alignItems: 'center', paddingVertical: space.xxl }}>
      <IconBadge icon={icon} size={52} />
      <Text style={[font.h3, { color: colors.text, marginTop: space.md }]}>{title}</Text>
      {body ? <Text style={{ color: colors.muted, textAlign: 'center', marginTop: 6, lineHeight: 20 }}>{body}</Text> : null}
      {action && onAction ? <Button title={action} onPress={onAction} small style={{ marginTop: space.lg }} /> : null}
    </Card>
  );
}

export function Pill({ text, color = colors.primary }: { text: string; color?: string }) {
  return (
    <View style={{ backgroundColor: hexA(color, 0.15), paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: 'flex-start' }}>
      <Text style={{ color, fontSize: 11, fontWeight: '700' }}>{text}</Text>
    </View>
  );
}

export function hexA(hex: string, a: number) {
  if (!hex.startsWith('#') || hex.length !== 7) return hex;
  const n = parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

export const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  row: { flexDirection: 'row', alignItems: 'center' },
  card: {
    borderRadius: radius.lg,
    padding: space.lg,
    borderWidth: 1,
  },
  button: {
    height: 54,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    paddingHorizontal: space.xl,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    height: 34,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  segmented: {
    flexDirection: 'row',
    backgroundColor: colors.card,
    borderRadius: radius.pill,
    padding: 4,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: space.lg,
  },
  segment: {
    height: 36,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    backgroundColor: 'transparent',
  },
  input: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: radius.md,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
  },
  emojiBox: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: colors.card2,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
