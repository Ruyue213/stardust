let instance = null

export function setLenis(lenis) {
  instance = lenis
}

export function getLenis() {
  return instance
}

export function scrollToTarget(target) {
  if (!instance) return
  instance.scrollTo(target, {
    duration: 1.6,
    easing: (t) => 1 - Math.pow(1 - t, 4),
  })
}
