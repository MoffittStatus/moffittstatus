// components/SearchBar.tsx
'use client';

import { useFilter } from '@/context/FilterContext';

export default function SearchBar() {
  const { searchQuery, setSearchQuery } = useFilter();

  return (
    <input
      type="text"
      placeholder="Search by library name..."
      value={searchQuery}
      onChange={(e) => setSearchQuery(e.target.value)}
      className="w-full bg-transparent px-4 py-3.5 text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none"
    />
  );
}