// app/components/main/discover/MapContext.tsx
'use client';

import React, { createContext, useContext, useRef } from 'react';
import { MapComponentHandle } from '../../map/MapComponent';

interface MapContextType {
  mapRef: React.MutableRefObject<MapComponentHandle | null>;
  goToBestMatch: (location: string) => void;
}

const MapContext = createContext<MapContextType | null>(null);

export const MapProvider = ({ children }: { children: React.ReactNode }) => {
  const mapRef = useRef<MapComponentHandle | null>(null);

  const goToBestMatch = (location: string) => {
    mapRef.current?.goToBestMatch(location);
  };

  return (
    <MapContext.Provider value={{ mapRef, goToBestMatch }}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) throw new Error("useMap must be used within MapProvider");
  return context;
};