// context/FilterContext.tsx
'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

type FilterContextType = {
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  selectedFilters: string[];
  toggleFilter: (key: string) => void;
};

const FilterContext = createContext<FilterContextType | null>(null);

export function FilterProvider({ children }: { children: React.ReactNode }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);

  // Read initial URL params on page load
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    setSearchQuery(params.get('q') || '');
    setSelectedFilters(params.get('features')?.split(',').filter(Boolean) || []);
  }, []);

  // Silently sync URL without triggering Next.js server re-renders
  const syncUrl = (query: string, filters: string[]) => {
    const params = new URLSearchParams();
    if (query) params.set('q', query);
    if (filters.length > 0) params.set('features', filters.join(','));

    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
  };

  const handleSetSearchQuery = (q: string) => {
    setSearchQuery(q);
    syncUrl(q, selectedFilters);
  };

  const toggleFilter = (key: string) => {
    const nextFilters = selectedFilters.includes(key)
      ? selectedFilters.filter((f) => f !== key)
      : [...selectedFilters, key];

    setSelectedFilters(nextFilters); // ⚡ Instant UI update
    syncUrl(searchQuery, nextFilters);
  };

  return (
    <FilterContext.Provider
      value={{
        searchQuery,
        setSearchQuery: handleSetSearchQuery,
        selectedFilters,
        toggleFilter,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}

export function useFilter() {
  const context = useContext(FilterContext);
  if (!context) throw new Error('useFilter must be used within FilterProvider');
  return context;
}