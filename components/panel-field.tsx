'use client'

import { useEffect, useRef } from 'react'
import { cn } from '@/lib/utils'

/**
 * The panel: the gateway as a control surface lit from above. A slow amber
 * bloom, a dot-grid that fades out from the light, film grain, and two patch
 * cords strung the length of the board — one idle, one carrying traffic.
 *
 * It answers the pointer: the lamp follows the cursor (so the grid lights up
 * under it), the live cord bends toward the cursor like a plucked string,
 * traffic speeds up while you move, and a click sends a pulse down the cord
 * plus a ring across the board. Ambient drift when the pointer is away; a
 * single static frame when the visitor asks for reduced motion.
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
    const pulses: { u: number }[] = []
    const rings: { x: number; y: number; r: number }[] = []

    // pointer, in canvas-local px. lx/ly is the eased lamp position; pluck is
    // the eased sideways bend of the live cord toward the cursor.
    const ptr = { x: 0, y: 0, near: 0 }
    let lx = 0
    let ly = 0
    let pluckU = 0.5
    let pluckX = 0
    let pluckY = 0

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
    lx = w * 0.3
    ly = h * 0.3
    const ro = new ResizeObserver(fit)
    ro.observe(cv)

    const onMove = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      ptr.x = e.clientX - r.left
      ptr.y = e.clientY - r.top
      const inside =
        ptr.x > -80 && ptr.x < w + 80 && ptr.y > -80 && ptr.y < h + 80
      ptr.near = inside ? 1 : 0
    }
    const onLeave = () => {
      ptr.near = 0
    }
    const onClick = (e: PointerEvent) => {
      const r = cv.getBoundingClientRect()
      if (e.clientX < r.left || e.clientX > r.right) return
      if (e.clientY < r.top || e.clientY > r.bottom) return
      if (pulses.length < 4) pulses.push({ u: 0 })
      if (rings.length < 4) rings.push({ x: e.clientX - r.left, y: e.clientY - r.top, r: 0 })
    }
    if (!reduce) {
      window.addEventListener('pointermove', onMove, { passive: true })
      window.addEventListener('pointerdown', onClick, { passive: true })
      window.addEventListener('blur', onLeave)
      document.addEventListener('pointerleave', onLeave)
    }

    // cord geometry. `live` gets the pointer pluck; the back cord stays slack.
    const cordPoint = (u: number, live: boolean) => {
      const ax = -0.05 * w
      const ay = (live ? 0.3 : 0.44) * h
      const bx = 1.05 * w
      const by = (live ? 0.82 : 0.92) * h
      const sag =
        Math.hypot(bx - ax, by - ay) * (live ? 0.1 : 0.13) +
        Math.sin(t * 0.015 + (live ? 0 : 1.7)) * 10
      let x = ax + (bx - ax) * u
      let y = ay + (by - ay) * u + sag * 4 * u * (1 - u)
      if (live) {
        const env = Math.exp(-(((u - pluckU) / 0.16) ** 2))
        x += pluckX * env
        y += pluckY * env
      }
      return { x, y }
    }
    const cordPath = (live: boolean) => {
      ctx.beginPath()
      for (let i = 0; i <= 60; i++) {
        const p = cordPoint(i / 60, live)
        if (i === 0) ctx.moveTo(p.x, p.y)
        else ctx.lineTo(p.x, p.y)
      }
    }

    const draw = () => {
      t += 1
      ctx.clearRect(0, 0, w, h)
      ctx.fillStyle = '#141110'
      ctx.fillRect(0, 0, w, h)

      // where the lamp wants to be: pointer when near, ambient drift otherwise
      const driftX = w * (0.3 + 0.05 * Math.sin(t * 0.006))
      const driftY = h * (0.3 + 0.06 * Math.cos(t * 0.005))
      const k = reduce ? 0 : ptr.near
      lx += (driftX + (ptr.x - driftX) * k - lx) * 0.06
      ly += (driftY + (ptr.y - driftY) * k - ly) * 0.06

      const bloom = ctx.createRadialGradient(lx, ly, 0, lx, ly, Math.max(w, h) * 0.82)
      const lift = 1 + 0.5 * k
      bloom.addColorStop(0, `rgba(198,134,76,${0.24 * lift})`)
      bloom.addColorStop(0.4, `rgba(120,80,50,${0.08 * lift})`)
      bloom.addColorStop(1, 'rgba(0,0,0,0)')
      ctx.fillStyle = bloom
      ctx.fillRect(0, 0, w, h)

      // dot-grid, brightest under the light and fading out
      const gap = 26
      for (let y = gap; y < h; y += gap) {
        for (let x = gap; x < w; x += gap) {
          const d = Math.hypot(x - lx, y - ly) / (Math.max(w, h) * 0.66)
          const a = (0.075 + 0.09 * k) * (1 - d)
          if (a <= 0.004) continue
          ctx.fillStyle = `rgba(193,151,79,${a.toFixed(3)})`
          const s = 1.6 + (k && d < 0.18 ? 1.2 * (1 - d / 0.18) : 0)
          ctx.fillRect(x, y, s, s)
        }
      }

      // ease the cord pluck: aim at the pointer's offset from the nearest
      // point of the cord's rest line, springing back to slack otherwise
      let tgtX = 0
      let tgtY = 0
      let tgtU = pluckU
      if (k) {
        let best = 1e9
        for (let i = 0; i <= 24; i++) {
          const u = i / 24
          const p = cordPoint(u, false)
          const dd = Math.hypot(p.x - ptr.x, p.y - ptr.y)
          if (dd < best) {
            best = dd
            tgtU = u
            const pull = Math.max(0, 1 - best / 150)
            tgtX = (ptr.x - p.x) * pull
            tgtY = (ptr.y - p.y) * pull
          }
        }
      }
      pluckU += (tgtU - pluckU) * 0.12
      pluckX += (tgtX - pluckX) * 0.12
      pluckY += (tgtY - pluckY) * 0.12

      // back cord: slack cloth, no traffic
      cordPath(false)
      ctx.strokeStyle = 'rgba(0,0,0,0.28)'
      ctx.lineWidth = 6
      ctx.lineCap = 'round'
      ctx.stroke()
      cordPath(false)
      ctx.strokeStyle = 'rgba(96,86,72,0.5)'
      ctx.lineWidth = 2.6
      ctx.stroke()

      // live cord: cloth turning to patch-cord orange as it carries traffic
      cordPath(true)
      ctx.strokeStyle = 'rgba(0,0,0,0.32)'
      ctx.lineWidth = 7
      ctx.stroke()
      const grad = ctx.createLinearGradient(0, h * 0.3, w, h * 0.82)
      grad.addColorStop(0, 'rgba(124,107,88,0.82)')
      grad.addColorStop(0.6, 'rgba(124,107,88,0.82)')
      grad.addColorStop(0.62, 'rgba(224,98,58,0.95)')
      grad.addColorStop(1, 'rgba(224,98,58,0.95)')
      cordPath(true)
      ctx.strokeStyle = grad
      ctx.lineWidth = 3.4
      ctx.stroke()

      // travelling beads — faster while the pointer is moving over the board
      if (!reduce) {
        const boost = 1 + 1.6 * k
        for (let bi = 0; bi < beads.length; bi++) {
          const b = beads[bi]
          b.u += (0.0016 + bi * 0.0002) * boost
          if (b.u > 1) b.u -= 1
          for (let q = 0; q < 9; q++) {
            const uu = b.u - q * 0.012
            if (uu < 0) continue
            const p = cordPoint(uu, true)
            ctx.beginPath()
            ctx.arc(p.x, p.y, 3.2 - q * 0.3, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(246,196,140,${0.9 - q * 0.1})`
            ctx.fill()
          }
        }

        // click pulses: a bright fast bead with a long trail
        for (let pi = pulses.length - 1; pi >= 0; pi--) {
          const pu = pulses[pi]
          pu.u += 0.012
          if (pu.u >= 1) {
            pulses.splice(pi, 1)
            continue
          }
          for (let q = 0; q < 16; q++) {
            const uu = pu.u - q * 0.01
            if (uu < 0) continue
            const p = cordPoint(uu, true)
            ctx.beginPath()
            ctx.arc(p.x, p.y, 4.4 - q * 0.24, 0, Math.PI * 2)
            ctx.fillStyle = `rgba(255,224,178,${0.95 - q * 0.055})`
            ctx.fill()
          }
        }

        // click rings: an expanding amber circle from the click point
        for (let ri = rings.length - 1; ri >= 0; ri--) {
          const rg = rings[ri]
          rg.r += 6
          const a = 1 - rg.r / 260
          if (a <= 0) {
            rings.splice(ri, 1)
            continue
          }
          ctx.beginPath()
          ctx.arc(rg.x, rg.y, rg.r, 0, Math.PI * 2)
          ctx.strokeStyle = `rgba(224,98,58,${(a * 0.5).toFixed(3)})`
          ctx.lineWidth = 2
          ctx.stroke()
        }
      } else {
        const p = cordPoint(0.72, true)
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
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerdown', onClick)
      window.removeEventListener('blur', onLeave)
      document.removeEventListener('pointerleave', onLeave)
    }
  }, [])

  return <canvas ref={ref} aria-hidden className={cn('block', className)} />
}
