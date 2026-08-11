import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

/**
 * Scroll-triggered entrance with real perspective/rotate, replacing the
 * repeated flat `fromTo({opacity:0,y:40},{opacity:1,y:0})` used across the
 * site. `direction` and `rotate` are meant to vary per section so entrances
 * don't all read as the same copy-pasted effect.
 *
 * direction: 'up' | 'down' | 'left' | 'right'
 */
export function reveal3D(target, opts = {}) {
  const {
    trigger = target,
    start = 'top 82%',
    direction = 'up',
    distance = 44,
    rotate = 10,
    duration = 0.9,
    ease = 'power4.out',
    delay = 0,
    stagger = 0,
    once = true,
  } = opts

  const from = { opacity: 0, transformPerspective: 800, transformOrigin: 'center center' }
  const to   = { opacity: 1, duration, ease, delay, stagger, scrollTrigger: { trigger, start, once } }

  switch (direction) {
    case 'down':
      Object.assign(from, { y: -distance, rotateX: -rotate })
      Object.assign(to,   { y: 0, rotateX: 0 })
      break
    case 'left':
      Object.assign(from, { x: distance, rotateY: -rotate })
      Object.assign(to,   { x: 0, rotateY: 0 })
      break
    case 'right':
      Object.assign(from, { x: -distance, rotateY: rotate })
      Object.assign(to,   { x: 0, rotateY: 0 })
      break
    case 'up':
    default:
      Object.assign(from, { y: distance, rotateX: rotate })
      Object.assign(to,   { y: 0, rotateX: 0 })
  }

  return gsap.fromTo(target, from, to)
}

export default reveal3D
