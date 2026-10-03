import { useEffect, useRef, useState } from 'react'
import gsap from 'gsap'

/**
 * 电影遮幅黑边（Letterbox）
 * 首次访问：全屏闭合 → 0.4s 后收缩到 13vh 揭幕引片
 * 揭示正片（stardust:reveal）后延迟 0.55s 拉开到 0，Hero 标题在画框内落定
 */
export default function Letterbox() {
  const root = useRef(null)
  const [gone, setGone] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  )

  useEffect(() => {
    if (gone) return undefined
    const bars = root.current?.querySelectorAll('.letterbox__bar')
    if (!bars || bars.length === 0) return undefined

    gsap.set(bars, { height: '100vh' })
    const open = gsap.to(bars, {
      height: () => `${Math.round(window.innerHeight * 0.13)}px`,
      duration: 0.95,
      ease: 'expo.inOut',
      delay: 0.4,
    })

    let retract = null
    const onReveal = () => {
      retract = gsap.to(bars, {
        height: 0,
        duration: 1.05,
        ease: 'expo.inOut',
        delay: 0.55,
        onComplete: () => setGone(true),
      })
    }
    window.addEventListener('stardust:reveal', onReveal)

    return () => {
      window.removeEventListener('stardust:reveal', onReveal)
      open.kill()
      retract?.kill()
    }
  }, [gone])

  if (gone) return null

  return (
    <div className="letterbox" ref={root} aria-hidden="true">
      <div className="letterbox__bar letterbox__bar--top" />
      <div className="letterbox__bar letterbox__bar--bottom" />
    </div>
  )
}
