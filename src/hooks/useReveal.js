import { useEffect, useRef } from 'react'
import gsap from 'gsap'

export default function useReveal({ selector, start = 'top 85%', y = 48, stagger = 0.08 } = {}) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const targets = selector ? el.querySelectorAll(selector) : el
    if (selector && targets.length === 0) return

    const tween = gsap.fromTo(
      targets,
      { y, opacity: 0 },
      {
        y: 0,
        opacity: 1,
        duration: 1.1,
        ease: 'expo.out',
        stagger,
        scrollTrigger: { trigger: el, start, once: true },
      }
    )

    return () => {
      tween.scrollTrigger?.kill()
      tween.kill()
    }
  }, [])

  return ref
}
