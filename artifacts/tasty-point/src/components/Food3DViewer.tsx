import { Suspense, useRef, Component, useState, useEffect, type ReactNode } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, Environment, RoundedBox, Sphere, Cylinder, Torus } from "@react-three/drei";
import * as THREE from "three";

const FOOD_EMOJIS: Record<string, string> = {
  mains: "🍛", breads: "🫓", starters: "🥙", drinks: "🥤", desserts: "🍮",
};

const ITEM_BG_GRADIENTS: Record<string, string> = {
  mains:    "from-orange-100 to-amber-50",
  breads:   "from-yellow-100 to-amber-50",
  starters: "from-lime-100 to-green-50",
  drinks:   "from-blue-100 to-cyan-50",
  desserts: "from-pink-100 to-rose-50",
};

class WebGLErrorBoundary extends Component<
  { children: ReactNode; fallback: ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: ReactNode; fallback: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

const ITEM_COLORS: Record<string, string> = {
  m1: "#e07844",  m2: "#f0c060",  m3: "#8B5013",  m4: "#d4a06a",
  m5: "#f5c97f",  m6: "#f5d5a0",  m7: "#d4a870",  m8: "#f0c88a",
  m9: "#d4930e",  m10: "#c4682a", m11: "#d4b840",  m12: "#ffc947",
  m13: "#c45c20", m14: "#4a3520", m15: "#c43020",  m16: "#f5e8b0",
};

function Bowl({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.4;
  });
  return (
    <group ref={groupRef}>
      <Torus args={[0.9, 0.12, 16, 48]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#d0c5b0" roughness={0.4} metalness={0.1} />
      </Torus>
      <Sphere args={[0.82, 32, 32]} position={[0, -0.05, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.5} metalness={0.05} />
      </Sphere>
      <Cylinder args={[0.88, 0.7, 0.15, 48]} position={[0, -0.78, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#d0c5b0" roughness={0.4} />
      </Cylinder>
    </group>
  );
}

function Bread({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.3;
  });
  return (
    <group ref={groupRef} rotation={[0.2, 0, 0]}>
      <RoundedBox args={[1.8, 0.28, 1.4]} radius={0.12} smoothness={4} castShadow>
        <meshStandardMaterial color={color} roughness={0.7} metalness={0} />
      </RoundedBox>
      <RoundedBox args={[1.6, 0.1, 1.2]} radius={0.1} smoothness={4} position={[0, 0.18, 0]}>
        <meshStandardMaterial color={color} roughness={0.6} opacity={0.6} transparent />
      </RoundedBox>
    </group>
  );
}

function StarterCluster({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.5;
  });
  const positions: [number, number, number][] = [
    [0, 0, 0], [0.6, -0.2, 0.3], [-0.5, -0.1, 0.4],
    [0.2, -0.3, -0.6], [-0.3, 0.1, -0.4],
  ];
  const scales = [1, 0.8, 0.75, 0.7, 0.85];
  return (
    <group ref={groupRef}>
      {positions.map((pos, i) => (
        <Sphere key={i} args={[0.38 * scales[i], 20, 20]} position={pos} castShadow>
          <meshStandardMaterial color={color} roughness={0.55} metalness={0.05} />
        </Sphere>
      ))}
    </group>
  );
}

function DrinkGlass({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) groupRef.current.rotation.y += delta * 0.35;
  });
  return (
    <group ref={groupRef}>
      <Cylinder args={[0.55, 0.42, 1.5, 32]} position={[0, 0, 0]} castShadow>
        <meshStandardMaterial color="#d0e8f0" roughness={0.05} metalness={0.0} transparent opacity={0.6} />
      </Cylinder>
      <Cylinder args={[0.52, 0.39, 1.42, 32]} position={[0, 0.02, 0]}>
        <meshStandardMaterial color={color} roughness={0.2} metalness={0.05} transparent opacity={0.8} />
      </Cylinder>
      <Cylinder args={[0.58, 0.58, 0.05, 32]} position={[0, 0.78, 0]}>
        <meshStandardMaterial color={color} roughness={0.1} transparent opacity={0.5} />
      </Cylinder>
    </group>
  );
}

function DessertSphere({ color }: { color: string }) {
  const groupRef = useRef<THREE.Group>(null);
  useFrame((_, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.4;
      groupRef.current.position.y = Math.sin(Date.now() * 0.001) * 0.08;
    }
  });
  return (
    <group ref={groupRef}>
      <Sphere args={[0.75, 32, 32]} position={[0, 0.1, 0]} castShadow>
        <meshStandardMaterial color={color} roughness={0.3} metalness={0.1} />
      </Sphere>
      <Cylinder args={[0.8, 0.8, 0.1, 48]} position={[0, -0.65, 0]} receiveShadow>
        <meshStandardMaterial color="#e8dcc8" roughness={0.5} />
      </Cylinder>
    </group>
  );
}

function FoodShape({ itemId, categoryId }: { itemId: string; categoryId: string }) {
  const color = ITEM_COLORS[itemId] ?? "#e07844";
  switch (categoryId) {
    case "breads":   return <Bread color={color} />;
    case "starters": return <StarterCluster color={color} />;
    case "drinks":   return <DrinkGlass color={color} />;
    case "desserts": return <DessertSphere color={color} />;
    default:         return <Bowl color={color} />;
  }
}

function Plate() {
  return (
    <Cylinder args={[1.4, 1.3, 0.06, 64]} position={[0, -0.92, 0]} receiveShadow>
      <meshStandardMaterial color="#f0ece4" roughness={0.3} metalness={0.15} />
    </Cylinder>
  );
}

interface Food3DViewerProps {
  itemId: string;
  categoryId: string;
  className?: string;
  height?: number;
  showPlate?: boolean;
}

function checkWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
    return !!ctx;
  } catch {
    return false;
  }
}

export function Food3DViewer({ itemId, categoryId, className = "", height = 320, showPlate = true }: Food3DViewerProps) {
  const emoji = FOOD_EMOJIS[categoryId] ?? "🍽";
  const gradient = ITEM_BG_GRADIENTS[categoryId] ?? "from-muted to-muted/40";
  const [webglOk] = useState(() => checkWebGL());

  if (!webglOk) {
    return (
      <div
        className={`${className} w-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} gap-3`}
        style={{ height }}
      >
        <div className="text-8xl select-none" style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.18))", transform: "perspective(200px) rotateX(10deg)" }}>
          {emoji}
        </div>
        <p className="text-xs text-muted-foreground/70 font-medium">3D Preview</p>
      </div>
    );
  }

  return (
    <div className={className} style={{ height }}>
      <WebGLErrorBoundary fallback={
        <div className={`w-full h-full flex flex-col items-center justify-center bg-gradient-to-br ${gradient} gap-3`} style={{ height }}>
          <div className="text-8xl select-none" style={{ filter: "drop-shadow(0 6px 16px rgba(0,0,0,0.18))" }}>{emoji}</div>
          <p className="text-xs text-muted-foreground/70 font-medium">3D Preview</p>
        </div>
      }>
        <Canvas
          shadows
          camera={{ position: [0, 1.5, 4], fov: 40 }}
          gl={{ antialias: true, alpha: true, failIfMajorPerformanceCaveat: false }}
          style={{ background: "transparent" }}
        >
          <Suspense fallback={null}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[4, 6, 4]} intensity={1.2} castShadow shadow-mapSize={[512, 512]} />
            <pointLight position={[-3, 3, -3]} intensity={0.4} color="#ffd700" />
            <Environment preset="city" />
            <group position={[0, 0.3, 0]}>
              <FoodShape itemId={itemId} categoryId={categoryId} />
              {showPlate && <Plate />}
            </group>
            <OrbitControls
              enablePan={false}
              minDistance={2.5}
              maxDistance={7}
              minPolarAngle={Math.PI / 6}
              maxPolarAngle={Math.PI / 1.8}
              autoRotate={false}
              enableDamping
              dampingFactor={0.08}
            />
          </Suspense>
        </Canvas>
      </WebGLErrorBoundary>
    </div>
  );
}

export function Food3DViewerSkeleton({ height = 320 }: { height?: number }) {
  return (
    <div
      className="bg-muted/40 rounded-2xl animate-pulse flex items-center justify-center"
      style={{ height }}
    >
      <span className="text-5xl opacity-30">🍽</span>
    </div>
  );
}
