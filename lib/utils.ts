import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  })
}

export function formatPercent(num: number, digits = 1): string {
  return `${(num * 100).toFixed(digits)}%`
}

/** Latency: sub-ms rounds to whole ms, seconds get one decimal. */
export function formatLatency(ms: number): string {
  if (ms < 1) return '<1 ms'
  if (ms < 1000) return `${Math.round(ms)} ms`
  return `${(ms / 1000).toFixed(2)} s`
}

/** Compact counts: 1234 -> 1.2k, 2_500_000 -> 2.5M. */
export function formatCompact(num: number): string {
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(num)
}

const RELATIVE = new Intl.RelativeTimeFormat('en-US', { numeric: 'auto' })
const UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 31536000],
  ['month', 2592000],
  ['day', 86400],
  ['hour', 3600],
  ['minute', 60],
  ['second', 1],
]

export function relativeTime(date: string | Date | null | undefined): string {
  if (!date) return 'never'
  const seconds = (Date.now() - new Date(date).getTime()) / 1000
  for (const [unit, secondsInUnit] of UNITS) {
    if (Math.abs(seconds) >= secondsInUnit || unit === 'second') {
      return RELATIVE.format(-Math.round(seconds / secondsInUnit), unit)
    }
  }
  return 'just now'
}

export async function copyText(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

export function truncate(str: string, length: number): string {
  if (str.length <= length) return str
  return str.substring(0, length) + '...'
}
