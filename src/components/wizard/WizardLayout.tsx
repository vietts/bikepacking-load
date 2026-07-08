import { useRef, useEffect, useState } from 'react'
import { useWizard } from '../../hooks/useWizard'
import { Step1Bike } from './Step1Bike'
import { Step2Event } from './Step2Event'
import { Step3Bags } from './Step3Bags'
import { Step4Pack } from './Step4Pack'
import { Step5Results } from './Step5Results'
import { Step6Share } from './Step6Share'
import { Intro } from './Intro'
import { prefersReducedMotion } from '../../utils/motion'
import gsap from 'gsap'

const STEPS = [
  { num: 1, label: "Ride" },
  { num: 2, label: "Trip" },
  { num: 3, label: "Bags" },
  { num: 4, label: "Pack" },
  { num: 5, label: "Results" },
  { num: 6, label: "Share" },
]

function StepContent({ step }: { step: number }) {
  switch (step) {
    case 1: return <Step1Bike />
    case 2: return <Step2Event />
    case 3: return <Step3Bags />
    case 4: return <Step4Pack />
    case 5: return <Step5Results />
    case 6: return <Step6Share />
    default: return null
  }
}

export function WizardLayout() {
  const { state, nextStep, prevStep, goToStep, canProceed, restoredFrom, dismissRestoreNotice, reset } = useWizard()
  const contentRef = useRef<HTMLDivElement>(null)
  const prevStepRef = useRef(state.step)

  // Show the intro only on a genuinely fresh start (no saved/shared setup).
  const [showIntro, setShowIntro] = useState(
    () => restoredFrom === null && state.step === 1 && state.bike === null
  )

  // Animate step transitions (skipped when the user asked for reduced motion)
  useEffect(() => {
    if (!contentRef.current) return
    const direction = state.step > prevStepRef.current ? 1 : -1
    prevStepRef.current = state.step

    if (prefersReducedMotion()) {
      gsap.set(contentRef.current, { opacity: 1, x: 0 })
      return
    }

    gsap.fromTo(
      contentRef.current,
      { opacity: 0, x: direction * 40 },
      { opacity: 1, x: 0, duration: 0.45, ease: 'power3.out' }
    )
  }, [state.step])

  if (showIntro) {
    return <Intro onStart={() => setShowIntro(false)} />
  }

  const currentLabel = STEPS.find(s => s.num === state.step)?.label ?? ''

  function handleReset() {
    reset()
    setShowIntro(true)
  }

  return (
    <div className="min-h-screen bg-base-200 bg-topo grain">
      {/* Header */}
      <header className="bg-base-100/80 backdrop-blur-sm border-b border-base-300 sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="heading-md text-base-content">Bike Load Simulator</h1>
            <p className="text-xs text-base-content/50 mt-0.5">by Bike Adventure Series</p>
          </div>

          {/* Timeline breadcrumb */}
          <nav className="hidden sm:flex items-center gap-6" aria-label="Progress">
            {STEPS.map(({ num, label }) => {
              const isCurrent = num === state.step
              const isPast = num < state.step
              const canNav = num < state.step

              return (
                <button
                  key={num}
                  onClick={() => canNav && goToStep(num)}
                  disabled={!canNav && !isCurrent}
                  aria-current={isCurrent ? 'step' : undefined}
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
                        : 'bg-base-300 text-base-content/40'
                    }
                  `}>
                    {isPast ? '✓' : num}
                  </span>
                  <span className={`text-xs font-medium transition-colors duration-300 ${
                    isCurrent ? 'text-base-content'
                    : isPast ? 'text-primary cursor-pointer'
                    : 'text-base-content/50'
                  }`}>
                    {label}
                  </span>
                </button>
              )
            })}
          </nav>

          {/* Mobile step indicator — current label + tappable progress dots */}
          <div className="sm:hidden flex flex-col items-end gap-1.5">
            <span className="text-xs font-medium text-base-content">
              Step {state.step} of {STEPS.length} · {currentLabel}
            </span>
            <div className="flex items-center gap-1.5">
              {STEPS.map(({ num, label }) => {
                const canNav = num < state.step
                return (
                  <button
                    key={num}
                    onClick={() => canNav && goToStep(num)}
                    disabled={!canNav}
                    aria-label={`Go to step ${num}: ${label}`}
                    aria-current={num === state.step ? 'step' : undefined}
                    className={`h-2.5 rounded-full transition-all duration-300 ${
                      num === state.step ? 'w-6 bg-primary' : num < state.step ? 'w-2.5 bg-primary/50 cursor-pointer' : 'w-2.5 bg-base-300'
                    }`}
                  />
                )
              })}
            </div>
          </div>
        </div>
      </header>

      {/* Restored-session notice */}
      {restoredFrom === 'storage' && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="max-w-5xl mx-auto px-6 py-2.5 flex items-center justify-between gap-3 text-sm">
            <span className="text-base-content/80">We picked up where you left off.</span>
            <div className="flex items-center gap-3 shrink-0">
              <button onClick={handleReset} className="font-semibold text-primary hover:underline">Start over</button>
              <button onClick={dismissRestoreNotice} aria-label="Dismiss" className="text-base-content/50 hover:text-base-content">✕</button>
            </div>
          </div>
        </div>
      )}

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

          {state.step < 6 && (
            <button
              onClick={nextStep}
              disabled={!canProceed()}
              className="btn btn-primary gap-1"
            >
              Continue →
            </button>
          )}
        </div>
      </main>
    </div>
  )
}
