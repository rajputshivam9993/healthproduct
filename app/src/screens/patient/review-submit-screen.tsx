import React, { useState } from 'react';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { Star } from 'lucide-react-native';
import { useSubmitReview } from '../../hooks/use-patient-extras';
import type { PatientStackParamList } from '../../navigation/types';
import { lightPalette, radius, spacing, typography } from '../../theme';

type ReviewRoute = RouteProp<PatientStackParamList, 'ReviewSubmit'>;

/** Patient review submission with star rating + comment (Req 11.1). */
export function ReviewSubmitScreen() {
  const route = useRoute<ReviewRoute>();
  const navigation = useNavigation();
  const { appointmentId, doctorName } = route.params;
  const submit = useSubmitReview();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const send = async () => {
    try {
      await submit.mutateAsync({ appointmentId, rating, comment: comment || undefined });
      Alert.alert('Thank you!', 'Your review has been submitted.');
      navigation.goBack();
    } catch (err) {
      Alert.alert('Could not submit', (err as { response?: { data?: { message?: string } } })?.response?.data?.message ?? 'Try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        <Text style={styles.title}>Rate your consultation</Text>
        <Text style={styles.subtitle}>with {doctorName}</Text>

        <View style={styles.stars}>
          {[1, 2, 3, 4, 5].map((n) => (
            <TouchableOpacity key={n} onPress={() => setRating(n)}>
              <Star size={40} color="#F5A623" fill={n <= rating ? '#F5A623' : 'transparent'} />
            </TouchableOpacity>
          ))}
        </View>

        <TextInput
          style={styles.input}
          placeholder="Share your experience (optional)"
          placeholderTextColor={lightPalette.textMuted}
          value={comment}
          onChangeText={setComment}
          multiline
          maxLength={1000}
        />

        <TouchableOpacity style={styles.btn} onPress={send} disabled={submit.isPending}>
          {submit.isPending ? <ActivityIndicator color="#fff" /> : <Text style={styles.btnText}>Submit review</Text>}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: lightPalette.background },
  content: { flex: 1, padding: spacing.lg },
  title: { ...typography.h2, color: lightPalette.text, textAlign: 'center' },
  subtitle: { ...typography.body, color: lightPalette.textMuted, textAlign: 'center', marginTop: 2 },
  stars: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginVertical: spacing.xl },
  input: {
    ...typography.body, color: lightPalette.text, borderWidth: 1, borderColor: lightPalette.border,
    borderRadius: radius.md, padding: spacing.md, minHeight: 100, textAlignVertical: 'top',
  },
  btn: { backgroundColor: lightPalette.primary, borderRadius: radius.md, paddingVertical: spacing.md, alignItems: 'center', marginTop: spacing.lg },
  btnText: { ...typography.h3, color: '#fff' },
});
