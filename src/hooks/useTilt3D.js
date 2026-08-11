import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'

/**
 * Real-time 3D tilt for card-like elements: rotateX/rotateY follow the
 * pointer within the card, giving genuine depth on the content itself
 * (price, testimonial, project) instead of a flat hover shadow.
 * No-ops under prefers-reduced-motion.
 */
export default function useTilt3D({ max = 10, scale = 1.015, disabled = false } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el || disabled || max === 0) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    el.style.transformStyle = 'preserve-3d'
    el.style.transformPerspective = '900px'

    const rotateX = gsap.quickTo(el, 'rotateX', { duration: 0.5, ease: 'power3.out' })
    const rotateY = gsap.quickTo(el, 'rotateY', { duration: 0.5, ease: 'power3.out' })
    const scaleTo = gsap.quickTo(el, 'scale', { duration: 0.4, ease: 'power3.out' })

    const onMove = (e) => {
      const rect = el.getBoundingClientRect()
      const px = (e.clientX - rect.left) / rect.width - 0.5
      const py = (e.clientY - rect.top) / rect.height - 0.5
      rotateX(-py * max)
      rotateY(px * max)
      scaleTo(scale)
    }
    const onLeave = () => {
      rotateX(0)
      rotateY(0)
      scaleTo(1)
    }

    el.addEventListener('pointermove', onMove)
    el.addEventListener('pointerleave', onLeave)
    return () => {
      el.removeEventListener('pointermove', onMove)
      el.removeEventListener('pointerleave', onLeave)
    }
  }, [max, scale])

  return ref
}
