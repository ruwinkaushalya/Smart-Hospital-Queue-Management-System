import { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Stars, Text, Float } from '@react-three/drei';
import * as THREE from 'three';

// ===================== Coordinate Helpers =====================

const MIN_LAT = 6.82, MAX_LAT = 7.05;
const MIN_LNG = 79.78, MAX_LNG = 80.0;

function latLngToWorld(lat, lng) {
  const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * 20 - 10;
  const z = ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * 20 - 10;
  return [x, z];
}

// ===================== Animated Hospital Building =====================

function HospitalBuilding({ hospital, onClick, isSelected }) {
  const meshRef = useRef();
  const glowRef = useRef();
  const [hovered, setHovered] = useState(false);

  const [x, z] = latLngToWorld(hospital.lat, hospital.lng);
  const height = Math.max(1.5, (hospital.totalBeds / 50) * 1.2);
  const isEmergency = hospital.hasEmergency;

  const color = isEmergency ? '#ef4444' : '#0891b2';
  const glowColor = isEmergency ? '#ff3333' : '#00d4ff';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.rotation.y = Math.sin(t * 0.3) * 0.05;
    }
    if (glowRef.current) {
      const scale = 1 + Math.sin(t * 2) * 0.15;
      glowRef.current.scale.setScalar(scale);
      glowRef.current.material.opacity = 0.15 + Math.sin(t * 1.5) * 0.05;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Glow ring */}
      <mesh ref={glowRef} position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.5, 3.5, 32]} />
        <meshBasicMaterial color={glowColor} transparent opacity={0.2} side={THREE.DoubleSide} />
      </mesh>

      {/* Building base */}
      <mesh
        ref={meshRef}
        position={[0, height / 2, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(hospital); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[1.8, height, 1.8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.6 : hovered ? 0.4 : 0.2}
          roughness={0.3}
          metalness={0.7}
        />
      </mesh>

      {/* Building top cap */}
      <mesh position={[0, height + 0.1, 0]}>
        <cylinderGeometry args={[0.6, 0.6, 0.2, 16]} />
        <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} />
      </mesh>

      {/* Floating label */}
      <Float speed={2} floatIntensity={0.3} rotationIntensity={0}>
        <Text
          position={[0, height + 1.2, 0]}
          fontSize={0.6}
          color={isEmergency ? '#ff6b6b' : '#4ecdc4'}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.05}
          outlineColor="#000000"
        >
          {hospital.id}
        </Text>
      </Float>

      {/* Health bar */}
      <group position={[0, 0.3, 0]}>
        <mesh position={[0, 0, 0]}>
          <boxGeometry args={[2.2, 0.12, 0.12]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        <mesh position={[-(1.1 - (hospital.loadFactor * 1.1)), 0, 0]}>
          <boxGeometry args={[hospital.loadFactor * 2.2, 0.12, 0.12]} />
          <meshStandardMaterial
            color={hospital.loadFactor > 0.7 ? '#ef4444' : hospital.loadFactor > 0.5 ? '#f59e0b' : '#22c55e'}
            emissive={hospital.loadFactor > 0.7 ? '#ef4444' : hospital.loadFactor > 0.5 ? '#f59e0b' : '#22c55e'}
            emissiveIntensity={0.5}
          />
        </mesh>
      </group>
    </group>
  );
}

// ===================== Road (mesh line) =====================

function Road({ road, hospitals }) {
  const fromH = hospitals.find(h => h.id === road.from);
  const toH = hospitals.find(h => h.id === road.to);
  if (!fromH || !toH) return null;

  const [x1, z1] = latLngToWorld(fromH.lat, fromH.lng);
  const [x2, z2] = latLngToWorld(toH.lat, toH.lng);

  const midX = (x1 + x2) / 2;
  const midZ = (z1 + z2) / 2;
  const length = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);
  const angle = Math.atan2(x2 - x1, z2 - z1);

  return (
    <mesh position={[midX, 0.05, midZ]} rotation={[0, angle, 0]}>
      <boxGeometry args={[0.08, 0.02, length]} />
      <meshStandardMaterial color="#4ecdc4" emissive="#4ecdc4" emissiveIntensity={0.4} transparent opacity={0.6} />
    </mesh>
  );
}

// ===================== Ambulance =====================

function Ambulance({ ambulance, onClick, isSelected }) {
  const meshRef = useRef();
  const pulseRef = useRef();
  const [hovered, setHovered] = useState(false);

  const [x, z] = latLngToWorld(ambulance.lat, ambulance.lng);
  const isAvailable = ambulance.status === 'AVAILABLE';
  const color = isAvailable ? '#22c55e' : '#f59e0b';

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (meshRef.current) {
      meshRef.current.position.y = 0.6 + Math.sin(t * 3 + x) * 0.15;
    }
    if (pulseRef.current) {
      const scale = 1 + Math.sin(t * 4) * 0.4;
      pulseRef.current.scale.setScalar(scale);
      pulseRef.current.material.opacity = 0.3 - Math.sin(t * 4) * 0.15;
    }
  });

  return (
    <group position={[x, 0, z]}>
      {/* Pulse ring */}
      <mesh ref={pulseRef} position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.8, 1.2, 16]} />
        <meshBasicMaterial color={color} transparent opacity={0.3} side={THREE.DoubleSide} />
      </mesh>

      {/* Ambulance body */}
      <mesh
        ref={meshRef}
        position={[0, 0.6, 0]}
        onClick={(e) => { e.stopPropagation(); onClick(ambulance); }}
        onPointerOver={() => setHovered(true)}
        onPointerOut={() => setHovered(false)}
      >
        <boxGeometry args={[0.6, 0.4, 0.8]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={isSelected ? 0.8 : hovered ? 0.6 : 0.4}
          roughness={0.2}
          metalness={0.8}
        />
      </mesh>

      {/* Light bar */}
      <mesh position={[0, 0.85, 0]}>
        <boxGeometry args={[0.5, 0.08, 0.1]} />
        <meshStandardMaterial
          color="#ffffff"
          emissive={isAvailable ? '#00ff00' : '#ffaa00'}
          emissiveIntensity={2}
        />
      </mesh>

      {/* Floating label */}
      <Float speed={3} floatIntensity={0.2} rotationIntensity={0}>
        <Text
          position={[0, 1.4, 0]}
          fontSize={0.4}
          color={color}
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.03}
          outlineColor="#000000"
        >
          {ambulance.id}
        </Text>
      </Float>
    </group>
  );
}

// ===================== Ground Grid =====================

function GroundGrid() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.05, 0]}>
        <planeGeometry args={[30, 30]} />
        <meshStandardMaterial color="#0a0a1a" roughness={0.8} metalness={0.2} />
      </mesh>
      <gridHelper args={[30, 30, '#1a1a3e', '#1a1a3e']} position={[0, 0, 0]} />
    </group>
  );
}

// ===================== Floating Particles =====================

const PARTICLE_COUNT = 100;
const PARTICLE_POSITIONS = new Float32Array(PARTICLE_COUNT * 3);
for (let i = 0; i < PARTICLE_COUNT; i++) {
  PARTICLE_POSITIONS[i * 3] = ((i * 0.618034) % 1 - 0.5) * 25;
  PARTICLE_POSITIONS[i * 3 + 1] = ((i * 0.414214) % 1) * 8 + 1;
  PARTICLE_POSITIONS[i * 3 + 2] = ((i * 0.732051) % 1 - 0.5) * 25;
}

function FloatingParticles() {
  const particlesRef = useRef();

  useFrame((state) => {
    if (particlesRef.current) {
      const t = state.clock.getElapsedTime();
      const pos = particlesRef.current.geometry.attributes.position.array;
      for (let i = 0; i < PARTICLE_COUNT; i++) {
        pos[i * 3 + 1] += Math.sin(t + i) * 0.002;
      }
      particlesRef.current.geometry.attributes.position.needsUpdate = true;
    }
  });

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={PARTICLE_POSITIONS}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#4ecdc4" size={0.05} transparent opacity={0.6} />
    </points>
  );
}

// ===================== Camera Controller =====================

function CameraController({ target, isAutoRotate }) {
  const controlsRef = useRef();
  const { camera } = useThree();

  useFrame(() => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = isAutoRotate;
    }
  });

  useEffect(() => {
    if (target && controlsRef.current) {
      const [tx, tz] = latLngToWorld(target.lat || 0, target.lng || 0);
      const ty = 0;

      controlsRef.current.target.set(tx, ty, tz);
      controlsRef.current.update();

      // Smoothly move camera closer to the target
      const dx = camera.position.x - tx;
      const dz = camera.position.z - tz;
      const dist = Math.sqrt(dx * dx + dz * dz);

      // Only zoom in if we're far away
      if (dist > 10) {
        const scale = 8 / dist;
        camera.position.x = tx + dx * scale;
        camera.position.z = tz + dz * scale;
        camera.position.y = Math.max(5, camera.position.y * scale * 0.9);
        controlsRef.current.update();
      }
    }
  }, [target, camera]);

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan={true}
      enableZoom={true}
      enableRotate={true}
      minDistance={5}
      maxDistance={30}
      maxPolarAngle={Math.PI / 2.2}
      autoRotate={isAutoRotate}
      autoRotateSpeed={0.5}
    />
  );
}

// ===================== Scene =====================

export default function HospitalScene3D({
  hospitals,
  roads,
  ambulances,
  selectedHospital,
  selectedAmbulance,
  onHospitalClick,
  onAmbulanceClick,
  cameraTarget,
}) {
  const hasSelection = !!(selectedHospital || selectedAmbulance);
  const targetToFocus = cameraTarget || selectedHospital || selectedAmbulance;

  return (
    <div className="w-full h-full" style={{ minHeight: '500px' }}>
      <Canvas
        camera={{ position: [12, 12, 12], fov: 50, near: 0.1, far: 100 }}
        style={{ background: '#050510' }}
      >
        <fog attach="fog" args={['#050510', 15, 40]} />
        <ambientLight intensity={0.3} color="#4ecdc4" />
        <directionalLight position={[10, 15, 10]} intensity={0.8} color="#ffffff" />
        <pointLight position={[0, 8, 0]} intensity={1} color="#4ecdc4" distance={20} />

        <Stars radius={50} depth={50} count={1000} factor={4} saturation={0} fade speed={1} />

        <GroundGrid />
        <FloatingParticles />

        {hospitals.map((h) => (
          <HospitalBuilding
            key={h.id}
            hospital={h}
            onClick={onHospitalClick}
            isSelected={selectedHospital?.id === h.id}
          />
        ))}

        {roads.map((r, i) => (
          <Road key={i} road={r} hospitals={hospitals} />
        ))}

        {ambulances.map((a) => (
          <Ambulance
            key={a.id}
            ambulance={a}
            onClick={onAmbulanceClick}
            isSelected={selectedAmbulance?.id === a.id}
          />
        ))}

        <CameraController
          target={targetToFocus}
          isAutoRotate={!hasSelection}
        />
      </Canvas>
    </div>
  );
}
