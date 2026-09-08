import { useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface NetworkNode {
  id: string;
  label: string;
  type: "organization" | "vendor";
  value: number;
}
interface NetworkEdge {
  source: string;
  target: string;
  weight: number;
}
interface NetworkData {
  nodes: NetworkNode[];
  edges: NetworkEdge[];
}

interface HoverInfo {
  label: string;
  sublabel: string;
  x: number;
  y: number;
}

function useReducedMotion() {
  const [reduced, setReduced] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = () => setReduced(mq.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);
  return reduced;
}

function Node({
  position,
  radius,
  color,
  label,
  sublabel,
  reduced,
  pulse,
  onHover,
  onUnhover,
}: {
  position: [number, number, number];
  radius: number;
  color: string;
  label: string;
  sublabel: string;
  reduced: boolean;
  pulse: boolean;
  onHover: (info: HoverInfo) => void;
  onUnhover: () => void;
}) {
  const meshRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);

  useFrame((state) => {
    if (reduced || !meshRef.current) return;
    if (pulse) {
      const s = 1 + Math.sin(state.clock.elapsedTime * 1.5) * 0.06;
      meshRef.current.scale.setScalar(s);
    }
  });

  return (
    <mesh
      ref={meshRef}
      position={position}
      onPointerOver={(e) => {
        e.stopPropagation();
        setHovered(true);
        onHover({
          label,
          sublabel,
          x: e.nativeEvent.offsetX,
          y: e.nativeEvent.offsetY,
        });
      }}
      onPointerOut={() => {
        setHovered(false);
        onUnhover();
      }}
    >
      <sphereGeometry args={[radius, 32, 32]} />
      <meshStandardMaterial
        color={color}
        emissive={color}
        emissiveIntensity={hovered ? 0.9 : 0.4}
        roughness={0.4}
      />
    </mesh>
  );
}

function Edge({
  start,
  end,
  thickness,
}: {
  start: [number, number, number];
  end: [number, number, number];
  thickness: number;
}) {
  const points = useMemo(
    () => [new THREE.Vector3(...start), new THREE.Vector3(...end)],
    [start, end]
  );
  const geometry = useMemo(() => new THREE.BufferGeometry().setFromPoints(points), [points]);

  return (
    <line>
      <primitive object={geometry} attach="geometry" />
      <lineBasicMaterial color="#818cf8" transparent opacity={Math.min(0.15 + thickness * 0.4, 0.7)} />
    </line>
  );
}

function Scene({
  data,
  reduced,
  onHover,
  onUnhover,
}: {
  data: NetworkData;
  reduced: boolean;
  onHover: (info: HoverInfo) => void;
  onUnhover: () => void;
}) {
  const groupRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (reduced || !groupRef.current) return;
    groupRef.current.rotation.y += delta * 0.06;
  });

  const maxValue = Math.max(...data.nodes.map((n) => n.value), 1);
  const vendors = data.nodes.filter((n) => n.type === "vendor");
  const orgNode = data.nodes.find((n) => n.type === "organization");

  const positions = useMemo(() => {
    const map = new Map<string, [number, number, number]>();
    map.set("org", [0, 0, 0]);
    vendors.forEach((v, i) => {
      const angle = (i / Math.max(vendors.length, 1)) * Math.PI * 2;
      const r = 2.6;
      map.set(v.id, [Math.cos(angle) * r, Math.sin(angle * 0.6) * 0.6, Math.sin(angle) * r]);
    });
    return map;
  }, [vendors]);

  return (
    <group ref={groupRef}>
      {data.edges.map((edge) => {
        const start = positions.get(edge.source);
        const end = positions.get(edge.target);
        if (!start || !end) return null;
        return (
          <Edge
            key={`${edge.source}-${edge.target}`}
            start={start}
            end={end}
            thickness={edge.weight / maxValue}
          />
        );
      })}

      {orgNode && (
        <Node
          position={[0, 0, 0]}
          radius={0.42}
          color="#4f46e5"
          label={orgNode.label}
          sublabel="Your organization"
          reduced={reduced}
          pulse={false}
          onHover={onHover}
          onUnhover={onUnhover}
        />
      )}

      {vendors.map((v) => {
        const pos = positions.get(v.id) ?? [0, 0, 0];
        const scale = 0.16 + (v.value / maxValue) * 0.24;
        return (
          <Node
            key={v.id}
            position={pos}
            radius={scale}
            color="#34d399"
            label={v.label}
            sublabel={`₹${v.value.toLocaleString("en-IN")} total spend`}
            reduced={reduced}
            pulse={true}
            onHover={onHover}
            onUnhover={onUnhover}
          />
        );
      })}
    </group>
  );
}

export default function NetworkGraph({ data }: { data: NetworkData }) {
  const reduced = useReducedMotion();
  const [hover, setHover] = useState<HoverInfo | null>(null);

  if (data.nodes.length <= 1) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-8 text-center h-[340px] flex items-center justify-center">
        <p className="text-slate-500 text-sm">
          Your supply-chain network will appear here once you have active vendor transactions.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-slate-900 rounded-xl overflow-hidden h-[340px] relative">
      <Canvas camera={{ position: [0, 2.2, 6], fov: 45 }} dpr={[1, 1.5]}>
        <ambientLight intensity={0.5} />
        <pointLight position={[4, 4, 4]} intensity={1.2} color="#818cf8" />
        <pointLight position={[-4, -2, -3]} intensity={0.4} color="#34d399" />
        <Scene data={data} reduced={reduced} onHover={setHover} onUnhover={() => setHover(null)} />
      </Canvas>

      {hover && (
        <div
          className="absolute pointer-events-none bg-slate-800 text-white text-xs rounded-lg px-3 py-2 shadow-xl z-10"
          style={{ left: hover.x + 14, top: hover.y + 14 }}
        >
          <p className="font-medium">{hover.label}</p>
          <p className="text-slate-300">{hover.sublabel}</p>
        </div>
      )}

      <div className="absolute bottom-3 left-4 flex items-center gap-4 text-[11px] text-white/40">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-indigo-500" /> Organization
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-400" /> Vendor
        </span>
      </div>
    </div>
  );
}