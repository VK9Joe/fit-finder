"use client";

import * as React from "react";
import { Autocomplete, AutocompleteOption } from "@/components/ui/autocomplete";
import { searchBreeds, formatBreedName } from "@/data/breedList";

interface BreedAutocompleteProps {
  value?: string;
  onValueChange: (value: string) => void;
  className?: string;
  error?: boolean;
  disabled?: boolean;
}

export function BreedAutocomplete({
  value,
  onValueChange,
  className,
  error = false,
  disabled = false,
}: BreedAutocompleteProps) {
  const [searchResults, setSearchResults] = React.useState<AutocompleteOption[]>([]);

  // Initialize with popular breeds when no search term
  React.useEffect(() => {
    // Show most common breeds first when no search
    const popularBreeds = [
      'labrador retriever',
      'golden retriever', 
      'german shepherd',
      'bulldog',
      'poodle',
      'beagle',
      'rottweiler',
      'yorkshire terrier',
      'dachshund',
      'boxer',
      'husky',
      'boston terrier'
    ];
    
    setSearchResults(
      popularBreeds.map(breed => ({
        value: breed,
        label: formatBreedName(breed),
        score: 1,
      }))
    );
  }, []);

  const handleSearch = React.useCallback((searchTerm: string) => {
    if (!searchTerm.trim()) {
      // Show popular breeds when search is empty
      const popularBreeds = [
        'labrador retriever',
        'golden retriever', 
        'german shepherd',
        'bulldog',
        'poodle',
        'beagle',
        'rottweiler',
        'yorkshire terrier',
        'dachshund',
        'boxer',
        'mixed breed',
        'breed not listed'
      ];
      
      setSearchResults(
        popularBreeds.map(breed => ({
          value: breed,
          label: formatBreedName(breed),
        }))
      );
      return;
    }

    const results = searchBreeds(searchTerm, 8);
    
    const options: AutocompleteOption[] = results.map(result => ({
      value: result.breed,
      label: formatBreedName(result.breed),
    }));

    // Always ensure "breed not listed" is available for longer searches
    if (searchTerm.trim().length > 2) {
      const breedNotListedExists = options.some(opt => opt.value === 'breed not listed');
      if (!breedNotListedExists) {
        options.push({
          value: 'breed not listed',
          label: 'Breed Not Listed',
        });
      }
    }

    setSearchResults(options);
  }, []);


  return (
    <Autocomplete
      options={searchResults}
      value={value}
      onValueChange={onValueChange}
      onSearch={handleSearch}
      placeholder="Start typing your dog's breed..."
      emptyMessage="No breeds found. Try a different spelling or select 'Breed Not Listed'."
      className={className}
      error={error}
      disabled={disabled}
    />
  );
}
