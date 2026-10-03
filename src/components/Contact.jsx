import { useRef, useState } from 'react'
import { contacts, profile, socials } from '../content'
import Magnetic from './Magnetic'
import useReveal from '../hooks/useReveal'
import { useTiltGroup } from '../hooks/useTilt'
import { copyText } from '../lib/clipboard'

export default function Contact() {
  const root = useReveal({ selector: '.reveal', start: 'top 88%' })
  useTiltGroup(root, '.contact__btn', { max: 10, scale: 1.04 })
  useTiltGroup(root, '.contact__row', { max: 6, scale: 1.015 })
  const [copied, setCopied] = useState(null)
  const timer = useRef(0)

  const handleCopy = async (item) => {
    const ok = await copyText(item.value)
    setCopied({ label: item.label, ok })
    window.clearTimeout(timer.current)
    timer.current = window.setTimeout(() => setCopied(null), 1800)
  }

  return (
    <footer className="section contact" id="contact" ref={root}>
      <div className="container">
        <div className="section__head reveal">
          <span className="section__label">04 / CONTACT</span>
          <span className="section__line" />
        </div>
        <h2 className="contact__title reveal">
          有个想法？
          <br />
          发个<em>信号</em>。
        </h2>
        <div className="reveal">
          <Magnetic strength={0.3}>
            <a className="contact__btn" href={`mailto:${profile.email}`} data-cursor>
              {profile.email}
            </a>
          </Magnetic>
        </div>
        <div className="contact__list reveal">
          {contacts.map((item) => (
            <button className="contact__row" key={item.label} onClick={() => handleCopy(item)} data-cursor>
              <span className="contact__row-label">{item.label}</span>
              <span className="contact__row-value">{item.value}</span>
              <span className="contact__row-action">
                {copied?.label === item.label ? (copied.ok ? '已复制 ✓' : '复制失败') : '点击复制'}
              </span>
            </button>
          ))}
        </div>
        {socials.length > 0 && (
          <div className="contact__socials reveal">
            {socials.map((item) => (
              <a key={item.label} href={item.href} target="_blank" rel="noreferrer" data-cursor>
                {item.label}
              </a>
            ))}
          </div>
        )}
        <div className="contact__footer">
          <span>© 2026 {profile.name}</span>
          <span>用 React、Three.js、GSAP 手工编译</span>
        </div>
      </div>
    </footer>
  )
}
