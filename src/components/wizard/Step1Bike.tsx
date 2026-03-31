import { useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import bikesData from '../../data/bikes.json'
import type { BikeSpec, BikeSize } from '../../types'
import { bikeIcons } from '../../assets/bikes/BikeIcons'
import gsap from 'gsap'

const bikes = bikesData as BikeSpec[]
const sizes: BikeSize[] = ['XS', 'S', 'M', 'L', 'XL']

export function Step1Bike() {
  const { state, dispatch } = useWizard()
  const selectedType = state.bike?.type ?? null
  const selectedSize = state.bike?.size ?? null
  const cardsRef = useRef<HTMLDivElement>(null)
  const sizeRef = useRef<HTMLDivElement>(null)

  // Staggered card entrance
  useEffect(() => {
    if (!cardsRef.current) return
    const cards = cardsRef.current.children
    gsap.fromTo(cards,
      { opacity: 0, y: 20, scale: 0.97 },
      { opacity: 1, y: 0, scale: 1, duration: 0.5, stagger: 0.08, ease: 'power3.out' }
    )
  }, [])

  // Size selector entrance
  useEffect(() => {
    if (!sizeRef.current || !selectedType) return
    gsap.fromTo(sizeRef.current,
      { opacity: 0, y: 12 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }
    )
  }, [selectedType])

  function selectBike(bikeSpec: BikeSpec, size: BikeSize) {
    dispatch({
      type: 'SET_BIKE',
      bike: {
        type: bikeSpec.type,
        size,
        weight: bikeSpec.defaultWeight,
        frameBagMaxVolume: bikeSpec.frameBagMaxVolume[size],
      },
    })
  }

  function handleTypeSelect(bikeSpec: BikeSpec) {
    selectBike(bikeSpec, selectedSize ?? 'M')
  }

  function handleSizeSelect(size: BikeSize) {
    const bikeSpec = bikes.find(b => b.type === selectedType)
    if (bikeSpec) selectBike(bikeSpec, size)
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="label-caps text-primary mb-2">Step 1</p>
        <h2 className="heading-xl text-base-content">What's your ride?</h2>
        <p className="text-body text-base-content/60 mt-3 max-w-lg">
          Pick your bike type and size. This helps us figure out how much space you have for bags.
        </p>
      </div>

      <div ref={cardsRef} className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {bikes.map(bike => (
          <button
            key={bike.type}
            onClick={() => handleTypeSelect(bike)}
            className={`
              card card-border p-5 text-left transition-all cursor-pointer card-hover
              ${selectedType === bike.type ? 'card-selected' : 'bg-base-100 hover:bg-base-100'}
            `}
          >
            {(() => { const Icon = bikeIcons[bike.type]; return <Icon className="text-base-content/60 mb-3" /> })()}
            <div className="heading-md text-base-content">{bike.label}</div>
            <div className="text-small text-base-content/50 mt-1.5 line-clamp-2">{bike.description}</div>
            <div className="text-small text-base-content/30 mt-3 font-medium">~{bike.defaultWeight} kg</div>
          </button>
        ))}
      </div>

      {selectedType && (
        <div ref={sizeRef} className="space-y-3">
          <label className="label-caps text-base-content/50">Frame size</label>
          <div className="join w-full">
            {sizes.map(size => (
              <button
                key={size}
                onClick={() => handleSizeSelect(size)}
                className={`join-item btn flex-1 ${selectedSize === size ? 'btn-primary' : 'btn-ghost bg-base-100'}`}
              >
                {size}
              </button>
            ))}
          </div>

          {state.bike && (
            <p className="text-small text-base-content/40">
              Frame bag max volume for {selectedType} {selectedSize}: ~{state.bike.frameBagMaxVolume}L
            </p>
          )}
        </div>
      )}

      <div className="bg-primary/8 border border-primary/15 rounded-xl p-5">
        <p className="text-body text-primary/80">
          💡 <strong className="text-primary">Tip:</strong> Most BAS riders use a gravel or road bike. Don't overthink it — any bike works for bikepacking!
        </p>
      </div>
    </div>
  )
}
