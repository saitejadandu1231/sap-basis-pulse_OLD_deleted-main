import { useQuery } from '@tanstack/react-query';
import { serviceRequestIdentifierApi } from '@/lib/serviceRequestIdentifierApi';
import { useMemo } from 'react';

// Shared query key and fetcher function to avoid cache conflicts
const SR_IDENTIFIERS_QUERY_KEY = ['srIdentifiers', 'all'];

const fetchAllSrIdentifiers = async () => {
  const identifiers = await serviceRequestIdentifierApi.getAll();
  console.log('Fetched SR Identifiers:', identifiers); // Debug log
  return identifiers;
};

export const useSrIdentifierAutocomplete = (searchTerm: string) => {
  // Fetch all SR identifiers using shared query
  const { data: allIdentifiers, isLoading, error } = useQuery({
    queryKey: SR_IDENTIFIERS_QUERY_KEY,
    queryFn: fetchAllSrIdentifiers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Filter identifiers based on search term
  const filteredIdentifiers = useMemo(() => {
    if (!allIdentifiers) {
      console.log('No allIdentifiers data available');
      return [];
    }
    
    if (!searchTerm || searchTerm.trim().length === 0) {
      console.log('No search term provided');
      return [];
    }
    
    // Only show active identifiers
    const activeIdentifiers = allIdentifiers.filter(id => id.isActive);
    console.log('Active identifiers:', activeIdentifiers.length, 'out of', allIdentifiers.length);
    console.log('First few active identifiers:', activeIdentifiers.slice(0, 5).map(id => ({ 
      identifier: id.identifier, 
      task: id.task.substring(0, 50) + '...' 
    })));
    
    const searchLower = searchTerm.toLowerCase().trim();
    
    // If search term is very short (like "sr"), show more results
    const filtered = activeIdentifiers
      .filter(identifier => {
        const matchesId = identifier.identifier.toLowerCase().includes(searchLower);
        const matchesTask = identifier.task.toLowerCase().includes(searchLower);
        const result = matchesId || matchesTask;
        
        if (result) {
          console.log(`Match found: "${identifier.identifier}" for search "${searchTerm}"`);
        }
        
        return result;
      })
      .slice(0, searchTerm.length <= 2 ? 20 : 10); // Show more results for short searches
      
    console.log('Filtered results for "' + searchTerm + '":', filtered.length, 'matches');
    
    return filtered;
  }, [allIdentifiers, searchTerm]);

  return {
    suggestions: filteredIdentifiers || [],
    isLoading,
    error,
    allIdentifiers // Return all identifiers for debugging
  };
};

export const useSrIdentifierValidation = (srIdentifier: string) => {
  // Use the same shared query to get SR identifiers
  const { data: allIdentifiers } = useQuery({
    queryKey: SR_IDENTIFIERS_QUERY_KEY,
    queryFn: fetchAllSrIdentifiers,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return useQuery({
    queryKey: ['validateSrIdentifier', srIdentifier],
    queryFn: async () => {
      if (!srIdentifier || srIdentifier.trim() === '') {
        return { isValid: false, message: 'SR Identifier is required' };
      }
      
      try {
        // Use cached data if available, otherwise fetch fresh
        const identifiers = allIdentifiers || await fetchAllSrIdentifiers();
        
        console.log('Validating SR:', srIdentifier); // Debug log
        console.log('Available identifiers:', identifiers.map(id => ({ id: id.identifier, active: id.isActive }))); // Debug log
        
        // Find a matching active identifier
        const matchingIdentifier = identifiers.find(
          id => id.identifier === srIdentifier && id.isActive
        );
        
        console.log('Matching identifier found:', matchingIdentifier); // Debug log
        
        if (matchingIdentifier) {
          return { 
            isValid: true, 
            message: 'Valid SR Identifier',
            taskDescription: matchingIdentifier.task
          };
        } else {
          // Check if identifier exists but is inactive
          const inactiveMatch = identifiers.find(id => id.identifier === srIdentifier);
          if (inactiveMatch) {
            return { 
              isValid: false, 
              message: 'SR Identifier is inactive'
            };
          } else {
            return { 
              isValid: false, 
              message: 'SR Identifier not found'
            };
          }
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