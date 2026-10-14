// Hermes-style texture: each photo is redrawn as a halftone of its own colours on ink.
// Scrolling a photo to the middle of the screen wipes the texture away and shows the clear
// photo underneath; with a mouse, hovering does it too, from the pointer.
import { gsap } from 'gsap'

const INK = '#0a0a0a'
const CELL = 7 // css px per halftone cell

// cutout: a photo with its background removed, drawn as ink dots on nothing.
type Mode = 'dots' | 'lines' | 'cutout'

const drawTexture = (canvas: HTMLCanvasElement, img: HTMLImageElement, mode: Mode) => {
  const box = canvas.getBoundingClientRect()
  if (!box.width || !box.height || !img.naturalWidth) return
  const dpr = Math.min(window.devicePixelRatio || 1, 2)
  canvas.width = Math.round(box.width * dpr)
  canvas.height = Math.round(box.height * dpr)

  // Sample the photo at one pixel per cell, cropped like object-fit: cover.
  const cols = Math.ceil(box.width / CELL)
  const rows = Math.ceil(box.height / CELL)
  const sample = document.createElement('canvas')
  sample.width = cols
  sample.height = rows
  const sctx = sample.getContext('2d', { willReadFrequently: true })
  if (!sctx) return
  if (mode === 'cutout') {
    // object-fit: contain, anchored to the bottom, so the dots sit exactly over the photo.
    const scale = Math.min(box.width / img.naturalWidth, box.height / img.naturalHeight)
    const dw = (img.naturalWidth * scale) / CELL
    const dh = (img.naturalHeight * scale) / CELL
    sctx.drawImage(img, (cols - dw) / 2, rows - dh, dw, dh)
  } else {
    const scale = Math.max(box.width / img.naturalWidth, box.height / img.naturalHeight)
    const sw = box.width / scale
    const sh = box.height / scale
    // Follow the photo's object-position (percentages only; anything else falls back to centre).
    const [px0, py0] = getComputedStyle(img).objectPosition.split(' ').map((v) => (v.endsWith('%') ? parseFloat(v) / 100 : 0.5))
    const sx = (img.naturalWidth - sw) * (px0 ?? 0.5)
    const sy = (img.naturalHeight - sh) * (py0 ?? 0.5)
    sctx.drawImage(img, sx, sy, sw, sh, 0, 0, cols, rows)
  }
  const px = sctx.getImageData(0, 0, cols, rows).data

  const ctx = canvas.getContext('2d')
  if (!ctx) return
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
  if (mode === 'cutout') {
    ctx.clearRect(0, 0, box.width, box.height)
  } else {
    ctx.fillStyle = INK
    ctx.fillRect(0, 0, box.width, box.height)
  }

  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = (y * cols + x) * 4
      const r = px[i]
      const g = px[i + 1]
      const b = px[i + 2]
      const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255
      if (mode === 'cutout') {
        // Black and white: darker areas get bigger ink dots; transparent pixels get none.
        if (px[i + 3] < 60) continue
        const rad = (CELL / 2) * 1.12 * Math.sqrt(1 - lum * 0.92)
        if (rad < 0.4) continue
        ctx.fillStyle = INK
        ctx.beginPath()
        ctx.arc(x * CELL + CELL / 2, y * CELL + CELL / 2, rad, 0, Math.PI * 2)
        ctx.fill()
        continue
      }
      // Push the colour a little so the dots stay rich against the ink.
      const boost = 1.15
      ctx.fillStyle = `rgb(${Math.min(255, r * boost)},${Math.min(255, g * boost)},${Math.min(255, b * boost)})`
      const cx = x * CELL + CELL / 2
      const cy = y * CELL + CELL / 2
      if (mode === 'lines') {
        const h = Math.max(0.6, CELL * 0.92 * Math.sqrt(lum))
        ctx.fillRect(x * CELL, cy - h / 2, CELL + 0.5, h)
      } else {
        const rad = (CELL / 2) * 1.08 * Math.sqrt(lum)
        if (rad < 0.35) continue
        ctx.beginPath()
        ctx.arc(cx, cy, rad, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
}

export const initTextures = (reduceMotion: boolean) => {
  const hoverable = window.matchMedia('(hover: hover)').matches
  const frames = Array.from(document.querySelectorAll<HTMLElement>('[data-texture]'))

  frames.forEach((frame) => {
    const img = frame.querySelector('img')
    if (!img) return
    const mode = (frame.dataset.texture as Mode) || 'dots'
    const canvas = document.createElement('canvas')
    canvas.className = 'tex__canvas'
    canvas.setAttribute('aria-hidden', 'true')
    frame.appendChild(canvas)

    const render = () => drawTexture(canvas, img, mode)
    if (img.complete) render()
    else img.addEventListener('load', render, { once: true })

    let last = 0
    new ResizeObserver(() => {
      // Redraw on resize, but not on every frame of a resize drag.
      window.clearTimeout(last)
      last = window.setTimeout(render, 120)
    }).observe(frame)

    const state = { r: 0 }
    const setR = () => frame.style.setProperty('--reveal', `${state.r}px`)
    const radiusFor = () => Math.hypot(frame.clientWidth, frame.clientHeight) * 1.05

    const open = () =>
      gsap.to(state, { r: radiusFor(), duration: reduceMotion ? 0 : 1.1, ease: 'expo.out', onUpdate: setR })
    const close = () =>
      gsap.to(state, { r: 0, duration: reduceMotion ? 0 : 0.9, ease: 'expo.inOut', onUpdate: setR })

    const place = (event: PointerEvent) => {
      const box = frame.getBoundingClientRect()
      frame.style.setProperty('--rx', `${event.clientX - box.left}px`)
      frame.style.setProperty('--ry', `${event.clientY - box.top}px`)
    }

    // Clear while the photo sits in the middle of the screen or, with a mouse, while hovered.
    let inView = false
    let hovered = false
    const update = () => (inView || hovered ? open() : close())

    frame.style.setProperty('--rx', '50%')
    frame.style.setProperty('--ry', '50%')
    new IntersectionObserver(
      ([entry]) => {
        inView = entry.isIntersecting
        update()
      },
      { rootMargin: '-35% 0px -35% 0px' },
    ).observe(frame)

    if (hoverable) {
      frame.addEventListener('pointerenter', (event) => {
        place(event)
        hovered = true
        update()
      })
      frame.addEventListener('pointermove', place)
      frame.addEventListener('pointerleave', () => {
        hovered = false
        update()
      })
    }
  })
}
