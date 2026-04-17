import { useState, useEffect } from 'react';

export function useTrueNorth() {
  const [heading, setHeading] = useState(0);

  useEffect(() => {
    const handleOrientation = (event) => {
      // webkitCompassHeading is the standard for iOS
      // alpha (with absolute) is standard for Android
      const north = event.webkitCompassHeading || (360 - event.alpha);
      if (north) setHeading(north);
    };

    // Permission is required for iOS 13+ 
    const startCompass = async () => {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        const permission = await DeviceOrientationEvent.requestPermission();
        if (permission === 'granted') {
          window.addEventListener('deviceorientation', handleOrientation);
        }
      } else {
        window.addEventListener('deviceorientationabsolute', handleOrientation);
      }
    };

    startCompass();
    return () => {
      window.removeEventListener('deviceorientation', handleOrientation);
      window.removeEventListener('deviceorientationabsolute', handleOrientation);
    };
  }, []);

  return heading;
}