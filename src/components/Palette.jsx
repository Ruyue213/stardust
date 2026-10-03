import { Fragment, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { nav, profile } from '../content'
import { getLenis, scrollToTarget } from '../lib/lenis'
import { copyText } from '../lib/clipboard'
import { IS_MAC } from '../lib/env'

const emit = (name) => window.dispatchEvent(new Event(name))

async function copyEmail() {
  const ok = await copyText(profile.email)
  return ok ? '已复制 ✓' : `复制失败：${profile.email}`
}

function buildCommands() {
  return [
    {
      id: 'home',
      group: '导航',
      label: '回到顶部',
      hint: 'HOME',
      keywords: 'top home start 顶部 首页',
      run: () => scrollToTarget(0),
    },
    ...nav.map((item) => ({
      id: item.href,
      group: '导航',
      label: item.label,
      hint: item.href.replace('#', '').toUpperCase(),
      keywords: `${item.label} ${item.href}`,
      run: () => scrollToTarget(item.href),
    })),
    {
      id: 'idea',
      group: '动作',
      label: '随机灵感',
      hint: 'IDEA',
      keywords: 'idea quote inspiration 灵感 语录',
      run: () => {
        scrollToTarget('#playground')
        setTimeout(() => emit('stardust:inspiration'), 450)
      },
    },
    {
      id: 'boom',
      group: '动作',
      label: '执行烟花',
      hint: 'BOOM',
      keywords: 'fireworks burst 烟花 庆祝',
      run: () => {
        scrollToTarget('#playground')
        setTimeout(() => emit('stardust:fireworks'), 450)
      },
    },
    {
      id: 'gold',
      group: '动作',
      label: '黄金模式',
      hint: 'KONAMI',
      keywords: 'gold konami 黄金 彩蛋',
      run: () => emit('stardust:gold'),
    },
    {
      id: 'copy',
      group: '动作',
      label: '复制邮箱',
      hint: 'COPY',
      keywords: 'email mail copy 复制 邮箱 联系',
      run: copyEmail,
    },
    {
      id: 'replay',
      group: '动作',
      label: '重播开场动画',
      hint: 'REPLAY',
      keywords: 'replay intro preloader 开场 动画 loading',
      run: () => {
        try {
          window.sessionStorage.removeItem('stardust:visited')
        } catch {
          /* ignore */
        }
        window.location.reload()
      },
    },
  ]
}

export default function Palette({ open, onClose }) {
  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const [closing, setClosing] = useState(false)
  const [feedback, setFeedback] = useState(null)
  const inputRef = useRef(null)
  const feedbackTimer = useRef(0)
  const commands = useMemo(buildCommands, [])

  const close = useCallback(() => {
    if (closing) return
    setClosing(true)
    setTimeout(onClose, 160)
  }, [closing, onClose])

  useEffect(() => {
    if (!open) return undefined
    setQuery('')
    setActive(0)
    setClosing(false)
    setFeedback(null)
    getLenis()?.stop()
    const t = setTimeout(() => inputRef.current?.focus(), 30)
    return () => {
      clearTimeout(t)
      if (!document.querySelector('.preloader')) getLenis()?.start()
    }
  }, [open])

  useEffect(() => {
    setActive(0)
  }, [query])

  useEffect(() => {
    if (!open) return undefined
    const el = document.querySelector('.palette__item.is-active')
    el?.scrollIntoView({ block: 'nearest' })
    return undefined
  }, [active, open])

  useEffect(() => () => clearTimeout(feedbackTimer.current), [])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return commands
    return commands.filter(
      (c) => c.label.toLowerCase().includes(q) || c.keywords.toLowerCase().includes(q)
    )
  }, [commands, query])

  const runCommand = useCallback(
    async (cmd) => {
      const res = await cmd.run?.()
      if (typeof res === 'string') {
        setFeedback({ id: cmd.id, text: res })
        clearTimeout(feedbackTimer.current)
        feedbackTimer.current = setTimeout(() => setFeedback(null), 1400)
      } else {
        close()
      }
    },
    [close]
  )

  if (!open) return null

  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(i + 1, filtered.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(i - 1, 0))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      const cmd = filtered[active]
      if (cmd) runCommand(cmd)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  return (
    <div className={`palette${closing ? ' is-closing' : ''}`} role="dialog" aria-label="命令面板">
      <div className="palette__backdrop" onClick={close} />
      <div className="palette__panel">
        <div className="palette__search">
          <span className="palette__prompt">❯</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="输入命令…"
            spellCheck={false}
            autoComplete="off"
            data-cursor
          />
          <span className="palette__esc">ESC</span>
        </div>
        <div className="palette__list">
          {filtered.length === 0 && (
            <div className="palette__empty">NO MATCH — 没有匹配的命令</div>
          )}
          {filtered.map((cmd, i) => (
            <Fragment key={cmd.id}>
              {(i === 0 || filtered[i - 1].group !== cmd.group) && (
                <div className="palette__group">{cmd.group}</div>
              )}
              <div
                className={`palette__item${i === active ? ' is-active' : ''}`}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => runCommand(cmd)}
                data-cursor
              >
                <span>{feedback?.id === cmd.id ? feedback.text : cmd.label}</span>
                <span className="palette__hint">{cmd.hint}</span>
              </div>
            </Fragment>
          ))}
        </div>
        <div className="palette__foot">
          <span>↑↓ 选择</span>
          <span>↵ 执行</span>
          <span>ESC 关闭</span>
          <span className="palette__foot-right">{IS_MAC ? '⌘K' : 'CTRL K'}</span>
        </div>
      </div>
    </div>
  )
}
