
import { Canvas, useFrame } from "@react-three/fiber";
import { Float, MeshTransmissionMaterial } from "@react-three/drei";
import { useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";

function MetallicSculpture() {
  const groupRef = useRef<Group>(null);
  const sculptureRef = useRef<Mesh>(null);

  useFrame((state, delta) => {
    if (!groupRef.current) return;

    const time = state.clock.elapsedTime;

    // Slow, cinematic rotation
    groupRef.current.rotation.y += delta * 0.08;
    groupRef.current.rotation.z = Math.sin(time * 0.25) * 0.08;

    // Subtle mouse-based perspective
    const targetX = state.pointer.y * 0.15;
    const targetY = state.pointer.x * 0.2;

    groupRef.current.rotation.x = THREE.MathUtils.lerp(
      groupRef.current.rotation.x,
      targetX,
      0.025
    );

    groupRef.current.position.x = THREE.MathUtils.lerp(
      groupRef.current.position.x,
      targetY,
      0.025
    );

    if (sculptureRef.current) {
      sculptureRef.current.rotation.x =
        Math.sin(time * 0.18) * 0.12;
    }
  });

  return (
    <group ref={groupRef}>
      <Float
        speed={1.1}
        rotationIntensity={0.18}
        floatIntensity={0.3}
      >
        <mesh ref={sculptureRef} rotation={[0.4, 0.2, -0.4]}>
          <torusKnotGeometry
            args={[1.35, 0.35, 240, 32, 2, 3]}
          />

          <meshPhysicalMaterial
            color="#d4e5ed"
            metalness={1}
            roughness={0.12}
            clearcoat={1}
            clearcoatRoughness={0.08}
          />
        </mesh>
      </Float>

      {/* Floating glass shell */}
      <mesh scale={2.1} rotation={[0.3, 0.2, 0]}>
        <icosahedronGeometry args={[1, 1]} />

        <MeshTransmissionMaterial
          backside
          samples={4}
          thickness={0.2}
          chromaticAberration={0.06}
          distortion={0.15}
          distortionScale={0.2}
          temporalDistortion={0.1}
          roughness={0.02}
          transmission={0.9}
          ior={1.35}
          color="#9edcff"
          transparent
          opacity={0.13}
        />
      </mesh>
    </group>
  );
}

function WorldLighting() {
  return (
    <>
      <ambientLight intensity={0.7} />

      <directionalLight
        position={[5, 7, 5]}
        intensity={4}
        color="#b8eaff"
      />

      <pointLight
        position={[-5, 2, 3]}
        intensity={60}
        distance={15}
        color="#70b9ff"
      />

      <pointLight
        position={[3, -3, -4]}
        intensity={45}
        distance={12}
        color="#ffffff"
      />
    </>
  );
}

export default function FormWorld({transparent=false}:{transparent?:boolean}) {
  return (
    <div className="form-world">
      <Canvas
        camera={{
          position: [0, 0, 7],
          fov: 42,
          near: 0.1,
          far: 100,
        }}
        dpr={[1, 1.5]}
        gl={{
          antialias: true,
          alpha: true,
          powerPreference: "high-performance",
        }}
      >
        {!transparent && <color attach="background" args={["#07121f"]} />}

        <fog attach="fog" args={["#07121f", 7, 18]} />

        <WorldLighting />
        <MetallicSculpture />
      </Canvas>
    </div>
  );
}
