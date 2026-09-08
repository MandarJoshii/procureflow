import { useRef, useMemo, useEffect, useState } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

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

/** The central dimensional core — a nested icosahedron lattice, slowly rotating. */
function Core({ mode, reduced }: { mode: "login" | "signup"; reduced: boolean }) {
  const outerRef = useRef<THREE.Mesh>(null);
  const innerRef = useRef<THREE.Mesh>(null);
  const groupRef = useRef<THREE.Group>(null);
  const targetScale = useRef(1);

  useFrame((state, delta) => {
    if (reduced) return;
    if (outerRef.current) {
      outerRef.current.rotation.y += delta * 0.05;
      outerRef.current.rotation.x += delta * 0.015;
    }
    if (innerRef.current) {
      innerRef.current.rotation.y -= delta * 0.09;
      innerRef.current.rotation.z += delta * 0.02;
    }
    // mode morph: signup mode pulls the core slightly larger/brighter
    targetScale.current = mode === "signup" ? 1.12 : 1;
    if (groupRef.current) {
      groupRef.current.scale.lerp(
        new THREE.Vector3(targetScale.current, targetScale.current, targetScale.current),
        delta * 2
      );
      // gentle cursor-follow
      const px = (state.pointer.x * Math.PI) / 40;
      const py = (state.pointer.y * Math.PI) / 40;
      groupRef.current.rotation.y = THREE.MathUtils.lerp(groupRef.current.rotation.y, px, delta * 1.2);
      groupRef.current.rotation.x = THREE.MathUtils.lerp(groupRef.current.rotation.x, -py, delta * 1.2);
    }
  });

  const accent = mode === "signup" ? "#818cf8" : "#6366f1";

  return (
    <group ref={groupRef}>
      <mesh ref={outerRef}>
        <icosahedronGeometry args={[1.6, 1]} />
        <meshStandardMaterial
          color={accent}
          wireframe
          transparent
          opacity={0.22}
          emissive={accent}
          emissiveIntensity={0.15}
        />
      </mesh>
      <mesh ref={innerRef}>
        <icosahedronGeometry args={[1.0, 0]} />
        <meshStandardMaterial
          color={accent}
          wireframe
          transparent
          opacity={0.35}
          emissive={accent}
          emissiveIntensity={0.3}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[0.22, 32, 32]} />
        <meshStandardMaterial color={accent} emissive={accent} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** Sparse ambient particle field drifting slowly around the core. */
function Particles({ reduced }: { reduced: boolean }) {
  const ref = useRef<THREE.Points>(null);
  const count = 220;

  const positions = useMemo(() => {
    const arr = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const r = 3.5 + Math.random() * 4.5;
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.acos(2 * Math.random() - 1);
      arr[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      arr[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      arr[i * 3 + 2] = r * Math.cos(phi);
    }
    return arr;
  }, []);

  useFrame((_, delta) => {
    if (reduced || !ref.current) return;
    ref.current.rotation.y += delta * 0.008;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial size={0.018} color="#a5b4fc" transparent opacity={0.5} sizeAttenuation />
    </points>
  );
}

function CameraRig({ reduced }: { reduced: boolean }) {
  const { camera, pointer } = useThree();
  useFrame((_, delta) => {
    if (reduced) return;
    camera.position.x = THREE.MathUtils.lerp(camera.position.x, pointer.x * 0.35, delta * 1.5);
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, pointer.y * 0.25, delta * 1.5);
    camera.lookAt(0, 0, 0);
  });
  return null;
}

export default function AuthScene({ mode }: { mode: "login" | "signup" }) {
  const reduced = useReducedMotion();

  return (
    <Canvas
      dpr={[1, 1.5]}
      camera={{ position: [0, 0, 6], fov: 42 }}
      gl={{ antialias: true, alpha: true }}
      style={{ position: "absolute", inset: 0 }}
    >
      <ambientLight intensity={0.4} />
      <pointLight position={[4, 3, 5]} intensity={1.2} color="#818cf8" />
      <pointLight position={[-4, -2, -3]} intensity={0.5} color="#4f46e5" />
      <Core mode={mode} reduced={reduced} />
      <Particles reduced={reduced} />
      <CameraRig reduced={reduced} />
    </Canvas>
  );
}