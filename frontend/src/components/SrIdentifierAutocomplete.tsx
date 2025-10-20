import React, { useState, useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSrIdentifierAutocomplete, useSrIdentifierValidation } from '@/hooks/useSrIdentifierAutocomplete';
import { Check, ChevronDown, Search, Loader2 } from 'lucide-react';

interface SrIdentifierAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
}

const SrIdentifierAutocomplete: React.FC<SrIdentifierAutocompleteProps> = ({
  value,
  onChange,
  placeholder = "Enter or search SR number (e.g., SR123456789)",
  label = "Service Request Identifier",
  required = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [hasFocus, setHasFocus] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Use the search term to get suggestions when user types
  const { suggestions, isLoading: suggestionsLoading, allIdentifiers } = useSrIdentifierAutocomplete(
    searchTerm.length > 0 ? searchTerm : ''
  );
  
  // Debug logging
  console.log('Autocomplete Debug:', {
    searchTerm,
    hasFocus,
    suggestionsCount: suggestions.length,
    allIdentifiersCount: allIdentifiers?.length || 0,
    isLoading: suggestionsLoading
  });
  
  // Validate the current value, but only after we have the SR identifiers data
  const { data: validationResult, isLoading: validatingIdentifier } = useSrIdentifierValidation(value);

  // Update search term when value changes externally
  useEffect(() => {
    if (value !== searchTerm) {
      setSearchTerm(value);
    }
  }, [value]);

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    onChange(newValue);
    
    // Show dropdown when user starts typing
    if (newValue.length > 0) {
      setIsOpen(true);
    } else {
      setIsOpen(false);
    }
  };

  // Handle selecting a suggestion
  const handleSelectSuggestion = (identifier: string) => {
    console.log('Selected SR Identifier:', identifier); // Debug log
    onChange(identifier);
    setSearchTerm(identifier);
    setIsOpen(false);
    inputRef.current?.blur();
  };

  // Handle input focus
  const handleFocus = () => {
    setHasFocus(true);
    // Show suggestions if we have a search term
    if (searchTerm.length > 0) {
      setIsOpen(true);
    }
  };

  // Handle input blur
  const handleBlur = () => {
    setHasFocus(false);
    // Delay closing to allow for clicks on suggestions
    setTimeout(() => {
      setIsOpen(false);
    }, 150);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        inputRef.current &&
        !inputRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const showSuggestions = isOpen && suggestions.length > 0;
  
  // Debug the dropdown state
  console.log('Dropdown state:', {
    isOpen,
    suggestionsLength: suggestions.length,
    hasFocus,
    showSuggestions,
    searchTerm
  });

  return (
    <div className="space-y-2 relative">
      <Label htmlFor="srIdentifier" className="text-base font-semibold">
        {label} {required && '*'}
      </Label>
      
      <div className="relative">
        <div className="relative">
          <Input
            ref={inputRef}
            id="srIdentifier"
            placeholder={placeholder}
            value={searchTerm}
            onChange={handleInputChange}
            onFocus={handleFocus}
            onBlur={handleBlur}
            className="pr-8"
          />
          <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
            {(suggestionsLoading || validatingIdentifier) ? (
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            ) : (
              <Search className="h-4 w-4 text-muted-foreground" />
            )}
          </div>
        </div>

        {/* Suggestions Dropdown */}
        {(showSuggestions || (isOpen && searchTerm.length > 0)) && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-background border border-border rounded-md shadow-lg max-h-60 overflow-auto"
          >
            <div className="py-1">
              {suggestions.length > 0 ? (
                suggestions.map((suggestion) => (
                <div
                  key={suggestion.id}
                  className="px-3 py-2 cursor-pointer hover:bg-muted transition-colors"
                  onClick={() => handleSelectSuggestion(suggestion.identifier)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <Badge variant="outline" className="text-xs">
                          {suggestion.identifier}
                        </Badge>
                        {value === suggestion.identifier && (
                          <Check className="h-4 w-4 text-green-600" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 truncate">
                        {suggestion.task}
                      </p>
                    </div>
                  </div>
                </div>
                ))
              ) : (
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  No SR identifiers found matching "{searchTerm}"
                  {allIdentifiers && allIdentifiers.length > 0 && (
                    <div className="mt-1 text-xs">
                      Available active SRs: {allIdentifiers.filter(id => id.isActive).length}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Validation Messages */}
      {validatingIdentifier && (
        <p className="text-sm text-muted-foreground flex items-center">
          <Loader2 className="h-3 w-3 animate-spin mr-1" />
          Validating...
        </p>
      )}
      
      {value && validationResult && (
        <div className="space-y-1">
          <p className={`text-sm ${validationResult.isValid ? 'text-green-600' : 'text-red-600'}`}>
            {validationResult.message}
          </p>
          {validationResult.isValid && validationResult.taskDescription && (
            <div className="p-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-sm text-green-800 dark:text-green-200">
                <strong>Task:</strong> {validationResult.taskDescription}
              </p>
            </div>
          )}
        
        </div>
      )}
    </div>
  );
};

export default SrIdentifierAutocomplete;