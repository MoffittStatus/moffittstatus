"use client"
import { Canvas, useFrame } from '@react-three/fiber'
import { createXRStore, XR, XROrigin } from '@react-three/xr'
import { useEffect, useRef, useState } from 'react'
import ARWorld from '../components/ar/ARWorld'
import * as THREE from 'three'

function PlayerControls({ children }: { children: React.ReactNode }) {
    // Use a Ref for position to bypass React's state delay
    const pos = useRef(new THREE.Vector3(0, 0, 0));
    const keys = useRef<Record<string, boolean>>({});
  
    useEffect(() => {
      const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true };
      const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false };
      
      // Attach specifically to window to ensure capture
      window.addEventListener('keydown', down);
      window.addEventListener('keyup', up);
      return () => {
        window.removeEventListener('keydown', down);
        window.removeEventListener('keyup', up);
      };
    }, []);
  
    useFrame((_, delta) => {
      const speed = 20 * delta; // Fast for testing
      if (keys.current['w']) pos.current.z += speed;
      if (keys.current['s']) pos.current.z -= speed;
      if (keys.current['a']) pos.current.x += speed;
      if (keys.current['d']) pos.current.x -= speed;
    });
  
    return (
      <group onBeforeRender={(renderer, scene, camera) => {
        // Manually sync the group position every frame
        scene.getObjectByName("movableWorld")?.position.copy(pos.current);
      }}>
        <group name="movableWorld">
          {children}
        </group>
      </group>
    );
  }
  const store = createXRStore({
    emulate: {
        environment: false 
      }
})
export default function App() {
  // Mock data for testing in your room/emulator
  const [userGps, setUserGps] = useState({ lat: 40.7128, lon: -74.0060 })
  const [route] = useState([
    [-74.0060, 40.7128], // Start
    [-74.0060, 40.7160], // North 350m
    [-74.0030, 40.7160], // East 250m
    [-74.0030, 40.7180], // North 220m
    [-74.0010, 40.7180], // East 160m
    [-74.0010, 40.7140], // South 450m
    [-74.0050, 40.7140], // West 330m
    [-74.0050, 40.7110], // South 330m
    [-74.0080, 40.7110], // West 250m
    [-74.0080, 40.7130], // North 220m
    [-74.0065, 40.7130], // East 120m
    [-74.0060, 40.7128], // Back to Start
  ]);
  
  return (
    <>
    
      <button 
        style={{ position: 'absolute', zIndex: 100, padding: '10px', top: '10px', left: '10px' }}
        onClick={() => store.enterAR()}
      >
        Start Navigation
      </button>      <button 
  style={{ position: 'absolute', bottom: 20, right: 20, zIndex: 1000 }}
  onClick={() => {
    const canvas = document.querySelector('canvas');
    canvas?.focus();
    console.log("Canvas focused - Try WASD now");
  }}
>
  Click to Enable Keyboard
</button>
      <Canvas camera={{ far: 10000 }}>

  <XR store={store}>
    <ambientLight intensity={1} />
    
    <PlayerControls>
      <ARWorld userGps={userGps} routePoints={route} />
      {/* Add a grid so you can actually see that you are moving */}
      <gridHelper args={[2000, 100, 0x444444, 0x222222]} position={[0, -1.51, 0]} />
    </PlayerControls>

  </XR>
</Canvas>
    </>
  )
}