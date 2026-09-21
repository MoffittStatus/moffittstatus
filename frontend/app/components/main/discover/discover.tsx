// app/components/main/discover/discover.tsx
// NO 'use client' HERE — Server Component by default

import MapWrapper from './MapWrapper';
import OskiChat from './OskiChat';
import DiscoveryLibraryDataLoader from './DiscoveryLibraryDataLoader';
import { MapProvider } from './MapContext';

export default async function DiscoverPage() {
  return (
    <MapProvider>
      <div className="relative h-[93dvh] w-full overflow-hidden bg-gray-100 font-sans">
        {/* Background Map Container */}
        <div className="absolute inset-0 z-0">
          <MapWrapper />
        </div>

        {/* Overlay Controls */}
        <div className="absolute bottom-0 left-0 w-full z-10 pointer-events-none">
          <OskiChat />
          <DiscoveryLibraryDataLoader />
        </div>
      </div>
    </MapProvider>
  );
}