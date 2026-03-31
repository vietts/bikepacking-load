const bikeProps = { width: 48, height: 48, viewBox: '0 0 48 48', fill: 'none', stroke: 'currentColor', strokeWidth: 1.5, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const }

export function RoadBikeIcon({ className }: { className?: string }) {
  return (
    <svg {...bikeProps} className={className}>
      {/* Wheels */}
      <circle cx="12" cy="32" r="8" opacity={0.3} />
      <circle cx="36" cy="32" r="8" opacity={0.3} />
      <circle cx="12" cy="32" r="1.5" fill="currentColor" />
      <circle cx="36" cy="32" r="1.5" fill="currentColor" />
      {/* Frame — aggressive geometry */}
      <path d="M12 32L22 18l14 14" strokeWidth={2} />
      <path d="M22 18l8 0" strokeWidth={2} />
      <path d="M30 18l6 14" strokeWidth={2} />
      {/* Handlebar — drop bars */}
      <path d="M30 18v-3c0-1 1-2 2-2h2" />
      <path d="M34 13c1 0 2 1 2 2v2" strokeWidth={1.2} />
      {/* Saddle */}
      <path d="M20 16h4" strokeWidth={2.5} strokeLinecap="round" />
      {/* Seat post */}
      <line x1="22" y1="18" x2="22" y2="16" />
    </svg>
  )
}

export function GravelBikeIcon({ className }: { className?: string }) {
  return (
    <svg {...bikeProps} className={className}>
      {/* Wheels — slightly thicker tires */}
      <circle cx="12" cy="32" r="8" opacity={0.3} strokeWidth={2} />
      <circle cx="36" cy="32" r="8" opacity={0.3} strokeWidth={2} />
      <circle cx="12" cy="32" r="1.5" fill="currentColor" />
      <circle cx="36" cy="32" r="1.5" fill="currentColor" />
      {/* Frame — relaxed geometry */}
      <path d="M12 32L21 17l15 15" strokeWidth={2} />
      <path d="M21 17l9 1" strokeWidth={2} />
      <path d="M30 18l6 14" strokeWidth={2} />
      {/* Handlebar — flared drops */}
      <path d="M30 18v-3c0-1 0.5-2 2-2h2" />
      <path d="M34 13c1.5 0.5 2.5 1.5 2 3" strokeWidth={1.2} />
      {/* Saddle */}
      <path d="M19 15h4" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="21" y1="17" x2="21" y2="15" />
      {/* Bag mount dots */}
      <circle cx="18" cy="24" r="0.8" fill="currentColor" opacity={0.4} />
      <circle cx="26" cy="24" r="0.8" fill="currentColor" opacity={0.4} />
      <circle cx="12" cy="24" r="0.8" fill="currentColor" opacity={0.4} />
    </svg>
  )
}

export function TouringBikeIcon({ className }: { className?: string }) {
  return (
    <svg {...bikeProps} className={className}>
      {/* Wheels */}
      <circle cx="12" cy="32" r="8" opacity={0.3} />
      <circle cx="36" cy="32" r="8" opacity={0.3} />
      <circle cx="12" cy="32" r="1.5" fill="currentColor" />
      <circle cx="36" cy="32" r="1.5" fill="currentColor" />
      {/* Frame — upright */}
      <path d="M12 32L20 18l16 14" strokeWidth={2} />
      <path d="M20 18l8 2" strokeWidth={2} />
      <path d="M28 20l8 12" strokeWidth={2} />
      {/* Handlebar — flat */}
      <path d="M28 17h8" strokeWidth={2} />
      <line x1="28" y1="20" x2="28" y2="17" />
      {/* Saddle */}
      <path d="M18 15h4" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="20" y1="18" x2="20" y2="15" />
      {/* Rear rack */}
      <path d="M36 24h-6v8h6" strokeWidth={1.2} opacity={0.5} />
      {/* Front rack */}
      <path d="M8 26h8v6H8" strokeWidth={1.2} opacity={0.5} />
    </svg>
  )
}

export function MtbHardtailIcon({ className }: { className?: string }) {
  return (
    <svg {...bikeProps} className={className}>
      {/* Wheels — knobby */}
      <circle cx="12" cy="32" r="8" opacity={0.3} strokeWidth={2.5} />
      <circle cx="36" cy="32" r="8" opacity={0.3} strokeWidth={2.5} />
      <circle cx="12" cy="32" r="1.5" fill="currentColor" />
      <circle cx="36" cy="32" r="1.5" fill="currentColor" />
      {/* Frame */}
      <path d="M12 32L20 18l16 14" strokeWidth={2} />
      <path d="M20 18l8 2" strokeWidth={2} />
      <path d="M28 20l8 12" strokeWidth={2} />
      {/* Fork suspension */}
      <path d="M8 24l4 8" strokeWidth={2.5} opacity={0.5} />
      <path d="M10 24l2 8" strokeWidth={2.5} opacity={0.3} />
      {/* Handlebar — riser */}
      <path d="M26 15h10" strokeWidth={2} />
      <line x1="28" y1="20" x2="28" y2="15" />
      {/* Saddle */}
      <path d="M18 15h4" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="20" y1="18" x2="20" y2="15" />
    </svg>
  )
}

export function MtbFullIcon({ className }: { className?: string }) {
  return (
    <svg {...bikeProps} className={className}>
      {/* Wheels — knobby */}
      <circle cx="12" cy="32" r="8" opacity={0.3} strokeWidth={2.5} />
      <circle cx="36" cy="32" r="8" opacity={0.3} strokeWidth={2.5} />
      <circle cx="12" cy="32" r="1.5" fill="currentColor" />
      <circle cx="36" cy="32" r="1.5" fill="currentColor" />
      {/* Frame — with rear shock pivot */}
      <path d="M12 32L20 19l8 2" strokeWidth={2} />
      <path d="M28 21l8 11" strokeWidth={2} />
      <path d="M20 19l16 13" strokeWidth={1.5} opacity={0.3} />
      {/* Rear shock */}
      <path d="M24 24l4 2" strokeWidth={3} opacity={0.4} />
      {/* Fork suspension */}
      <path d="M8 24l4 8" strokeWidth={2.5} opacity={0.5} />
      <path d="M10 24l2 8" strokeWidth={2.5} opacity={0.3} />
      {/* Handlebar */}
      <path d="M26 16h10" strokeWidth={2} />
      <line x1="28" y1="21" x2="28" y2="16" />
      {/* Saddle */}
      <path d="M18 16h4" strokeWidth={2.5} strokeLinecap="round" />
      <line x1="20" y1="19" x2="20" y2="16" />
    </svg>
  )
}

export const bikeIcons = {
  road: RoadBikeIcon,
  gravel: GravelBikeIcon,
  touring: TouringBikeIcon,
  mtb_hardtail: MtbHardtailIcon,
  mtb_full: MtbFullIcon,
}
