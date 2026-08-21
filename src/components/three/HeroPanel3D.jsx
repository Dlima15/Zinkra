import React, { Suspense, useRef, useState } from 'react'
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
 * Real 3D depth for the hero mockup, not a flat <img> with fake CSS shadow:
 * the screenshot is a textured plane in a WebGL scene that tilts with the
 * mouse and idles with a slow float — tied to the real client work shown,
 * not a decorative particle field. Falls back silently to the flat <img>
 * (kept underneath) until the texture is ready or if WebGL is unavailable.
 */
export default function HeroPanel3D({ src, alt, className, style }) {
  const pointer = useRef({ x: 0, y: 0 })
  const [ready, setReady] = useState(false)

  // Touch drag fires pointermove too (pointerType 'touch'), which was being read
  // as mouse-tilt input — updating this on every scroll-drag frame is what made
  // scrolling past the hero image feel stuck. Only real mouse hover drives the tilt.
  const handlePointerMove = (e) => {
    if (e.pointerType === 'touch') return
    const rect = e.currentTarget.getBoundingClientRect()
    pointer.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1
    pointer.current.y = ((e.clientY - rect.top) / rect.height) * 2 - 1
  }
  const handlePointerLeave = () => { pointer.current.x = 0; pointer.current.y = 0 }

  return (
    <div
      className={className}
      style={{ ...style, position: 'relative' }}
      onPointerMove={handlePointerMove}
      onPointerLeave={handlePointerLeave}
    >
      <img
        src={src}
        alt={alt}
        draggable={false}
        className="h-full w-auto relative select-none"
        style={{
          filter: 'drop-shadow(0 24px 48px rgba(10,12,11,0.22))',
          opacity: ready ? 0 : 1,
          transition: 'opacity 0.5s ease',
          WebkitUserDrag: 'none',
          WebkitTouchCallout: 'none',
          touchAction: 'pan-y',
          pointerEvents: 'none',
        }}
        fetchpriority="high"
      />
      <Canvas
        className="!absolute inset-0"
        dpr={[1, 2]}
        camera={{ position: [0, 0, 4], fov: 32 }}
        gl={{ alpha: true, antialias: true }}
        style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease', touchAction: 'pan-y', pointerEvents: 'none' }}
      >
        <Suspense fallback={null}>
          <MockupPlane url={src} pointer={pointer} onReady={() => setReady(true)} />
        </Suspense>
      </Canvas>
    </div>
  )
}
