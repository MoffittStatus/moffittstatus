import { Line } from '@react-three/drei'
import * as THREE from 'three'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber';

export default function NavigationPath({ routePoints, userGps }) {
    const lineRef = useRef<THREE.Mesh>(null);
    useFrame((state) => {
        // The '?' or the 'if' check prevents the "Cannot read property 'material' of null" error
        if (lineRef.current && lineRef.current.material) {
          lineRef.current.material.opacity = 0.6 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
        }
      });
  // Use useMemo so we don't do math 60 times a second
  const points = useMemo(() => {
    return routePoints.map(p => {
      // longitude = p[0], latitude = p[1]
      const x = (p[0] - userGps.lon) * 111320 * Math.cos(userGps.lat * Math.PI / 180);
      const z = -(p[1] - userGps.lat) * 111320;
      
      // Using -1.5 for Y to place it on the physical floor 
      // relative to a standing user's camera (approx 1.5m high)
      return new THREE.Vector3(x, -1.5, z); 
    });
  }, [routePoints, userGps]);

  return (
    <group>
      {points.map((p, i) => {
        // 1. Waypoint Diamonds
        const diamond = (
          <mesh key={`diamond-${i}`} position={[p.x, p.y + 0.5, p.z]}>
            <octahedronGeometry args={[0.1, 0]} />
            <meshStandardMaterial color="white" emissive="cyan" emissiveIntensity={10} />
          </mesh>
        );
  
        // 2. Arrows pointing to next node
        let arrow = null;
        if (i < points.length - 1) {
          const nextPoint = points[i + 1];
          const midPoint = new THREE.Vector3().lerpVectors(p, nextPoint, 0.5);
          
          arrow = (
            <mesh 
              key={`arrow-${i}`} 
              position={[midPoint.x, midPoint.y + 0.1, midPoint.z]}
              onUpdate={(self) => self.lookAt(nextPoint.x, midPoint.y + 0.1, nextPoint.z)}
            >
              <coneGeometry args={[0.15, 0.5, 3]} />
              <meshBasicMaterial color="white" />
            </mesh>
          );
        }
  
        return (
          <group key={`group-${i}`}>
            {diamond}
            {arrow}
          </group>
        );
      })}
  
      <Line
        ref={lineRef}
        points={points}
        color="#0077ff"
        lineWidth={30}
        transparent // Required for opacity pulsing
        opacity={0.8}
      />
    </group>
  );
}