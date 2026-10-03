import { useEffect, useRef } from 'react'
import gsap from 'gsap'

const DEFAULTS = {
  max: 8,
  scale: 1.035,
  inner: null,
  innerScale: 1.07,
  innerShift: 7,
  glare: true,
}

function enabled() {
  return window.matchMedia('(pointer: fine)').matches && !window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function attachTilt(el, options) {
  const { max, scale, inner, innerScale, innerShift, glare } = { ...DEFAULTS, ...options }

  gsap.set(el, { transformPerspective: 900, transformOrigin: 'center center' })
  const rotX = gsap.quickTo(el, 'rotationX', { duration: 0.55, ease: 'power3.out' })
  const rotY = gsap.quickTo(el, 'rotationY', { duration: 0.55, ease: 'power3.out' })
  const sclX = gsap.quickTo(el, 'scaleX', { duration: 0.55, ease: 'power3.out' })
  const sclY = gsap.quickTo(el, 'scaleY', { duration: 0.55, ease: 'power3.out' })

  const innerEl = typeof inner === 'string' ? el.querySelector(inner) : inner
  let shiftX = null
  let shiftY = null
  let innerSclX = null
  let innerSclY = null
  if (innerEl) {
    gsap.set(innerEl, { transformOrigin: 'center center' })
    shiftX = gsap.quickTo(innerEl, 'x', { duration: 0.55, ease: 'power3.out' })
    shiftY = gsap.quickTo(innerEl, 'y', { duration: 0.55, ease: 'power3.out' })
    innerSclX = gsap.quickTo(innerEl, 'scaleX', { duration: 0.55, ease: 'power3.out' })
    innerSclY = gsap.quickTo(innerEl, 'scaleY', { duration: 0.55, ease: 'power3.out' })
  }

  let glareEl = null
  if (glare) {
    glareEl = document.createElement('span')
    glareEl.className = 'tilt-glare'
    glareEl.setAttribute('aria-hidden', 'true')
    el.appendChild(glareEl)
  }

  const move = (e) => {
    const rect = el.getBoundingClientRect()
    const px = (e.clientX - rect.left) / rect.width - 0.5
    const py = (e.clientY - rect.top) / rect.height - 0.5
    rotX(-py * max)
    rotY(px * max)
    sclX(scale)
    sclY(scale)
    if (glareEl) {
      glareEl.style.setProperty('--gx', `${(px + 0.5) * 100}%`)
      glareEl.style.setProperty('--gy', `${(py + 0.5) * 100}%`)
      glareEl.style.opacity = '1'
    }
    if (innerEl) {
      shiftX(-px * innerShift)
      shiftY(-py * innerShift)
      innerSclX(innerScale)
      innerSclY(innerScale)
    }
  }

  const leave = () => {
    rotX(0)
    rotY(0)
    sclX(1)
    sclY(1)
    if (glareEl) glareEl.style.opacity = '0'
    if (innerEl) {
      shiftX(0)
      shiftY(0)
      innerSclX(1)
      innerSclY(1)
    }
  }

  el.addEventListener('mousemove', move)
  el.addEventListener('mouseleave', leave)

  return () => {
    el.removeEventListener('mousemove', move)
    el.removeEventListener('mouseleave', leave)
    glareEl?.remove()
    gsap.killTweensOf([el, innerEl].filter(Boolean))
  }
}

export default function useTilt(options = {}) {
  const ref = useRef(null)
  const optionsKey = JSON.stringify(options)

  useEffect(() => {
    const el = ref.current
    if (!el || !enabled()) return
    return attachTilt(el, options)
  }, [optionsKey])

  return ref
}

export function useTiltGroup(rootRef, selector, options = {}) {
  const optionsKey = JSON.stringify(options)

  useEffect(() => {
    const root = rootRef.current
    if (!root || !enabled()) return
    const cleanups = Array.from(root.querySelectorAll(selector)).map((el) => attachTilt(el, options))
    return () => cleanups.forEach((cleanup) => cleanup())
  }, [rootRef, selector, optionsKey])
}
