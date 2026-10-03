import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { profile } from '../content'

export default function Hero({ ready }) {
  const root = useRef(null)

  useEffect(() => {
    if (!ready) return
    const ctx = gsap.context(() => {
      gsap.set('.hero__title .char', { y: 0 })
      gsap.set('.hero__tagline > span', { y: 0 })
      gsap.set('.hero__outline-shine', { '--shine': '85%' })

      const timeline = gsap.timeline({ defaults: { ease: 'expo.out' }, delay: 0.1 })

      timeline.fromTo(
        '.hero__outline',
        { yPercent: 22, opacity: 0, scale: 1.05, rotate: 1.2, filter: 'blur(14px)' },
        {
          yPercent: 0,
          opacity: 1,
          scale: 1,
          rotate: 0,
          filter: 'blur(0px)',
          duration: 1,
          ease: 'power3.out',
        },
        0
      )
      timeline.fromTo(
        '.hero__glow',
        { scale: 0.85, opacity: 0 },
        { scale: 1.1, opacity: 1, duration: 1.3, ease: 'sine.inOut' },
        0.35
      )
      timeline.to(
        '.hero__outline-shine',
        {
          keyframes: [
            { '--shine': '78%', duration: 0.55, ease: 'sine.in' },
            { '--shine': '52%', duration: 0.5, ease: 'power1.in' },
            { '--shine': '29%', duration: 0.6, ease: 'power2.out' },
            { '--shine': '14%', duration: 0.45, ease: 'sine.out' },
          ],
        },
        0.45
      )
      timeline.to('.hero__glow', { scale: 1, opacity: 0.8, duration: 1.2, ease: 'sine.inOut' }, 1.7)
      timeline.fromTo(
        '.hero__title .char',
        { yPercent: 118, rotate: 7, filter: 'blur(9px)' },
        { yPercent: 0, rotate: 0, filter: 'blur(0px)', duration: 1.15, stagger: { each: 0.06, ease: 'power1.in' } },
        1.05
      )
      timeline.fromTo('.hero__tagline > span', { yPercent: 125 }, { yPercent: 0, duration: 0.9 }, 1.55)
      timeline.fromTo(
        '.hero__meta',
        { y: 26, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.7, ease: 'power3.out' },
        1.85
      )
      timeline.fromTo('.hero__scroll', { opacity: 0 }, { opacity: 1, duration: 0.6, ease: 'sine.out' }, 2.1)

      gsap.to('.hero__parallax', {
        yPercent: -16,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
      gsap.to('.hero__title', {
        scale: 0.94,
        opacity: 0.25,
        ease: 'none',
        scrollTrigger: { trigger: root.current, start: 'top top', end: 'bottom top', scrub: true },
      })
    }, root)

    return () => ctx.revert()
  }, [ready])

  return (
    <section className="hero" id="top" ref={root}>
      <div className="hero__glow" aria-hidden="true" />
      <div className="hero__inner">
        <div className="hero__parallax">
          <div className="hero__outline" aria-hidden="true">
            <span className="hero__outline-text">COMPILING</span>
            <span className="hero__outline-shine">COMPILING</span>
          </div>
          <h1 className="hero__title">
            {profile.name.split('').map((char, index) => (
              <span className="char-mask" key={index}>
                <span className="char">{char}</span>
              </span>
            ))}
          </h1>
          <p className="hero__tagline">
            <span>{profile.tagline}</span>
          </p>
        </div>
        <div className="hero__meta">
          <span>{profile.location}</span>
          <span className="hero__meta-divider" />
          <span>SCROLL TO EXPLORE</span>
        </div>
      </div>
      <div className="hero__scroll" aria-hidden="true">
        <span />
      </div>
    </section>
  )
}
