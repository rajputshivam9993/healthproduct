import React from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Download, FileText, Stethoscope, User } from 'lucide-react-native';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { useMyPrescriptions } from '../../hooks/use-patient-extras';
import type { Prescription, Medication } from '../../services/prescription-service';
import { radius, spacing, typography, type Palette } from '../../theme';
import { usePalette, useThemedStyles } from '../../theme/theme-context';

/** Generate HTML for a prescription that looks like a physical doctor's prescription pad. */
function generatePrescriptionHtml(prescription: Prescription): string {
  const date = new Date(prescription.createdAt).toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const doctorName = prescription.doctor?.user?.name ?? 'Doctor';
  const qualification = [prescription.doctor?.degree, prescription.doctor?.qualification]
    .filter(Boolean)
    .join(', ') || '';
  const specialization = prescription.doctor?.specialization ?? '';
  const patientName = prescription.patient?.name ?? 'Patient';
  const patientGender = prescription.patient?.gender ?? '';
  const patientAge = computeAge(prescription.patient?.dateOfBirth);

  const medsHtml = prescription.medications
    .map(
      (m, i) => `
      <tr>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${i + 1}.</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; font-weight: 600; color: #1a1a2e;">${m.name}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${m.dosage}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${m.frequency}</td>
        <td style="padding: 10px 12px; border-bottom: 1px solid #eee; color: #555;">${m.duration}</td>
      </tr>`,
    )
    .join('');

  return `
    <html>
    <head>
      <meta charset="utf-8" />
      <style>
        body { font-family: 'Georgia', serif; margin: 0; padding: 30px; background: #fff; }
        .header { border-bottom: 3px double #6C3FE8; padding-bottom: 16px; margin-bottom: 20px; }
        .header h1 { color: #6C3FE8; font-size: 22px; margin: 0 0 4px 0; }
        .header .doctor-name { font-size: 16px; color: #1a1a2e; font-weight: bold; margin: 0 0 2px; }
        .header .doctor-qual { font-size: 12px; color: #666; margin: 0; }
        .header .date { font-size: 12px; color: #888; margin-top: 8px; }
        .patient-info { background: #f8f6ff; padding: 12px 16px; border-radius: 6px; margin-bottom: 16px; font-size: 13px; color: #333; }
        .patient-info strong { color: #6C3FE8; }
        .rx { font-size: 36px; color: #6C3FE8; font-weight: bold; font-family: serif; margin: 12px 0 8px; }
        table { width: 100%; border-collapse: collapse; margin-top: 12px; }
        th { text-align: left; padding: 10px 12px; background: #f8f6ff; color: #6C3FE8; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; border-bottom: 2px solid #6C3FE8; }
        .notes { margin-top: 20px; padding: 14px; background: #faf8ff; border-left: 4px solid #6C3FE8; border-radius: 4px; font-size: 13px; color: #555; font-style: italic; }
        .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #eee; text-align: right; font-size: 11px; color: #aaa; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>℞ Prescription</h1>
        <p class="doctor-name">Dr. ${doctorName}</p>
        <p class="doctor-qual">${[qualification, specialization].filter(Boolean).join(' • ')}</p>
        <p class="date">Date: ${date}</p>
      </div>
      <div class="patient-info">
        <strong>Patient:</strong> ${patientName}${patientAge ? ` &nbsp;|&nbsp; Age: ${patientAge}` : ''}${patientGender ? ` &nbsp;|&nbsp; ${patientGender}` : ''}
      </div>
      <div class="rx">℞</div>
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>Medicine</th>
            <th>Dosage</th>
            <th>Frequency</th>
            <th>Duration</th>
          </tr>
        </thead>
        <tbody>
          ${medsHtml}
        </tbody>
      </table>
      ${prescription.notes ? `<div class="notes"><strong>Notes:</strong> ${prescription.notes}</div>` : ''}
      <div class="footer">Generated digitally • Do not alter</div>
    </body>
    </html>
  `;
}

/** Compute age from DOB string. */
function computeAge(dob?: string | null): string {
  if (!dob) return '';
  const d = new Date(dob);
  if (isNaN(d.getTime())) return '';
  const now = new Date();
  let age = now.getFullYear() - d.getFullYear();
  const m = now.getMonth() - d.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < d.getDate())) age--;
  return age >= 0 ? String(age) : '';
}

/** Patient prescription history with physical prescription-pad design (Req 10.3). */
export function PrescriptionsScreen() {
  const c = usePalette();
  const styles = useThemedStyles(makeStyles);
  const { data, isLoading } = useMyPrescriptions();

  const downloadPdf = async (prescription: Prescription) => {
    try {
      const html = generatePrescriptionHtml(prescription);
      const { uri } = await Print.printToFileAsync({ html });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(uri, { mimeType: 'application/pdf', dialogTitle: 'Save Prescription' });
      } else {
        Alert.alert('Saved', `PDF saved to: ${uri}`);
      }
    } catch {
      Alert.alert('Error', 'Could not generate PDF. Please try again.');
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      {isLoading ? (
        <ActivityIndicator color={c.primary} style={{ marginTop: spacing.lg }} />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(p) => p.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.center}>
              <View style={styles.emptyIconWrap}>
                <FileText color={c.textMuted} size={36} />
              </View>
              <Text style={styles.emptyTitle}>No Prescriptions</Text>
              <Text style={styles.emptyText}>
                Your prescriptions from consultations will appear here.
              </Text>
            </View>
          }
          renderItem={({ item }) => {
            const doctorName = item.doctor?.user?.name ?? 'Doctor';
            const qualParts = [item.doctor?.degree, item.doctor?.qualification].filter(Boolean);
            const qualText = qualParts.join(', ');
            const specText = item.doctor?.specialization ?? '';
            const patientName = item.patient?.name ?? 'Patient';
            const patientGender = item.patient?.gender ?? '';
            const patientAge = computeAge(item.patient?.dateOfBirth);

            return (
              <View style={styles.card}>
                {/* Prescription header — doctor info */}
                <View style={styles.padHeader}>
                  <View style={styles.padHeaderLeft}>
                    <View style={styles.rxBadge}>
                      <Text style={styles.rxSymbol}>℞</Text>
                    </View>
                    <View style={styles.padHeaderInfo}>
                      <Text style={styles.doctorName}>Dr. {doctorName}</Text>
                      {(qualText || specText) && (
                        <Text style={styles.doctorQual} numberOfLines={1}>
                          {[qualText, specText].filter(Boolean).join(' • ')}
                        </Text>
                      )}
                      <Text style={styles.padDate}>
                        {new Date(item.createdAt).toLocaleDateString(undefined, {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={styles.downloadBtn}
                    onPress={() => downloadPdf(item)}
                    activeOpacity={0.7}
                  >
                    <Download color={c.primary} size={16} />
                    <Text style={styles.downloadText}>PDF</Text>
                  </TouchableOpacity>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Patient info */}
                <View style={styles.patientInfo}>
                  <User color={c.primary} size={14} />
                  <Text style={styles.patientText}>
                    {patientName}
                    {patientAge ? `  •  ${patientAge} yrs` : ''}
                    {patientGender ? `  •  ${patientGender}` : ''}
                  </Text>
                </View>

                {/* Medications list */}
                <View style={styles.medsSection}>
                  {item.medications.map((m, i) => (
                    <View key={i} style={styles.medCard}>
                      <View style={styles.medIndex}>
                        <Text style={styles.medIndexText}>{i + 1}</Text>
                      </View>
                      <View style={styles.medContent}>
                        <Text style={styles.medName}>{m.name}</Text>
                        <View style={styles.medDetails}>
                          <View style={styles.medTag}>
                            <Text style={styles.medTagText}>{m.dosage}</Text>
                          </View>
                          <View style={styles.medTag}>
                            <Text style={styles.medTagText}>{m.frequency}</Text>
                          </View>
                          <View style={styles.medTag}>
                            <Text style={styles.medTagText}>{m.duration}</Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  ))}
                </View>

                {/* Notes section */}
                {item.notes && (
                  <View style={styles.notesSection}>
                    <Stethoscope color={c.primary} size={14} />
                    <Text style={styles.notesText}>{item.notes}</Text>
                  </View>
                )}

                {/* Footer */}
                <View style={styles.padFooter}>
                  <Text style={styles.footerText}>Digital Prescription • Do not alter</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const makeStyles = (c: Palette) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: c.surface },
    list: { padding: spacing.md, paddingBottom: 100, flexGrow: 1 },

    // Empty state
    center: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xl },
    emptyIconWrap: {
      width: 72,
      height: 72,
      borderRadius: 24,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyTitle: { fontSize: 16, fontWeight: '700', color: c.text },
    emptyText: { ...typography.body, color: c.textMuted, textAlign: 'center', paddingHorizontal: spacing.lg },

    // Prescription card — looks like a prescription pad
    card: {
      backgroundColor: c.background,
      borderRadius: radius.lg,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: c.border,
      overflow: 'hidden',
      shadowColor: c.primary,
      shadowOpacity: 0.08,
      shadowRadius: 14,
      shadowOffset: { width: 0, height: 4 },
      elevation: 3,
    },

    // Pad header
    padHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.md,
      backgroundColor: c.primaryMuted,
    },
    padHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
    padHeaderInfo: { flex: 1 },
    rxBadge: {
      width: 42,
      height: 42,
      borderRadius: 12,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
    },
    rxSymbol: { fontSize: 22, fontWeight: '700', color: '#fff', fontFamily: 'serif' },
    doctorName: { fontSize: 15, fontWeight: '700', color: c.text },
    doctorQual: { ...typography.caption, color: c.textMuted, marginTop: 1 },
    padDate: { ...typography.caption, color: c.textMuted, marginTop: 2 },
    downloadBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 5,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: radius.sm,
      backgroundColor: c.background,
      borderWidth: 1.5,
      borderColor: c.primary,
    },
    downloadText: { fontSize: 12, fontWeight: '700', color: c.primary },

    // Divider
    divider: {
      height: 3,
      backgroundColor: c.primary,
      opacity: 0.15,
    },

    // Patient info
    patientInfo: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 2,
      backgroundColor: c.surface,
    },
    patientText: { ...typography.caption, color: c.text, fontWeight: '600' },

    // Medications
    medsSection: { padding: spacing.md, gap: spacing.sm },
    medCard: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      padding: spacing.sm + 4,
      backgroundColor: c.surface,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: c.border,
    },
    medIndex: {
      width: 26,
      height: 26,
      borderRadius: 13,
      backgroundColor: c.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    medIndexText: { fontSize: 12, fontWeight: '700', color: c.primary },
    medContent: { flex: 1 },
    medName: { fontSize: 15, fontWeight: '700', color: c.text, marginBottom: 6 },
    medDetails: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    medTag: {
      paddingHorizontal: 8,
      paddingVertical: 3,
      borderRadius: 6,
      backgroundColor: c.primaryMuted,
    },
    medTagText: { fontSize: 11, fontWeight: '600', color: c.primary },

    // Notes
    notesSection: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
      marginHorizontal: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.sm + 4,
      backgroundColor: '#FFFBEB',
      borderRadius: radius.sm,
      borderLeftWidth: 3,
      borderLeftColor: '#F5A623',
    },
    notesText: { ...typography.caption, color: '#92400E', flex: 1, lineHeight: 18 },

    // Footer
    padFooter: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderTopWidth: 1,
      borderTopColor: c.border,
      alignItems: 'center',
    },
    footerText: { fontSize: 10, color: c.textMuted, letterSpacing: 0.5 },
  });
