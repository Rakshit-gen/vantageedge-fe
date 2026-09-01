'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * The panel: the gateway as a control surface lit from above. A slow amber
 * bloom, a dot-grid that fades out from the light, film grain, and one patch
 * cord carrying traffic the length of the board. Ambient only — it sits behind
 * the hero copy and never asks for attention. Freezes to a single static frame
 * when the visitor asks for reduced motion.
 *
 * Colours are the panel's own tuned values, close to the theme tokens
 * (--background ≈ #141110, --patch ≈ #e0623a) but hand-picked for how they read
 * as light on a surface rather than as UI fills.
 */
export function PanelField({ className }: { className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const cv = ref.current
    const ctx = cv?.getContext('2d')
    if (!cv || !ctx) return

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let w = 0
    let h = 0
    let raf = 0
    let t = 0
    const beads = [{ u: 0.02 }, { u: 0.36 }, { u: 0.7 }]

    // film grain, tiled
    const grain = document.createElement('canvas')
    grain.width = grain.height = 128
    const gg = grain.getContext('2d')!
    const img = gg.createImageData(128, 128)
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 40 + Math.random() * 190
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v
      img.data[i + 3] = Math.random() * 18
    }
    gg.putImageData(img, 0, 0)
    let pat: CanvasPattern | null = null

    const fit = () => {
      const r = cv.getBoundingClientRect()
      const dpr = Math.min(window.devicePixelRatio || 1, 2)
      w = r.width
      h = r.height
      cv.width = Math.max(1, w * dpr)
      cv.height = Math.max(1, h * dpr)
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      pat = ctx.createPattern(grain, 'repeat')
    }
    fit()
    const ro = new ResizeObserver(fit)
    ro.observe(cv)

    const cordPoint = (u: number) => {
      const ax = -0.05 * w
      const ay = 0.3 * h
      const bx = 1.05 * w
      const by = 0.82 * h
      const sag = Math.hypot(bx - ax, by - ay) * 0.1 + Math.sin(t * 0.015) * 10
      return { x: ax + (bx - ax) * u, y: ay + (by - ay) * u + sag * 4 * u * (1 - u) }
    }
    const cordPath = () => {
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const p = cordPoint(i / 60)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
    }

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#141110'
      ctx.fillRect(0, 0, w, h)

      // amber bloom, drifting slowly — the lamp over the board
      const cx = w * (0.3 + 0.05 * Math.sin(t * 0.006))
      const cy = h * (0.3 + 0.06 * Math.cos(t * 0.005))
      const bloom = ctx.createRadialGradient(cx, cy, 0, cx, cy, Math.max(w, h) * 0.82)
      bloom.addColorStop(0, 'rgba(198,134,76,0.24)')
      bloom.addColorStop(0.4, 'rgba(120,80,50,0.08)')
      bloom.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bloom
      ctx.fillRect(0, 0, w, h)

      // dot-grid, brightest under the light and fading out
      const gap = 26
      for (let y = gap; y < h; y += gap) {
        for (let x = gap; x < w; x += gap) {
          const d = Math.hypot(x - cx, y - cy) / (Math.max(w, h) * 0.66)
          const a = 0.075 * (1 - d)
          if (a <= 0.004) continue
          ctx.fillStyle = `rgba(193,151,79,${a.toFixed(3)})`
          ctx.fillRect(x, y, 1.6, 1.6)
        }
      }

      // the one cord: cloth, turning to patch-cord orange as it carries traffic
      cordPath()
      ctx.strokeStyle = 'rgba(0,0,0,0.32)'
      ctx.lineWidth = 7
      ctx.lineCap = 'round'
      ctx.stroke()
      const grad = ctx.createLinearGradient(0, h * 0.3, w, h * 0.82)
      grad.addColorStop(0, 'rgba(124,107,88,0.82)')
      grad.addColorStop(0.6, 'rgba(124,107,88,0.82)')
      grad.addColorStop(0.62, 'rgba(224,98,58,0.95)')
      grad.addColorStop(1, 'rgba(224,98,58,0.95)')
      cordPath()
      ctx.strokeStyle = grad
      ctx.lineWidth = 3.4
      ctx.stroke()

      // travelling beads
      if (!reduce) {
        for (let bi = 0; bi < beads.length; bi++) {
          const b = beads[bi]
          b.u += 0.0016 + bi * 0.0002
          if (b.u > 1) b.u -= 1
          for (let q = 0; q < 9; q++) {
            const uu = b.u - q * 0.012
            if (uu < 0) continue
            const p = cordPoint(uu)
            ctx.beginPath()
            ctx.arc(p.x, p.y, 3.2 - q * 0.3, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(246,196,140,${0.9 - q * 0.1})`
            ctx.fill()
          }
        }
      } else {
        const p = cordPoint(0.72)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 3, 0, Math.PI * 2)
        ctx.fillStyle = 'rgba(246,196,140,0.9)'
        ctx.fill()
      }

      // grain, drifting a touch so it shimmers rather than sits
      if (pat) {
        ctx.save()
        ctx.globalAlpha = 0.55
        ctx.translate(-((t * 0.7) % 128), -((t * 0.37) % 128))
        ctx.fillStyle = pat
        ctx.fillRect(0, 0, w + 128, h + 128)
        ctx.restore()
      }

      if (!reduce) raf = requestAnimationFrame(draw)
    }

    if (reduce) draw()
    else raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={cn('block', className)} />
}
