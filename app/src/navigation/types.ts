import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

/** Patient stack routes: the tab navigator plus pushed detail screens. */
// Shared params for the video call screen (used by both patient & doctor stacks).
export type VideoCallParams = { appointmentId: string; peerName: string };

export type PatientStackParamList = {
  Tabs: undefined;
  DoctorBooking: { doctorId: string; name: string };
  PatientDetail: { slotId: string };
  VideoCall: VideoCallParams;
  Chat: { appointmentId: string; peerName: string };
  ReviewSubmit: { appointmentId: string; doctorName: string };
  Prescriptions: undefined;
};

export type DoctorStackParamList = {
  Tabs: undefined;
  ConsultationDetail: { appointmentId: string };
  VideoCall: VideoCallParams;
  Chat: { appointmentId: string; peerName: string };
};

export type PatientNav = NativeStackNavigationProp<PatientStackParamList>;
export type DoctorNav = NativeStackNavigationProp<DoctorStackParamList>;
