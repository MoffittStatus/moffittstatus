"use client"
import * as THREE from 'three'
import NavigationPath from "./navigationPath"
import { useTrueNorth } from "./trueNorth"
import { useMemo } from 'react'

export default function ARWorld({ routePoints, userGps }) {
  const heading = useTrueNorth()

  // 1. Calculate the target position (the last point in the route)
  const targetPosition = useMemo(() => {
    if (!routePoints || routePoints.length === 0) return new THREE.Vector3(0, 0, 0)
    
    const lastPoint = routePoints[routePoints.length - 1]
    
    // GPS to Meters conversion
    const x = (lastPoint[0] - userGps.lon) * (111320 * Math.cos(userGps.lat * Math.PI / 180))
    const z = -(lastPoint[1] - userGps.lat) * 111320
    
    // We put it at -1.5 (floor level)
    return new THREE.Vector3(x, -1.5, z)
  }, [routePoints, userGps])

  // 2. Rotate the world by negative heading to align with North
  const rotationY = -(heading * Math.PI) / 180

  return (
    <group rotation={[0, rotationY, 0]}>
      {/* The Line Component */}
      <NavigationPath routePoints={routePoints} userGps={userGps} />
      
      {/* The Destination Marker (using calculated targetPosition) */}
      <mesh position={targetPosition}>
        <cylinderGeometry args={[0.3, 0.3, 2, 32]} />
        <meshStandardMaterial color="cyan" opacity={0.6} transparent />
      </mesh>

      {/* Optional: A small floor circle under the marker */}
      <mesh position={[targetPosition.x, -1.49, targetPosition.z]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.4, 0.5, 32]} />
        <meshBasicMaterial color="cyan" />
      </mesh>
    </group>
  )
}