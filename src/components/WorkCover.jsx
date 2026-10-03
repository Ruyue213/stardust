import { useEffect, useRef } from 'react'

const TAU = Math.PI * 2
const BG = 'rgba(5, 8, 16, 0.3)'

/* 星轨：透视星场，悬停加速，点击进入跃迁 */
function starSketch(ctx, w, h, t, dt, p, s) {
  if (!s.stars) {
    s.stars = Array.from({ length: 120 }, () => ({
      x: Math.random() * 2 - 1,
      y: Math.random() * 2 - 1,
      z: 0.15 + Math.random() * 0.85,
      px: 0,
      py: 0,
    }))
    s.speed = 0.18
  }
  if (p.clicks.length) {
    s.speed = 3.2
    p.clicks.length = 0
  }
  const target = p.inside ? 1.05 : 0.18
  s.speed += (target - s.speed) * Math.min(1, dt * 2.6)

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)
  ctx.save()
  ctx.translate(w / 2, h * 0.52)
  for (const st of s.stars) {
    st.z -= s.speed * dt
    if (st.z <= 0.05) {
      st.z = 1
      st.x = Math.random() * 2 - 1
      st.y = Math.random() * 2 - 1
      st.px = 0
      st.py = 0
    }
    const k = 0.62 / st.z
    const x = st.x * k * w * 0.5
    const y = st.y * k * h * 0.5
    if (st.px || st.py) {
      const a = Math.min(0.85, (1 - st.z) * 1.15)
      ctx.strokeStyle = `rgba(140, 216, 255, ${a})`
      ctx.lineWidth = Math.max(0.5, (1 - st.z) * 1.7)
      ctx.beginPath()
      ctx.moveTo(st.px, st.py)
      ctx.lineTo(x, y)
      ctx.stroke()
    }
    st.px = x
    st.py = y
  }
  ctx.restore()
}

/* 回声：环境涟漪 + 悬停细波 + 点击发送 ping */
function echoSketch(ctx, w, h, t, dt, p, s) {
  if (!s.rings) {
    s.rings = []
    s.next = 0.4
    s.hoverT = 0
  }
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)

  s.next -= dt
  if (s.next <= 0) {
    s.next = 0.9 + Math.random() * 1.4
    s.rings.push({ x: w * (0.2 + Math.random() * 0.6), y: h * (0.25 + Math.random() * 0.5), r: 2, max: 46 + Math.random() * 58, v: 34 })
  }
  if (p.inside) {
    s.hoverT -= dt
    if (s.hoverT <= 0) {
      s.hoverT = 0.55
      s.rings.push({ x: p.x, y: p.y, r: 2, max: 40, v: 42 })
    }
  }
  for (const c of p.clicks) s.rings.push({ x: c.x, y: c.y, r: 2, max: 88 + Math.random() * 50, v: 72 })
  p.clicks.length = 0

  s.rings = s.rings.filter((r) => r.r < r.max)
  for (const r of s.rings) {
    r.r += r.v * dt
    const a = Math.max(0, 1 - r.r / r.max)
    ctx.strokeStyle = `rgba(110, 231, 255, ${a * 0.75})`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(r.x, r.y, r.r, 0, TAU)
    ctx.stroke()
    if (a > 0.75) {
      ctx.fillStyle = `rgba(200, 240, 255, ${(a - 0.75) * 2})`
      ctx.beginPath()
      ctx.arc(r.x, r.y, 2.4, 0, TAU)
      ctx.fill()
    }
  }
}

/* 浮游：电子宠物自主游荡，悬停时寻路跟随光标，点击受惊逃窜 */
function driftSketch(ctx, w, h, t, dt, p, s) {
  if (!s.pet) {
    s.pet = { x: w * 0.3, y: h * 0.5, vx: 0, vy: 0 }
    s.tail = []
  }
  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)

  const pet = s.pet
  const targetX = p.inside ? p.x : w * (0.5 + 0.34 * Math.sin(t * 0.5) * Math.cos(t * 0.23))
  const targetY = p.inside ? p.y : h * (0.5 + 0.3 * Math.sin(t * 0.37 + 1.4))
  const k = p.inside ? 5.5 : 1.6
  pet.vx += (targetX - pet.x) * k * dt
  pet.vy += (targetY - pet.y) * k * dt
  for (const c of p.clicks) {
    const away = Math.atan2(pet.y - c.y, pet.x - c.x)
    pet.vx += Math.cos(away) * 240 + (Math.random() - 0.5) * 120
    pet.vy += Math.sin(away) * 240 + (Math.random() - 0.5) * 120
  }
  p.clicks.length = 0
  pet.vx *= Math.exp(-3.4 * dt)
  pet.vy *= Math.exp(-3.4 * dt)
  pet.x = Math.min(Math.max(pet.x + pet.vx * dt, 8), w - 8)
  pet.y = Math.min(Math.max(pet.y + pet.vy * dt, 8), h - 8)

  s.tail.push({ x: pet.x, y: pet.y })
  if (s.tail.length > 46) s.tail.shift()
  for (let i = 1; i < s.tail.length; i++) {
    const a = (i / s.tail.length) ** 2 * 0.5
    ctx.strokeStyle = `rgba(125, 214, 255, ${a})`
    ctx.lineWidth = (i / s.tail.length) * 3.4
    ctx.beginPath()
    ctx.moveTo(s.tail[i - 1].x, s.tail[i - 1].y)
    ctx.lineTo(s.tail[i].x, s.tail[i].y)
    ctx.stroke()
  }

  const g = ctx.createRadialGradient(pet.x, pet.y, 0, pet.x, pet.y, 26)
  g.addColorStop(0, 'rgba(110, 231, 255, 0.55)')
  g.addColorStop(1, 'rgba(110, 231, 255, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.arc(pet.x, pet.y, 26, 0, TAU)
  ctx.fill()
  ctx.fillStyle = 'rgba(235, 250, 255, 0.95)'
  ctx.beginPath()
  ctx.arc(pet.x, pet.y, 3.4, 0, TAU)
  ctx.fill()
  const ang = Math.atan2(pet.vy, pet.vx)
  ctx.fillStyle = '#05070d'
  for (const side of [-0.55, 0.55]) {
    ctx.beginPath()
    ctx.arc(pet.x + Math.cos(ang + side) * 1.6 + Math.cos(ang) * 1.2, pet.y + Math.sin(ang + side) * 1.6 + Math.sin(ang) * 1.2, 0.8, 0, TAU)
    ctx.fill()
  }
}

/* 噪声：流场粒子，悬停湍流加速，点击换种子长出新宇宙 */
function noiseSketch(ctx, w, h, t, dt, p, s) {
  if (!s.dots) {
    s.seed = Math.random() * 1000
    s.dots = Array.from({ length: 240 }, () => ({ x: Math.random() * w, y: Math.random() * h }))
  }
  const reseed = p.clicks.length > 0
  p.clicks.length = 0
  if (reseed) {
    s.seed = Math.random() * 1000
    ctx.fillStyle = '#050810'
    ctx.fillRect(0, 0, w, h)
    for (const d of s.dots) {
      d.x = Math.random() * w
      d.y = Math.random() * h
    }
  }

  ctx.fillStyle = BG
  ctx.fillRect(0, 0, w, h)
  const boost = p.inside ? 2.4 : 1
  const S = s.seed
  for (let i = 0; i < s.dots.length; i++) {
    const d = s.dots[i]
    const a = Math.sin(d.x * 0.012 + S) + Math.cos(d.y * 0.014 - S * 1.7) + Math.sin((d.x + d.y) * 0.006 + S * 0.6)
    const ang = a * Math.PI
    const sp = (16 + (i % 5) * 5) * boost
    d.x += Math.cos(ang) * sp * dt
    d.y += Math.sin(ang) * sp * dt
    if (d.x < -4) d.x = w + 4
    else if (d.x > w + 4) d.x = -4
    if (d.y < -4) d.y = h + 4
    else if (d.y > h + 4) d.y = -4
    const alpha = 0.3 + 0.4 * Math.abs(Math.sin(ang))
    ctx.fillStyle = i % 7 === 0 ? `rgba(233, 240, 250, ${alpha})` : `rgba(96, 196, 255, ${alpha * 0.8})`
    ctx.fillRect(d.x, d.y, 1.6, 1.6)
  }
}

const SKETCHES = { star: starSketch, echo: echoSketch, drift: driftSketch, noise: noiseSketch }

export default function WorkCover({ sketch }) {
  const ref = useRef(null)

  useEffect(() => {
    const canvas = ref.current
    const draw = SKETCHES[sketch]
    if (!canvas || !draw) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let running = false
    let visible = true
    let last = 0
    const pointer = { x: 0, y: 0, inside: false, clicks: [] }
    const state = {}

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.75)
      const rect = canvas.getBoundingClientRect()
      w = rect.width
      h = rect.height
      canvas.width = Math.max(1, Math.round(w * dpr))
      canvas.height = Math.max(1, Math.round(h * dpr))
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.fillStyle = '#050810'
      ctx.fillRect(0, 0, w, h)
    }
    resize()

    const frame = (now) => {
      const dt = Math.min(0.05, (now - last) / 1000 || 0.016)
      last = now
      draw(ctx, w, h, now / 1000, dt, pointer, state)
      if (running) raf = requestAnimationFrame(frame)
    }
    const start = () => {
      if (running || !visible) return
      running = true
      last = performance.now()
      raf = requestAnimationFrame(frame)
    }
    const stop = () => {
      running = false
      cancelAnimationFrame(raf)
    }

    const toLocal = (e) => {
      const r = canvas.getBoundingClientRect()
      pointer.x = e.clientX - r.left
      pointer.y = e.clientY - r.top
    }
    const onMove = (e) => {
      toLocal(e)
      pointer.inside = true
    }
    const onLeave = () => {
      pointer.inside = false
    }
    const onDown = (e) => {
      toLocal(e)
      pointer.clicks.push({ x: pointer.x, y: pointer.y })
    }

    const ro = new ResizeObserver(resize)
    ro.observe(canvas)
    const io = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting
        if (visible && !reduce) start()
        else stop()
      },
      { rootMargin: '120px' }
    )
    io.observe(canvas)
    canvas.addEventListener('pointermove', onMove)
    canvas.addEventListener('pointerleave', onLeave)
    canvas.addEventListener('pointerdown', onDown)

    if (reduce) {
      for (let i = 0; i < 60; i++) draw(ctx, w, h, i * 0.016, 0.016, pointer, state)
    } else {
      start()
    }

    return () => {
      stop()
      ro.disconnect()
      io.disconnect()
      canvas.removeEventListener('pointermove', onMove)
      canvas.removeEventListener('pointerleave', onLeave)
      canvas.removeEventListener('pointerdown', onDown)
    }
  }, [sketch])

  return <canvas className="work__canvas" ref={ref} aria-hidden="true" />
}
