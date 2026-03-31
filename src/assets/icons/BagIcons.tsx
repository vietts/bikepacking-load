const iconProps = { width: 28, height: 28, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function HandlebarIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M6 8h12c1.5 0 2 1 2 2v6c0 1-0.5 2-2 2H6c-1.5 0-2-1-2-2v-6c0-1 0.5-2 2-2z" />
      <path d="M4 11h16" opacity={0.4} />
      <path d="M8 8V6c0-0.5 0.5-1 1-1h6c0.5 0 1 0.5 1 1v2" />
      <circle cx="12" cy="13" r="1.5" fill="currentColor" opacity={0.3} />
    </svg>
  )
}

export function FrameIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M4 18L12 6l8 12H4z" />
      <path d="M8 18L12 10l4 8" opacity={0.3} />
      <line x1="12" y1="6" x2="12" y2="10" opacity={0.4} />
    </svg>
  )
}

export function SaddleIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M7 8c0-1 1-2 2.5-2h5c1.5 0 2.5 1 2.5 2v8c0 1.5-1 3-3 3h-4c-2 0-3-1.5-3-3V8z" />
      <path d="M7 11h10" opacity={0.4} />
      <path d="M10 8v-2" />
      <path d="M14 8v-2" />
      <ellipse cx="12" cy="14" rx="2" ry="2.5" fill="currentColor" opacity={0.15} />
    </svg>
  )
}

export function TopTubeIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="5" y="8" width="14" height="8" rx="2" />
      <line x1="5" y1="12" x2="19" y2="12" opacity={0.3} />
      <circle cx="9" cy="10" r="0.8" fill="currentColor" opacity={0.5} />
      <rect x="13" y="9.5" width="3" height="1" rx="0.5" fill="currentColor" opacity={0.3} />
    </svg>
  )
}

export function ForkIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <path d="M8 4v16" />
      <path d="M16 4v16" />
      <rect x="5" y="7" width="6" height="10" rx="1.5" opacity={0.4} />
      <rect x="13" y="7" width="6" height="10" rx="1.5" opacity={0.4} />
      <circle cx="8" cy="4" r="1" fill="currentColor" />
      <circle cx="16" cy="4" r="1" fill="currentColor" />
    </svg>
  )
}

export function RearRackIcon({ className }: { className?: string }) {
  return (
    <svg {...iconProps} className={className}>
      <rect x="3" y="6" width="8" height="12" rx="1.5" />
      <rect x="13" y="6" width="8" height="12" rx="1.5" />
      <line x1="11" y1="8" x2="13" y2="8" opacity={0.4} />
      <line x1="11" y1="12" x2="13" y2="12" opacity={0.4} />
      <line x1="11" y1="16" x2="13" y2="16" opacity={0.4} />
    </svg>
  )
}

export const bagIcons = {
  handlebar: HandlebarIcon,
  frame: FrameIcon,
  saddle: SaddleIcon,
  top_tube: TopTubeIcon,
  fork: ForkIcon,
  rear_rack: RearRackIcon,
}
