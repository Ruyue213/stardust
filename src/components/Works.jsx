import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { works } from '../content'
import useTilt from '../hooks/useTilt'
import WorkCover from './WorkCover'
import EditorBackdrop from './EditorBackdrop'

function WorkCard({ work, index }) {
  const tiltRef = useTilt({ max: 8, scale: 1.03, inner: '.work__media', innerScale: 1.07, innerShift: 6 })

  return (
    <article className="work" ref={tiltRef} data-cursor>
      <div className="work__media">
        <WorkCover sketch={work.sketch} />
        <span className="work__index">
          {String(index + 1).padStart(2, '0')} / {work.en}
        </span>
        <span className="work__live">
          <i />
          LIVE
        </span>
      </div>
      <div className="work__body">
        <div className="work__row">
          <h3 className="work__title">{work.title}</h3>
          <span className="work__year">{work.year}</span>
        </div>
        <p className="work__desc">{work.desc}</p>
        <div className="work__tags">
          {work.tags.map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      </div>
    </article>
  )
}

export default function Works() {
  const root = useRef(null)
  const track = useRef(null)

  useEffect(() => {
    const rootEl = root.current
    const trackEl = track.current
    if (!rootEl || !trackEl) return

    const mm = gsap.matchMedia()

    mm.add('(min-width: 960px)', () => {
      const distance = () => Math.max(0, trackEl.scrollWidth - window.innerWidth)
      const tween = gsap.to(trackEl, {
        x: () => -distance(),
        ease: 'none',
        scrollTrigger: {
          trigger: rootEl,
          start: 'top top',
          end: () => `+=${distance() + window.innerHeight * 0.5}`,
          pin: true,
          scrub: 1,
          anticipatePin: 1,
          invalidateOnRefresh: true,
        },
      })
      return () => tween.scrollTrigger?.kill()
    })

    const cards = rootEl.querySelectorAll('.work')
    const reveal = gsap.from(cards, {
      y: 70,
      opacity: 0,
      duration: 1.1,
      ease: 'expo.out',
      stagger: 0.08,
      scrollTrigger: { trigger: rootEl, start: 'top 75%', once: true },
    })

    return () => {
      mm.revert()
      reveal.scrollTrigger?.kill()
      reveal.kill()
    }
  }, [])

  return (
    <section className="works" id="works" ref={root}>
      <EditorBackdrop />
      <div className="works__inner">
        <div className="container">
          <div className="section__head">
            <span className="section__label">02 / WORKS</span>
            <span className="section__line" />
          </div>
          <h2 className="section__title">跑起来的想法</h2>
        </div>
        <div className="works__viewport">
          <div className="works__track" ref={track}>
            {works.map((work, index) => (
              <WorkCard work={work} index={index} key={work.en} />
            ))}
            <div className="works__end">
              IDEAS
              <br />
              KEEP
              <br />
              COMPILING
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
