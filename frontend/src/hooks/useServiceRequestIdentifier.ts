import { useQuery } from '@tanstack/react-query';
import { serviceRequestIdentifierApi } from '@/lib/serviceRequestIdentifierApi';

export const useValidateServiceRequestIdentifier = (srIdentifier: string) => {
  return useQuery({
    queryKey: ['validateSrIdentifier', srIdentifier],
    queryFn: async () => {
      if (!srIdentifier || srIdentifier.trim() === '') {
        return { isValid: false, message: 'SR Identifier is required' };
      }
      
      try {
        const identifiers = await serviceRequestIdentifierApi.getAll();
        
        // Find a matching active identifier
        const matchingIdentifier = identifiers.find(
          id => id.identifier === srIdentifier && id.isActive
        );
        
        if (matchingIdentifier) {
          return { 
            isValid: true, 
            message: 'Valid SR Identifier',
            taskDescription: matchingIdentifier.task
          };
        } else {
          return { 
            isValid: false, 
            message: 'Invalid or inactive SR Identifier'
          };
        }
      } catch (error) {
        console.error('Error validating SR Identifier:', error);
        return { 
          isValid: false, 
          message: 'Error validating SR Identifier'
        };
      }
    },
    enabled: srIdentifier.trim().length > 0,
  });
};