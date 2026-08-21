import React, { Suspense, useRef } from 'react'
import { Canvas, useFrame, useLoader, useThree } from '@react-three/fiber'
import * as THREE from 'three'

function reducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function MockupPlane({ url, pointer, onReady }) {
  const meshRef = useRef(null)
  const texture = useLoader(THREE.TextureLoader, url)
  const still = reducedMotion()
  const readyFired = useRef(false)

  if (!readyFired.current) {
    readyFired.current = true
    onReady()
  }

  const { viewport } = useThree()
  const aspect = texture.image ? texture.image.width / texture.image.height : 0.62

  // Fit the whole image inside the visible frustum (like object-fit: contain)
  // instead of a fixed world-unit size — a fixed size clipped the mockup
  // whenever it was taller/wider than what the camera actually sees.
  const margin = 0.92 // headroom so mouse-tilt rotation never clips an edge
  let height = viewport.height * margin
  let width = height * aspect
  if (width > viewport.width * margin) {
    width = viewport.width * margin
    height = width / aspect
  }

  useFrame((state) => {
    const m = meshRef.current
    if (!m) return
    const t = state.clock.elapsedTime
    const targetY = still ? 0 : pointer.current.x * 0.22
    const targetX = still ? 0 : -pointer.current.y * 0.12 + Math.sin(t * 0.6) * 0.015
    m.rotation.y = THREE.MathUtils.lerp(m.rotation.y, targetY, 0.06)
    m.rotation.x = THREE.MathUtils.lerp(m.rotation.x, targetX, 0.06)
    m.position.y = still ? 0 : Math.sin(t * 0.7) * 0.045
  })

  return (
    <mesh ref={meshRef}>
      <planeGeometry args={[width, height]} />
      {/* Unlit on purpose: a lit material shades the image's own flat white
          background unevenly under the directional lights, which is exactly
          what made the panel read as a visible rectangle against the page.
          meshBasicMaterial shows the texture as authored — same flat white,
          same as the page behind it. */}
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

/*
 * The actual WebGL scene, split out of HeroPanel3D.jsx so `three` and
 * `@react-three/fiber` (the single largest JS chunk in the build, ~800KB)
 * are only fetched/parsed/executed once HeroPanel3D decides it's safe to —
 * see the `requestIdleCallback` gate there. Importing them at the top of
 * HeroPanel3D.jsx like before pulled that whole chunk into the critical
 * path of every page load, competing with the user's first scroll gesture
 * for main-thread time on slower phones.
 */
export default function HeroPanel3DCanvas({ src, pointer, onReady }) {
  return (
    <Canvas
      className="!absolute inset-0"
      dpr={[1, 2]}
      camera={{ position: [0, 0, 4], fov: 32 }}
      gl={{ alpha: true, antialias: true }}
      style={{ touchAction: 'pan-y', pointerEvents: 'none' }}
    >
      <Suspense fallback={null}>
        <MockupPlane url={src} pointer={pointer} onReady={onReady} />
      </Suspense>
    </Canvas>
  )
}
