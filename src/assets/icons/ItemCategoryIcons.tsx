import type { ComponentType } from 'react'
import type { ItemCategory } from '../../types'

function iconProps(size: number) {
  return {
    width: size, height: size, viewBox: '0 0 24 24', fill: 'none' as const,
    stroke: 'currentColor', strokeWidth: 1.6,
    strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const,
  }
}

type IconProps = { className?: string; size?: number }

export function ClothesIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <path d="M9 4l3 2 3-2 3 3-2 2v11H8V9L6 7z" />
      <path d="M9 4c0 1.5 1.3 2.5 3 2.5S15 5.5 15 4" opacity={0.4} />
    </svg>
  )
}

export function SleepIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" />
      <circle cx="15" cy="9" r="0.8" fill="currentColor" opacity={0.3} />
    </svg>
  )
}

export function TechIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <rect x="5" y="4" width="14" height="16" rx="2" />
      <line x1="5" y1="16.5" x2="19" y2="16.5" opacity={0.4} />
      <circle cx="12" cy="18.2" r="0.9" fill="currentColor" opacity={0.4} />
    </svg>
  )
}

export function RepairIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <path d="M14.7 6.3a3 3 0 0 0-3.9 3.9L4 17l3 3 6.8-6.8a3 3 0 0 0 3.9-3.9l-2.2 2.2-2-2z" />
    </svg>
  )
}

export function HygieneIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <path d="M12 3c3 4 6 7.4 6 11a6 6 0 1 1-12 0c0-3.6 3-7 6-11z" />
      <path d="M9.5 14.5c0 1.4 1.1 2.5 2.5 2.5" opacity={0.35} />
    </svg>
  )
}

export function FoodIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <path d="M15.5 3c-2 1-3 3-3 5.5 0 2 1 3.3 2.3 4.2L14 20h2.2l0.9-8" />
      <path d="M8 3v6" opacity={0.5} />
      <path d="M6 3v4c0 1 0.6 1.8 2 1.8s2-0.8 2-1.8V3" opacity={0.5} />
      <path d="M8 8.8V20" opacity={0.5} />
    </svg>
  )
}

export function DocsIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <path d="M7 3h7l4 4v14H7z" />
      <path d="M14 3v4h4" opacity={0.4} />
      <line x1="9.5" y1="12" x2="15" y2="12" opacity={0.4} />
      <line x1="9.5" y1="15.5" x2="15" y2="15.5" opacity={0.4} />
    </svg>
  )
}

export function MountedIcon({ className, size = 20 }: IconProps) {
  // Water bottle in its cage — the poster child for gear with its own mount.
  return (
    <svg {...iconProps(size)} className={className}>
      <path d="M10 4h4v2.5c1 .8 1.5 1.8 1.5 3V18a2 2 0 0 1-2 2h-3a2 2 0 0 1-2-2V9.5c0-1.2.5-2.2 1.5-3z" />
      <path d="M8.5 12h7" opacity={0.4} />
      <path d="M8.5 15.5h7" opacity={0.4} />
    </svg>
  )
}

export function OtherIcon({ className, size = 20 }: IconProps) {
  return (
    <svg {...iconProps(size)} className={className}>
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <circle cx="12" cy="12" r="2" fill="currentColor" opacity={0.4} />
    </svg>
  )
}

export const itemCategoryIcons: Record<ItemCategory, ComponentType<IconProps>> = {
  clothes: ClothesIcon,
  sleep: SleepIcon,
  tech: TechIcon,
  repair: RepairIcon,
  hygiene: HygieneIcon,
  food: FoodIcon,
  docs: DocsIcon,
  mounted: MountedIcon,
  other: OtherIcon,
}
