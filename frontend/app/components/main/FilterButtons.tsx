// components/FilterButtons.tsx
'use client';

import { featureConfig } from '@/lib/libData'; // Or from '@/lib/constants'
import { useFilter } from '@/context/FilterContext';

export default function FilterButtons() {
  const { selectedFilters, toggleFilter } = useFilter();

  return (
    <div className="flex flex-wrap gap-2 my-4">
      {featureConfig.map((feature) => {
        const isSelected = selectedFilters.includes(feature.key);
        const IconComponent = feature.icon;

        return (
          <button
            key={feature.key}
            type="button"
            onClick={() => toggleFilter(feature.key)}
            className={`
              inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium transition-all border select-none
              ${isSelected 
                ? "bg-purple-100 text-purple-700 border-purple-200 shadow-xs" 
                : "bg-white text-slate-700 border-gray-200 hover:bg-slate-50 hover:border-gray-300"
              }
            `} // feature.activeColor || 
          >
            {IconComponent ? (
              <IconComponent className="w-4 h-4" />
            ) : (
              <span>{isSelected ? "✓" : "+"}</span>
            )}
            <span>{feature.label}</span>
          </button>
        );
      })}
    </div>
  );
}