"use client";

/**
 * FAISTOF ONE — procedural 3D hero scene.
 * No external GLTF: the device is built from primitives with generated textures,
 * so it renders identically offline and in the sandboxed preview.
 * Scroll progress is read from a mutable ref every frame — zero React re-renders.
 */
import { useMemo, useRef, useState, type MutableRefObject } from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { RoundedBox, Environment, Lightformer, Sparkles } from "@react-three/drei";
import * as THREE from "three";

export type HeroState = {
  p: number;            // 0..1 scroll progress of the pinned sequence
  tiltX: number;        // pointer tilt
  tiltY: number;
  color: string;        // body tint (selected finish)
};

const damp = THREE.MathUtils.damp;

function useScreenTexture() {
  return useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 1024;
    const g = c.getContext("2d")!;
    g.fillStyle = "#050506";
    g.fillRect(0, 0, 512, 1024);
    // crimson ribbon
    const grad = g.createLinearGradient(0, 300, 512, 700);
    grad.addColorStop(0, "rgba(215,25,32,0)");
    grad.addColorStop(0.35, "rgba(215,25,32,0.9)");
    grad.addColorStop(0.6, "rgba(255,49,56,0.8)");
    grad.addColorStop(1, "rgba(120,6,10,0)");
    g.strokeStyle = grad;
    g.lineWidth = 90;
    g.lineCap = "round";
    g.beginPath();
    g.moveTo(-60, 760);
    g.bezierCurveTo(180, 520, 330, 620, 580, 330);
    g.stroke();
    g.lineWidth = 26;
    g.strokeStyle = "rgba(255,120,120,0.5)";
    g.beginPath();
    g.moveTo(-40, 700);
    g.bezierCurveTo(190, 480, 320, 580, 560, 300);
    g.stroke();
    // faint particle field
    g.fillStyle = "rgba(255,255,255,0.35)";
    for (let i = 0; i < 90; i++) {
      const x = Math.random() * 512, y = Math.random() * 1024, r = Math.random() * 1.3;
      g.globalAlpha = Math.random() * 0.5;
      g.beginPath(); g.arc(x, y, r, 0, 7); g.fill();
    }
    g.globalAlpha = 1;
    // wordmark
    g.font = "600 30px sans-serif";
    g.fillStyle = "rgba(255,255,255,0.85)";
    try { (g as CanvasRenderingContext2D & { letterSpacing: string }).letterSpacing = "12px"; } catch { /* older canvas */ }
    g.fillText("FAISTOF", 120, 120);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 4;
    return tex;
  }, []);
}

function Phone({ state, color }: { state: MutableRefObject<HeroState>; color: string }) {
  const group = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.MeshStandardMaterial>(null);
  const sweep = useRef<THREE.PointLight>(null);
  const screen = useScreenTexture();
  const { camera } = useThree();

  const frame = useRef({
    rotY: -0.6, rotX: 0.12, scale: 1, x: 0, y: 0, camZ: 6.1, ringGlow: 0.25, camY: 0,
  });

  useFrame((_, dt) => {
    const { p, tiltX, tiltY } = state.current;
    const f = frame.current;

    // ── keyframed cinematic choreography, aligned to the DOM beat windows ──
    let tgtRotY = 0, tgtX = 0, tgtScale = 1, tgtCamZ = 6.1, tgtY = 0, tgtRing = 0.2, tgtCamY = 0, tgtRotX = 0.06;

    if (p < 0.12) {
      // beat 0 · centered hero, slow ambient turn
      tgtRotY = -0.5 + p * 3.2;
      tgtScale = 1;
    } else if (p < 0.26) {
      // beat 1 · ~20° rotation + red light sweep
      const q = (p - 0.12) / 0.14;
      tgtRotY = -0.11 + q * 0.46;
      tgtScale = 0.98;
      tgtRing = 0.35;
    } else if (p < 0.42) {
      // beat 2 · slides left while the specs panel occupies the right
      const q = (p - 0.26) / 0.16;
      tgtX = -q * 1.15;
      tgtRotY = 0.35 + q * 0.37;
      tgtScale = 1.02;
    } else if (p < 0.58) {
      // beat 3 · rotate to reveal the rear camera
      const q = (p - 0.42) / 0.16;
      tgtX = -1.15 + q * 0.55;
      tgtRotY = 0.72 + q * 1.9;
      tgtScale = 1.02 + q * 0.16;
      tgtCamZ = 6.1 - q * 0.7;
      tgtRing = 0.45;
    } else if (p < 0.72) {
      // beat 4 · lens macro — push toward the island
      const q = (p - 0.58) / 0.14;
      tgtX = -0.6 + q * 0.1;
      tgtRotY = 2.62 + q * 0.22;
      tgtRotX = 0.06 + q * 0.12;
      tgtScale = 1.18 + q * 0.5;
      tgtCamZ = 5.4 - q * 1.1;
      tgtCamY = q * 0.5;
      tgtRing = 0.55 + Math.sin(q * Math.PI) * 0.6;
    } else if (p < 0.86) {
      // beat 5 · rotate back to front — display focus
      const q = (p - 0.72) / 0.14;
      tgtRotY = 2.84 + q * 3.44;
      tgtX = -0.5 + q * 0.5;
      tgtScale = 1.68 - q * 0.55;
      tgtCamZ = 4.3 - q * 0.3;
      tgtCamY = 0.5 - q * 0.5;
      tgtRing = 0.3;
    } else {
      // beat 6 · performance, then drop into commerce
      const q = (p - 0.86) / 0.14;
      tgtRotY = 6.28 + q * 0.45;
      tgtScale = 1.13 + (q < 0.45 ? q * 0.4 : (1 - q) * 0.9);
      tgtY = -Math.pow(q, 1.6) * 2.6;
      tgtCamZ = 4.0 + q * 1.1;
    }

    f.rotY = damp(f.rotY, tgtRotY + tiltY * 0.35, 3.4, dt);
    f.rotX = damp(f.rotX, tgtRotX + tiltX * 0.3, 3.4, dt);
    f.scale = damp(f.scale, tgtScale, 3.2, dt);
    f.x = damp(f.x, tgtX, 3.2, dt);
    f.y = damp(f.y, tgtY, 3.2, dt);
    f.camZ = damp(f.camZ, tgtCamZ, 3.2, dt);
    f.camY = damp(f.camY, tgtCamY, 3.2, dt);
    f.ringGlow = damp(f.ringGlow, tgtRing, 4, dt);

    if (group.current) {
      group.current.rotation.set(f.rotX, f.rotY, 0);
      group.current.position.set(f.x, f.y, 0);
      group.current.scale.setScalar(f.scale);
    }
    camera.position.set(0, f.camY, f.camZ);
    camera.lookAt(f.x * 0.65, f.camY * 0.55 - f.y * 0.4, 0);
    if (ringRef.current) ringRef.current.emissiveIntensity = f.ringGlow * 2.4;
    if (sweep.current) {
      const a = p * Math.PI * 4 + performance.now() / 2600;
      sweep.current.position.set(Math.sin(a) * 4, Math.cos(a * 0.6) * 1.6, 2.6 + Math.cos(a) * 1.6);
      sweep.current.intensity = 6 + Math.max(0, Math.sin((p - 0.16) * Math.PI * 2.4)) * 26;
    }
  });

  const bodyColor = new THREE.Color(color ?? "#0b0b0d");
  const frameColor = bodyColor.clone().multiplyScalar(1.9).add(new THREE.Color("#26262b"));

  return (
    <>
      <group ref={group}>
        {/* chassis */}
        <RoundedBox args={[1.16, 2.44, 0.14]} radius={0.085} smoothness={5}>
          <meshStandardMaterial color={frameColor} metalness={0.96} roughness={0.3} envMapIntensity={1.15} />
        </RoundedBox>

        {/* back glass */}
        <RoundedBox args={[1.08, 2.35, 0.02]} radius={0.06} smoothness={4} position={[0, 0, -0.068]}>
          <meshPhysicalMaterial
            color={bodyColor} metalness={0.7} roughness={0.16}
            clearcoat={1} clearcoatRoughness={0.18} envMapIntensity={1.3}
          />
        </RoundedBox>

        {/* front glass + screen */}
        <mesh position={[0, 0, 0.071]}>
          <planeGeometry args={[1.06, 2.33]} />
          <meshBasicMaterial map={screen} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, 0.0722]}>
          <planeGeometry args={[1.075, 2.345]} />
          <meshPhysicalMaterial transparent opacity={0.16} roughness={0.06} metalness={0.1} color="#ffffff" envMapIntensity={2.4} />
        </mesh>
        {/* punch-hole camera */}
        <mesh position={[0, 1.08, 0.0735]}>
          <circleGeometry args={[0.032, 24]} />
          <meshBasicMaterial color="#000000" />
        </mesh>

        {/* camera island */}
        <group position={[-0.24, 0.82, -0.082]}>
          <RoundedBox args={[0.62, 0.62, 0.055]} radius={0.05} smoothness={4}>
            <meshStandardMaterial color={frameColor} metalness={0.94} roughness={0.34} />
          </RoundedBox>
          {[[-0.145, 0.145], [0.145, 0.145], [-0.145, -0.145]].map(([lx, ly], i) => (
            <group key={i} position={[lx, ly, -0.032]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.088, 0.088, 0.03, 28]} />
                <meshStandardMaterial color="#0a0a0c" metalness={0.9} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0, -0.012]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.058, 0.058, 0.012, 24]} />
                <meshPhysicalMaterial color="#05060e" metalness={0.2} roughness={0.05} clearcoat={1} iridescence={0.7} envMapIntensity={2} />
              </mesh>
              {i === 0 && (
                <mesh position={[0, 0, -0.02]} rotation={[Math.PI / 2, 0, 0]}>
                  <torusGeometry args={[0.093, 0.0055, 10, 48]} />
                  <meshStandardMaterial ref={ringRef} color="#D71920" emissive="#ff2027" emissiveIntensity={0.6} metalness={0.8} roughness={0.3} />
                </mesh>
              )}
            </group>
          ))}
          <mesh position={[0.145, -0.145, -0.03]} rotation={[Math.PI / 2, 0, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.014, 16]} />
            <meshStandardMaterial color="#f5f0e6" emissive="#ffedc9" emissiveIntensity={0.35} roughness={0.4} />
          </mesh>
        </group>

        {/* side buttons */}
        <mesh position={[0.585, 0.32, 0]}>
          <boxGeometry args={[0.016, 0.22, 0.05]} />
          <meshStandardMaterial color={color === "#8e1418" ? "#D71920" : "#3a3a40"} metalness={0.9} roughness={0.3} />
        </mesh>
        <mesh position={[0.585, 0.08, 0]}>
          <boxGeometry args={[0.016, 0.12, 0.05]} />
          <meshStandardMaterial color="#3a3a40" metalness={0.9} roughness={0.3} />
        </mesh>
      </group>

      {/* atmospheric particles */}
      <Sparkles count={140} scale={[9, 5, 3]} size={1.6} speed={0.22} opacity={0.5} color="#ff4a4f" noise={0.35} />

      {/* lights */}
      <ambientLight intensity={0.22} />
      <directionalLight position={[4, 6, 4]} intensity={1.15} />
      <pointLight ref={sweep} color="#ff2229" intensity={8} distance={14} decay={2.1} />
      <pointLight position={[-4, -2, 3]} color="#5a63ff" intensity={2.2} distance={16} decay={2.4} />
      <pointLight position={[0, -3.2, 1.6]} color="#D71920" intensity={5} distance={9} decay={2} />

      <Environment resolution={64} frames={1}>
        <Lightformer form="rect" intensity={4} position={[0, 4, -5]} scale={[12, 1.6, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.6} position={[-5, 0, 2]} rotation-y={Math.PI / 2} scale={[8, 0.7, 1]} color="#ffffff" />
        <Lightformer form="rect" intensity={1.1} position={[5, -2, 2]} rotation-y={-Math.PI / 2} scale={[8, 0.5, 1]} color="#ff5a5f" />
        <Lightformer form="rect" intensity={2.4} position={[0, -6, 0]} rotation-x={-Math.PI / 2} scale={[10, 10, 1]} color="#141418" />
      </Environment>
    </>
  );
}

export default function HeroScene({ state }: { state: MutableRefObject<HeroState> }) {
  const [error, setError] = useState(false);
  if (error) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-void">
        <img src="/renders/hero-obsidian.jpg" alt="FAISTOF" className="h-full w-full object-contain opacity-60" onError={() => setError(true)} />
      </div>
    );
  }
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      camera={{ fov: 32, position: [0, 0, 6.1] }}
      onCreated={({ gl }) => { gl.toneMapping = THREE.ACESFilmicToneMapping; }}
      onError={() => setError(true)}
    >
      <Phone state={state} color={state.current.color} />
    </Canvas>
  );
}
