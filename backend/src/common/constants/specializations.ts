/**
 * Canonical list of doctor specializations. Used to validate registration /
 * profile updates and the search specialty filter (Req 5.2). Centralized so the
 * value set lives in one place (Req 20.8).
 */
export const SPECIALIZATIONS = [
  'General Physician',
  'Cardiologist',
  'Dermatologist',
  'Pediatrician',
  'Gynecologist',
  'Orthopedic',
  'Neurologist',
  'Psychiatrist',
  'Dentist',
  'ENT Specialist',
  'Ophthalmologist',
  'Gastroenterologist',
  'Urologist',
  'Endocrinologist',
  'Pulmonologist',
] as const;

export type Specialization = (typeof SPECIALIZATIONS)[number];

export function isValidSpecialization(value: string): value is Specialization {
  return (SPECIALIZATIONS as readonly string[]).includes(value);
}
