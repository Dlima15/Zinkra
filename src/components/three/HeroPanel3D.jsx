import React, { Suspense, lazy, useEffect, useRef, useState } from 'react'

const HeroPanel3DCanvas = lazy(() => import('./HeroPanel3DCanvas'))

// Defer the WebGL canvas until the browser is idle, so the ~800KB three.js
// chunk doesn't compete with the user's very first scroll gesture for
// main-thread time right after the page loads — that contention was making
// the first attempt to scroll past the hero on phones get dropped, only
// working after some other interaction gave the thread a chance to catch up.
// requestIdleCallback isn't in Safari, hence the setTimeout fallback.
function useIdle(delay = 300) {
  const [idle, setIdle] = useState(false)
  useEffect(() => {
    if (typeof window === 'undefined') return
    if ('requestIdleCallback' in window) {
      const id = window.requestIdleCallback(() => setIdle(true), { timeout: delay * 2 })
      return () => window.cancelIdleCallback(id)
    }
    const id = setTimeout(() => setIdle(true), delay)
    return () => clearTimeout(id)
  }, [delay])
  return idle
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
  const idle = useIdle()

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
      {idle && (
        <Suspense fallback={null}>
          <div style={{ opacity: ready ? 1 : 0, transition: 'opacity 0.5s ease', position: 'absolute', inset: 0 }}>
            <HeroPanel3DCanvas src={src} pointer={pointer} onReady={() => setReady(true)} />
          </div>
        </Suspense>
      )}
    </div>
  )
}
