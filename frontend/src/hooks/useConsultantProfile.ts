import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api';

export interface ConsultantProfileDto {
  hourlyRate: number;
  upiId?: string | null;
  isVerified: boolean;
}

// Authenticated consultant's own profile (GET/PUT)
export const useConsultantSelfProfile = () => {
  return useQuery<ConsultantProfileDto>({
    queryKey: ['consultant-self-profile'],
    queryFn: async () => {
      const res = await apiFetch('consultant/profile');
      if (!res.ok) {
        throw new Error('Failed to load consultant profile');
      }
      return res.json();
    }
  });
};

export const useUpdateConsultantSelfProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { hourlyRate: number; upiId?: string | null }) => {
      const res = await apiFetch('consultant/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ hourlyRate: data.hourlyRate, upiId: data.upiId })
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update profile');
      }
      return res.json();
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['consultant-self-profile'] });
    }
  });
};

// Public read-only profile for a given consultant id
export const useConsultantPublicProfile = (consultantId?: string | null) => {
  return useQuery<ConsultantProfileDto>({
    queryKey: ['consultant-public-profile', consultantId],
    queryFn: async () => {
      const res = await apiFetch(`consultant-profile/${consultantId}`);
      if (!res.ok) {
        throw new Error('Failed to load consultant public profile');
      }
      return res.json();
    },
    enabled: !!consultantId,
  });
};
