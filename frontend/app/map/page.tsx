'use client'

import dynamic from 'next/dynamic';
import { useMemo } from 'react';

export default function Home() {
  // useMemo ensures the component is defined only once
  const Map = useMemo(() => dynamic(
    () => import('../components/map/MapComponent'),
    { 
      loading: () => <p>A map is loading</p>,
      ssr: false 
    }
  ), []);

  return (
    <main style={{ height: '100vh', width: '100vw', display: 'flex', flexDirection: 'column' }}>
      <div style={{ padding: '20px', background: 'white', zIndex: 1000 }}>
        <h1 className="text-xl font-bold">Berkeley Navigator</h1>
        <p>Click the map to see coordinates</p>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        <Map />
      </div>
    </main>
  );
}