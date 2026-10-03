import { useEffect, useState } from 'react'
import { nav, profile } from '../content'
import { scrollToTarget } from '../lib/lenis'
import { IS_MAC } from '../lib/env'

export default function Nav({ ready, onOpenCmd }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const handleClick = (e, href) => {
    e.preventDefault()
    scrollToTarget(href)
  }

  return (
    <header className={`nav${scrolled ? ' is-scrolled' : ''}${ready ? ' is-ready' : ''}`}>
      <a className="nav__logo" href="#top" onClick={(e) => handleClick(e, 0)} data-cursor>
        {profile.logo}
      </a>
      <div className="nav__right">
        <nav className="nav__links" aria-label="主导航">
          {nav.map((item) => (
            <a key={item.href} href={item.href} onClick={(e) => handleClick(e, item.href)} data-cursor>
              {item.label}
            </a>
          ))}
        </nav>
        <button className="nav__cmdk" onClick={onOpenCmd} aria-label="打开命令面板" data-cursor>
          {IS_MAC ? '⌘K' : 'Ctrl K'}
        </button>
      </div>
    </header>
  )
}
