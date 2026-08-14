import { useRef, useEffect } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { Step1Bike } from './Step1Bike'
import { Step2Event } from './Step2Event'
import { Step3Bags } from './Step3Bags'
import { Step4Gear } from './Step4Gear'
import { Step5PackBags } from './Step5PackBags'
import { Step6Review } from './Step6Review'
import { Step7Share } from './Step7Share'
import gsap from 'gsap'

const STEPS = [
  { num: 1, label: "Ride" },
  { num: 2, label: "Trip" },
  { num: 3, label: "Bags" },
  { num: 4, label: "Gear" },
  { num: 5, label: "Pack" },
  { num: 6, label: "Review" },
  { num: 7, label: "Share" },
]

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1: return <Step1Bike />
    case 2: return <Step2Event />
    case 3: return <Step3Bags />
    case 4: return <Step4Gear />
    case 5: return <Step5PackBags />
    case 6: return <Step6Review />
    case 7: return <Step7Share />
    default: return null
  }
}

export function WizardLayout() {
  const { state, nextStep, prevStep, goToStep, canProceed } = useWizard()
  const contentRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(state.step)

  // Animate step transitions
  useEffect(() => {
    if (!contentRef.current) return
    const direction = state.step > prevStepRef.current ? 1 : -1
    prevStepRef.current = state.step

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, x: direction * 40 },
      { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }
    )
  }, [state.step])

  return (
    <div className="min-h-screen bg-base-200 bg-topo grain">
      {/* Header */}
      <header className="bg-base-100/80 backdrop-blur-sm border-b border-base-300 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="heading-md text-base-content">Bike Load Simulator</h1>
            <p className="text-xs text-base-content/40 mt-0.5">by Bike Adventure Series</p>
          </div>

          {/* Timeline breadcrumb */}
          <nav className="hidden md:flex items-center gap-4 lg:gap-6">
            {STEPS.map(({ num, label }) => {
              const isCurrent = num === state.step
              const isPast = num < state.step
              const canNav = num < state.step

              return (
                <button
                  key={num}
                  onClick={() => canNav && goToStep(num)}
                  disabled={!canNav && !isCurrent}
                  className={`timeline-step flex items-center gap-2 transition-all duration-300 ${
                    isPast ? 'is-past' : ''
                  }`}
                >
                  <span className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300
                    ${isCurrent
                      ? 'bg-primary text-primary-content scale-110 shadow-lg shadow-primary/20'
                      : isPast
                        ? 'bg-primary/15 text-primary cursor-pointer hover:bg-primary/25'
                        : 'bg-base-300 text-base-content/30'
                    }
                  `}>
                    {isPast ? '✓' : num}
                  </span>
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isCurrent ? 'text-base-content'
                    : isPast ? 'text-primary cursor-pointer'
                    : 'text-base-content/30'
                  }`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Mobile step indicator */}
          <div className="md:hidden flex items-center gap-1.5">
            {STEPS.map(({ num }) => (
              <div
                key={num}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  num === state.step ? 'w-6 bg-primary' : num < state.step ? 'w-1.5 bg-primary/40' : 'w-1.5 bg-base-300'
                }`}
              />
            ))}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-5xl mx-auto px-6 py-10">
        <div ref={contentRef} className="step-content">
          <StepContent step={state.step} />
        </div>

        {/* Navigation — integrated into content flow */}
        <div className="mt-12 flex justify-between items-center">
          <button
            onClick={prevStep}
            disabled={state.step === 1}
            className="btn btn-ghost btn-sm gap-1 disabled:opacity-0"
          >
            ← Back
          </button>

          {state.step < 7 && (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn btn-primary gap-1"
            >
              {state.step === 5 ? 'Review list' : 'Continue'} →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
