import { useCallback, useEffect, useRef, useState } from 'react'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import Lenis from 'lenis'
import { setLenis, getLenis } from './lib/lenis'
import Scene from './components/Scene'
import Preloader from './components/Preloader'
import Letterbox from './components/Letterbox'
import Cursor from './components/Cursor'
import Nav from './components/Nav'
import Hero from './components/Hero'
import About from './components/About'
import Works from './components/Works'
import Playground from './components/Playground'
import Contact from './components/Contact'
import Palette from './components/Palette'

gsap.registerPlugin(ScrollTrigger)

const VISITED_KEY = 'stardust:visited'

function hasVisited() {
  try {
    return window.sessionStorage.getItem(VISITED_KEY) === '1'
  } catch {
    return false
  }
}

export default function App() {
  const [ready, setReady] = useState(hasVisited)
  const [preloaderDone, setPreloaderDone] = useState(hasVisited)
  const [cmdOpen, setCmdOpen] = useState(false)
  const readyRef = useRef(ready)
  const firstVisit = useRef(!hasVisited())

  useEffect(() => {
    window.scrollTo(0, 0)

    const lenis = new Lenis({ duration: 1.15, smoothWheel: true, touchMultiplier: 1.5 })
    setLenis(lenis)
    if (!readyRef.current) lenis.stop()
    lenis.on('scroll', ScrollTrigger.update)

    const raf = (time) => lenis.raf(time * 1000)
    gsap.ticker.add(raf)
    gsap.ticker.lagSmoothing(0)

    const refresh = () => ScrollTrigger.refresh()
    window.addEventListener('load', refresh)
    document.fonts?.ready.then(refresh)

    return () => {
      window.removeEventListener('load', refresh)
      gsap.ticker.remove(raf)
      lenis.destroy()
      setLenis(null)
    }
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmdOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    if (cmdOpen) window.dispatchEvent(new Event('stardust:palette-open'))
  }, [cmdOpen])

  const handleReveal = useCallback(() => {
    try {
      window.sessionStorage.setItem(VISITED_KEY, '1')
    } catch {
      /* 隐私模式下忽略 */
    }
    window.scrollTo(0, 0)
    getLenis()?.start()
    setReady(true)
    ScrollTrigger.refresh()
    window.dispatchEvent(new Event('stardust:reveal'))
  }, [])

  const handlePreloaderDone = useCallback(() => setPreloaderDone(true), [])

  return (
    <>
      <Scene ready={ready} />
      <Cursor />
      {!preloaderDone && <Preloader onReveal={handleReveal} onDone={handlePreloaderDone} />}
      {firstVisit.current && <Letterbox />}
      <Nav ready={ready} onOpenCmd={() => setCmdOpen(true)} />
      <main>
        <Hero ready={ready} />
        <About />
        <Works />
        <Playground />
        <Contact />
      </main>
      <Palette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <div className="grain" aria-hidden="true" />
      <div className="vignette" aria-hidden="true" />
    </>
  )
}
