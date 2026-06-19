// Preset locations for the patient "location select" (avoids GPS permission flow
// in dev; a real device-location option can be added later).
export interface CityOption {
  label: string;
  latitude: number;
  longitude: number;
}

export const CITY_OPTIONS: CityOption[] = [
  { label: 'Bengaluru', latitude: 12.9716, longitude: 77.5946 },
  { label: 'Mumbai', latitude: 19.076, longitude: 72.8777 },
  { label: 'Delhi', latitude: 28.6139, longitude: 77.209 },
  { label: 'Hyderabad', latitude: 17.385, longitude: 78.4867 },
  { label: 'Chennai', latitude: 13.0827, longitude: 80.2707 },
  { label: 'Pune', latitude: 18.5204, longitude: 73.8567 },
  { label: 'Kolkata', latitude: 22.5726, longitude: 88.3639 },
];

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
