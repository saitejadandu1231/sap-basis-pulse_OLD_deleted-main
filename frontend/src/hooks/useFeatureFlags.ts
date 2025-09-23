import { useQuery } from '@tanstack/react-query';
import featureFlagService, { FeatureFlags } from '@/services/featureFlagService';

export const useFeatureFlags = () => {
  return useQuery<FeatureFlags>({
    queryKey: ['featureFlags'],
    queryFn: () => featureFlagService.getFeatureFlags(),
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes (previously cacheTime)
    refetchOnWindowFocus: false,
  });
};

export const useMessagingEnabled = () => {
  const { data: featureFlags, isLoading, error } = useFeatureFlags();
  
  return {
    isEnabled: featureFlags?.messagingEnabled ?? false,
    isLoading,
    error
  };
};

export const useConsultantRegistrationEnabled = () => {
  const { data: featureFlags, isLoading, error } = useFeatureFlags();
  
  return {
    isEnabled: featureFlags?.consultantRegistrationEnabled ?? false,
    isLoading,
    error
  };
};