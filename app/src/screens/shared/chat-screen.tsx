import React, { useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { Send } from 'lucide-react-native';
import { useAuth } from '../../hooks/use-auth';
import { useChatHistory, useSendMessage } from '../../hooks/use-chat';
import { lightPalette, radius, spacing, typography } from '../../theme';

type ChatRoute = RouteProp<{ Chat: { appointmentId: string; peerName: string } }, 'Chat'>;

/** Appointment chat thread (Req 13). Polls history and sends via REST. */
export function ChatScreen() {
  const route = useRoute<ChatRoute>();
  const { appointmentId } = route.params;
  const { user } = useAuth();
  const { data: messages } = useChatHistory(appointmentId);
  const send = useSendMessage(appointmentId);
  const [text, setText] = useState('');

  const submit = () => {
    const content = text.trim();
    if (!content) return;
    send.mutate(content);
    setText('');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <FlatList
          data={messages ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const mine = item.senderId === user?.id;
            return (
              <View style={[styles.bubbleRow, mine ? styles.rowMine : styles.rowTheirs]}>
                <View style={[styles.bubble, mine ? styles.bubbleMine : styles.bubbleTheirs]}>
                  <Text style={[styles.msg, mine && styles.msgMine]}>{item.content}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type a message…"
            placeholderTextColor={lightPalette.textMuted}
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity style={styles.sendBtn} onPress={submit} disabled={send.isPending}>
            <Send color="#fff" size={20} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lightPalette.surface },
  list: { padding: spacing.md, gap: spacing.xs },
  bubbleRow: { flexDirection: 'row', marginBottom: spacing.xs },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '78%', paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: radius.lg },
  bubbleMine: { backgroundColor: lightPalette.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: lightPalette.background, borderBottomLeftRadius: 4 },
  msg: { ...typography.body, color: lightPalette.text },
  msgMine: { color: '#fff' },
  inputRow: {
    flexDirection: 'row', alignItems: 'flex-end', gap: spacing.sm, padding: spacing.sm,
    borderTopWidth: 1, borderTopColor: lightPalette.border, backgroundColor: lightPalette.background,
  },
  input: {
    flex: 1, ...typography.body, color: lightPalette.text, maxHeight: 100,
    backgroundColor: lightPalette.surface, borderRadius: radius.lg, paddingHorizontal: spacing.md, paddingVertical: spacing.sm,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: radius.pill, backgroundColor: lightPalette.primary,
    alignItems: 'center', justifyContent: 'center',
  },
});
