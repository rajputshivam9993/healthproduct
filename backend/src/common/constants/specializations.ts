/**
 * @deprecated Use the Specialization entity / database table instead.
 * This file is kept temporarily for any remaining references during the transition.
 * The canonical source of specializations is now the `specializations` table.
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
