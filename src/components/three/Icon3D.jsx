import React, { useRef, useState, useEffect } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'

/* Purposeful low-poly geometry per service — not decorative filler.
   Each shape echoes the section's existing 2D icon so the 3D upgrade
   reads as "the same idea, more depth", not a random ornament. */
const GEOMETRY = {
  sites:    { args: [0.85, 1] },              // icosahedron — globe/network, matches GlobeIcon
  sistemas: { args: [0.95] },                 // octahedron — branch/flow, matches the </> polylines
  social:   { args: [0.62, 0.24, 12, 40] },   // torus — feed loop, matches HashIcon grid rhythm
  ia:       { args: [0.85, 0] },              // dodecahedron — complexity/intelligence
}

function reducedMotion() {
  return typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function Shape({ variant, color, hovered }) {
  const meshRef = useRef(null)
  const spin = useRef(0.35 + Math.random() * 0.15)
  const still = reducedMotion()

  useFrame((state, delta) => {
    const m = meshRef.current
    if (!m || still) return
    const boost = hovered ? 2.2 : 1
    m.rotation.x += delta * spin.current * 0.55 * boost
    m.rotation.y += delta * spin.current * boost
    m.position.y = Math.sin(state.clock.elapsedTime * 0.9) * 0.07
  })

  const geo = GEOMETRY[variant] || GEOMETRY.sites

  return (
    <mesh ref={meshRef} rotation={[0.4, 0.6, 0]}>
      {variant === 'social'
        ? <torusGeometry args={geo.args} />
        : variant === 'sistemas'
          ? <octahedronGeometry args={geo.args} />
          : variant === 'ia'
            ? <dodecahedronGeometry args={geo.args} />
            : <icosahedronGeometry args={geo.args} />}
      <meshStandardMaterial color={color} roughness={0.32} metalness={0.2} />
    </mesh>
  )
}

/* Mounts the WebGL canvas only once the icon is actually on screen, and
   keeps it mounted (looping) for the rest of the session once seen — this
   is what gives the "always alive" feel without paying the render cost for
   icons the visitor never scrolls to. */
export default function Icon3D({ variant = 'sites', color = '#15C45A', size = 64, className = '' }) {
  const wrapRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const [hovered, setHovered] = useState(false)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); io.disconnect() } },
      { rootMargin: '80px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={wrapRef}
      className={className}
      style={{ width: size, height: size }}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
    >
      {visible && (
        <Canvas
          dpr={[1, 1.75]}
          camera={{ position: [0, 0, 2.6], fov: 40 }}
          gl={{ alpha: true, antialias: true }}
        >
          <ambientLight intensity={0.75} />
          <directionalLight position={[2, 2, 3]} intensity={1.1} />
          <directionalLight position={[-2, -1, -2]} intensity={0.25} color="#15C45A" />
          <Shape variant={variant} color={color} hovered={hovered} />
        </Canvas>
      )}
    </div>
  )
}
