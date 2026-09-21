// app/components/main/discover/MapWrapper.tsx
'use client';

import React, { useState } from 'react';
import nextDynamic from 'next/dynamic';
import { MapComponentProps } from '../../map/MapComponent';
import { useMap } from './MapContext';

const DynamicMapComponent = nextDynamic<MapComponentProps>(
  () => import('@/app/components/map/MapComponent').then((mod) => mod.default),
  {
    loading: () => (
      <div className="w-full h-full bg-slate-100 animate-pulse flex items-center justify-center">
        <span className="text-sm text-gray-400 font-medium">Loading Map...</span>
      </div>
    ),
    ssr: false,
  }
);

export default function MapWrapper() {
  const [searchText, setSearchText] = useState('');
  const { mapRef } = useMap();

  return (
    <DynamicMapComponent
      searchText={searchText}
      setSearchText={setSearchText}
      onReady={(handle) => {
        mapRef.current = handle;
        return handle;
      }}
    />
  );
}