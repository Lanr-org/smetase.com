import Lenis from 'lenis'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import { SplitText } from 'gsap/SplitText'
import { initTextures } from './texture'

gsap.registerPlugin(ScrollTrigger, SplitText)

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
const root = document.documentElement

// ---------- Smooth scroll ----------

let lenis: Lenis | null = null
if (!reduceMotion) {
  lenis = new Lenis({ autoRaf: false, lerp: 0.1 })
  lenis.on('scroll', ScrollTrigger.update)
  gsap.ticker.add((time) => lenis?.raf(time * 1000))
  gsap.ticker.lagSmoothing(0)
  if (import.meta.env.DEV) Object.assign(window, { __lenis: lenis })
}

// Same-page anchors go through Lenis so they glide too.
document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
  link.addEventListener('click', (event) => {
    const target = document.querySelector(link.getAttribute('href') || '')
    if (!target) return
    event.preventDefault()
    if (lenis) lenis.scrollTo(target as HTMLElement, { duration: 1.6 })
    else target.scrollIntoView()
  })
})

// ---------- Smell → taste: the line ----------
// Above the line is colour (what you have scrolled past), below it is black and white.
// It starts at the very top, drops to just past the middle as you begin to scroll,
// and sweeps off the bottom on the last screen, so the whole page ends in colour.

const FEATHER = 140
const updateLine = () => {
  const vh = window.innerHeight
  const y = window.scrollY
  const max = root.scrollHeight - vh
  const resting = vh * 0.56
  let line = Math.min(y / (vh * 0.45), 1) * resting
  const finish = gsap.utils.clamp(0, 1, (y - (max - vh * 0.9)) / (vh * 0.9))
  line += (vh + FEATHER - line) * finish
  root.style.setProperty('--line-y', `${line}px`)
}
updateLine()
window.addEventListener('scroll', updateLine, { passive: true })
window.addEventListener('resize', updateLine)

// ---------- Nav: hide on the way down, return on the way up ----------

const nav = document.querySelector<HTMLElement>('.nav')
if (nav) {
  let lastY = window.scrollY
  window.addEventListener(
    'scroll',
    () => {
      const y = window.scrollY
      nav.classList.toggle('is-solid', y > 40)
      nav.classList.toggle('is-hidden', y > lastY && y > window.innerHeight * 0.6)
      lastY = y
    },
    { passive: true },
  )
}

// ---------- Hero ----------

const intro = () => {
  const words = gsap.utils.toArray<HTMLElement>('[data-hero-word]')
  const photo = document.querySelector<HTMLElement>('[data-hero-photo]')
  const fades = gsap.utils.toArray<HTMLElement>('[data-hero-fade]')
  const logoParts = gsap.utils.toArray<HTMLElement>('.nav .logo__part')

  if (reduceMotion || !photo) return

  const tl = gsap.timeline({ defaults: { ease: 'expo.out' } })
  tl.from(words, { yPercent: 105, duration: 1.6, stagger: 0.12 }, 0.15)
    .from(
      photo,
      { clipPath: 'inset(100% 0% 0% 0%)', duration: 1.6, ease: 'expo.inOut' },
      0.25,
    )
    .from(photo?.querySelector('img') ?? [], { scale: 1.35, duration: 2.2 }, 0.25)
    .from(logoParts, { yPercent: 120, opacity: 0, duration: 1.2, stagger: 0.05 }, 0.1)
    .from(fades, { y: 24, opacity: 0, duration: 1.2, stagger: 0.1 }, 0.9)

  // On scroll the two words part and the photo rises through them.
  const hero = document.querySelector('.hero')
  const st = { trigger: hero, start: 'top top', end: 'bottom top', scrub: true }
  gsap.to('.hero__row--1 .hero__word', { xPercent: -8, ease: 'none', scrollTrigger: st })
  gsap.to('.hero__row--2 .hero__word', { xPercent: 6, ease: 'none', scrollTrigger: st })
  if (photo) gsap.to(photo, { yPercent: -28, ease: 'none', scrollTrigger: st })
  gsap.to('.hero__thumb', { yPercent: -60, ease: 'none', scrollTrigger: st })
}

// ---------- Headlines and paragraphs that rise in ----------

const reveals = () => {
  if (reduceMotion) return
  gsap.utils.toArray<HTMLElement>('[data-split]').forEach((el) => {
    SplitText.create(el, {
      type: 'lines',
      mask: 'lines',
      autoSplit: true,
      onSplit: (self) => {
        // Room for descenders, which the tight display leading would otherwise clip.
        gsap.set(self.masks, { paddingBottom: '0.14em', marginBottom: '-0.14em' })
        return gsap.from(self.lines, {
          yPercent: 110,
          duration: 1.3,
          ease: 'expo.out',
          stagger: 0.08,
          scrollTrigger: { trigger: el, start: 'top 88%', once: true },
        })
      },
    })
  })
  gsap.utils.toArray<HTMLElement>('[data-rise]').forEach((el) => {
    gsap.from(el, {
      y: 40,
      opacity: 0,
      duration: 1.2,
      ease: 'expo.out',
      scrollTrigger: { trigger: el, start: 'top 90%', once: true },
    })
  })
  gsap.utils.toArray<HTMLElement>('[data-parallax]').forEach((el) => {
    const amount = Number(el.dataset.parallax || 12)
    gsap.fromTo(
      el,
      { yPercent: amount },
      { yPercent: -amount, ease: 'none', scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true } },
    )
  })
}

const start = () => {
  intro()
  reveals()
  initTextures(reduceMotion)
  window.dispatchEvent(new CustomEvent('smetase:ready', { detail: { gsap, ScrollTrigger, reduceMotion } }))
  ScrollTrigger.refresh()
  updateLine()
}

// Wait for the fonts so split lines break where they will finally sit.
document.fonts.ready.then(start)
