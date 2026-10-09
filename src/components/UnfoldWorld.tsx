
import { Canvas, useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import type { Group, Mesh } from "three";

type UnfoldWorldProps = {
  progress: React.RefObject<number>;
};

type LayerConfig = {
  start: [number, number, number];
  end: [number, number, number];
  rotation: [number, number, number];
  size: [number, number];
  color: string;
};

const layers: LayerConfig[] = [
  {
    start: [-5.2, 2.5, -2],
    end: [-1.15, 0.5, 0],
    rotation: [0.4, -0.7, -0.35],
    size: [3.3, 1.65],
    color: "#2ACCF3",
  },
  {
    start: [5.2, 2.1, -3],
    end: [1.05, 0.5, -0.15],
    rotation: [-0.3, 0.6, 0.35],
    size: [3.3, 1.65],
    color: "#89E8FF",
  },
  {
    start: [-4.9, -2.8, -2],
    end: [-1.15, -0.8, 0.2],
    rotation: [0.3, 0.7, -0.3],
    size: [3.3, 1.15],
    color: "#17658F",
  },
  {
    start: [5, -2.5, -1.5],
    end: [1.05, -0.8, 0.1],
    rotation: [-0.45, -0.5, 0.3],
    size: [3.3, 1.15],
    color: "#5DB8E5",
  },
];

function GlassLayer({
  data,
  index,
  progress,
}: {
  data: LayerConfig;
  index: number;
  progress: React.RefObject<number>;
}) {
  const group = useRef<Group>(null);
  const glow = useRef<Mesh>(null);

  const material = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: data.color,
        metalness: 0.25,
        roughness: 0.12,
        transmission: 0.66,
        thickness: 0.75,
        ior: 1.32,
        transparent: true,
        opacity: 0.88,
        side: THREE.DoubleSide,
        depthWrite: false,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      }),
    [data.color]
  );

  useFrame((state, delta) => {
    if (!group.current) return;

    const p = THREE.MathUtils.smoothstep(
      progress.current ?? 0,
      0.08,
      0.68
    );

    const time = state.clock.elapsedTime;

    const float =
      Math.sin(time * 0.65 + index * 1.8) *
      0.09 *
      (1 - p);

    const destination = new THREE.Vector3(
      THREE.MathUtils.lerp(data.start[0], data.end[0], p),
      THREE.MathUtils.lerp(data.start[1], data.end[1], p) +
        float,
      THREE.MathUtils.lerp(data.start[2], data.end[2], p)
    );

    group.current.position.lerp(
      destination,
      Math.min(1, delta * 4)
    );

    group.current.rotation.x = THREE.MathUtils.damp(
      group.current.rotation.x,
      data.rotation[0] * (1 - p),
      4,
      delta
    );

    group.current.rotation.y = THREE.MathUtils.damp(
      group.current.rotation.y,
      data.rotation[1] * (1 - p),
      4,
      delta
    );

    group.current.rotation.z = THREE.MathUtils.damp(
      group.current.rotation.z,
      data.rotation[2] * (1 - p),
      4,
      delta
    );

    if (glow.current) {
      const glowMaterial =
        glow.current.material as THREE.MeshBasicMaterial;

      glowMaterial.opacity =
        0.2 + Math.sin(time * 0.7 + index) * 0.08;
    }
  });

  return (
    <group
      ref={group}
      position={data.start}
      rotation={data.rotation}
    >
      <mesh material={material}>
        <boxGeometry
          args={[data.size[0], data.size[1], 0.12]}
        />
      </mesh>

      <mesh position={[0, 0, 0.085]}>
        <planeGeometry
          args={[data.size[0] * 0.91, data.size[1] * 0.83]}
        />
        <meshBasicMaterial
          color="#061B30"
          transparent
          opacity={0.33}
          depthWrite={false}
        />
      </mesh>

      <mesh ref={glow} position={[0, 0, 0.105]}>
        <planeGeometry
          args={[data.size[0] * 0.72, 0.012]}
        />
        <meshBasicMaterial
          color="#A6F5FF"
          transparent
          opacity={0.28}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function DepthParticles() {
  const particles = useMemo(() => {
    const points: number[] = [];

    for (let i = 0; i < 180; i++) {
      // Deterministic distribution for a stable scene
      const angle = i * 2.39996;
      const radius = Math.sqrt((i + 0.5) / 180);

      points.push(
        Math.cos(angle) * radius * 11,
        Math.sin(angle) * radius * 6.5,
        -2 - ((i * 7) % 12)
      );
    }

    return new Float32Array(points);
  }, []);

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[particles, 3]}
        />
      </bufferGeometry>

      <pointsMaterial
        color="#8DEBFF"
        size={0.022}
        transparent
        opacity={0.55}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
}

function BahrCore({
  progress,
}: {
  progress: React.RefObject<number>;
}) {
  const ring = useRef<Mesh>(null);
  const innerRing = useRef<Mesh>(null);
  const group = useRef<Group>(null);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;

    if (ring.current) {
      ring.current.rotation.z += delta * 0.065;
    }

    if (innerRing.current) {
      innerRing.current.rotation.z -= delta * 0.045;
      innerRing.current.rotation.y =
        Math.sin(state.clock.elapsedTime * 0.3) * 0.15;
    }

    if (group.current) {
      group.current.scale.setScalar(
        THREE.MathUtils.damp(
          group.current.scale.x,
          THREE.MathUtils.lerp(
            1,
            1.25,
            THREE.MathUtils.smoothstep(p, 0.3, 0.9)
          ),
          3,
          delta
        )
      );
    }
  });

  return (
    <group ref={group} position={[0, 0, -3]}>
      <mesh ref={ring}>
        <torusGeometry args={[4.35, 0.009, 8, 160]} />
        <meshBasicMaterial
          color="#2395CF"
          transparent
          opacity={0.38}
        />
      </mesh>

      <mesh ref={innerRing} rotation={[0.4, 0, 0.2]}>
        <torusGeometry args={[3.6, 0.006, 8, 160]} />
        <meshBasicMaterial
          color="#8DEAFF"
          transparent
          opacity={0.2}
        />
      </mesh>
    </group>
  );
}

function Scene({
  progress,
}: {
  progress: React.RefObject<number>;
}) {
  const world = useRef<Group>(null);

  useFrame((state, delta) => {
    const p = progress.current ?? 0;
    const assembly = THREE.MathUtils.smoothstep(
      p,
      0.1,
      0.8
    );

    state.camera.position.z = THREE.MathUtils.damp(
      state.camera.position.z,
      THREE.MathUtils.lerp(11, 8.6, assembly),
      3,
      delta
    );

    state.camera.position.x = THREE.MathUtils.damp(
      state.camera.position.x,
      state.pointer.x * 0.16,
      3,
      delta
    );

    state.camera.position.y = THREE.MathUtils.damp(
      state.camera.position.y,
      state.pointer.y * 0.12,
      3,
      delta
    );

    state.camera.lookAt(0, 0, 0);

    if (world.current) {
      world.current.rotation.y = THREE.MathUtils.damp(
        world.current.rotation.y,
        state.pointer.x * 0.045,
        3,
        delta
      );
    }
  });

  return (
    <>
      <ambientLight intensity={1.4} />

      <directionalLight
        position={[5, 7, 6]}
        intensity={3.5}
        color="#C2F3FF"
      />

      <pointLight
        position={[-4, 2, 3]}
        intensity={40}
        distance={15}
        color="#1DA9FF"
      />

      <pointLight
        position={[4, -3, 2]}
        intensity={30}
        distance={14}
        color="#83E9FF"
      />

      <DepthParticles />

      <group ref={world}>
        <BahrCore progress={progress} />

        {layers.map((layer, index) => (
          <GlassLayer
            key={index}
            index={index}
            data={layer}
            progress={progress}
          />
        ))}
      </group>
    </>
  );
}

export default function UnfoldWorld({
  progress,
}: UnfoldWorldProps) {
  return (
    <div className="unfold-world" aria-hidden="true">
      <Canvas
        dpr={[1, 1.5]}
        camera={{
          position: [0, 0, 11],
          fov: 48,
          near: 0.1,
          far: 70,
        }}
        gl={{
          antialias: true,
          alpha: false,
          powerPreference: "high-performance",
        }}
      >
        <color attach="background" args={["#041323"]} />
        <fog attach="fog" args={["#041323", 10, 26]} />

        <Scene progress={progress} />
      </Canvas>
    </div>
  );
}
