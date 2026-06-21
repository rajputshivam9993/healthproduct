import { apiClient } from './api/client';

/** Doctor's own profile shape (Req 21.6). */
export interface DoctorProfile {
  id: string;
  specialization: string | null;
  experienceYears: number;
  consultationFee: string | null;
  qualification: string | null;
  degree: string | null;
  clinicAddress: string | null;
  latitude: string | null;
  longitude: string | null;
  bio: string | null;
  verificationStatus: 'PENDING' | 'VERIFIED' | 'REJECTED';
  avgRating: string;
  totalReviews: number;
  documentUrl: string | null;
  user: { name: string | null; email: string | null; phone: string };
}

export interface UpdateDoctorProfilePayload {
  specialization?: string;
  experienceYears?: number;
  consultationFee?: number;
  clinicAddress?: string;
  bio?: string;
  latitude?: number;
  longitude?: number;
}

/** A doctor search result row (Req 5.3). */
export interface DoctorSearchResult {
  id: string;
  name: string | null;
  specialization: string | null;
  experienceYears: number;
  consultationFee: string | null;
  rating: string;
  distanceMeters: number;
  nextAvailableSlot: string | null;
  city: string | null;
  state: string | null;
}

export interface DoctorSearchResponse {
  items: DoctorSearchResult[];
  total: number;
  page: number;
  pageSize: number;
  suggestion?: string;
}

export interface SearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  specialization?: string;
}

/** Doctor self-service profile + patient search API (Req 4.2, 5, 21.6). */
export const doctorService = {
  /** Fetch the list of specializations from the backend. */
  getSpecializations(): Promise<{ specializations: string[] }> {
    return apiClient.get('/doctors/specializations').then((r) => r.data);
  },

  search(params: SearchParams): Promise<DoctorSearchResponse> {
    return apiClient.get('/doctors/search', { params }).then((r) => r.data);
  },

  getMyProfile(): Promise<DoctorProfile> {
    return apiClient.get('/doctors/me').then((r) => r.data);
  },
  updateMyProfile(payload: UpdateDoctorProfilePayload): Promise<DoctorProfile> {
    return apiClient.patch('/doctors/me', payload).then((r) => r.data);
  },
};
