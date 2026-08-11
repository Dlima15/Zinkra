import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Magnetic pull for primary CTAs: the button leans toward the cursor within
 * a small radius and springs back on leave. Applied only to the handful of
 * real conversion actions (WhatsApp CTAs) — not every clickable element.
 */
export default function useMagnetic({ strength = 0.35 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const moveTo = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3.out' })
    const moveToY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3.out' })

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const px = e.clientX - (rect.left + rect.width / 2)
      const py = e.clientY - (rect.top + rect.height / 2)
      moveTo(px * strength)
      moveToY(py * strength)
    }
    const onLeave = () => { moveTo(0); moveToY(0) }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [strength])

  return ref
}
