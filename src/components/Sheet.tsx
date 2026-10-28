import React from 'react';
import { Modal, Pressable, Text, View, KeyboardAvoidingView, Platform } from 'react-native';
import { colors } from '../theme';

export function Sheet({ visible, onClose, title, children }: { visible: boolean; onClose: () => void; title: string; children: React.ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)' }} onPress={onClose} />
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={{ backgroundColor: colors.bgElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 40, borderTopWidth: 1, borderColor: colors.border }}>
        <View style={{ width: 40, height: 4, borderRadius: 2, backgroundColor: colors.borderStrong, alignSelf: 'center', marginBottom: 16 }} />
        <Text style={{ color: colors.text, fontSize: 18, fontWeight: '800', marginBottom: 16 }}>{title}</Text>
        {children}
      </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

