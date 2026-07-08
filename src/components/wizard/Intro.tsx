interface IntroProps {
  onStart: () => void
}

export function Intro({ onStart }: IntroProps) {
  return (
    <div className="min-h-screen bg-base-200 bg-topo grain flex items-center justify-center px-6 py-12">
      <div className="max-w-xl text-center space-y-6">
        <p className="label-caps text-primary">Bike Adventure Series</p>
        <h1 className="heading-xl text-base-content text-4xl sm:text-5xl leading-tight">
          Not sure what to pack?
        </h1>
        <p className="text-body text-base-content/70 text-lg max-w-md mx-auto">
          Tell us your bike and your trip — we'll show you what to bring, what to leave home,
          and how to spread the load so your bike still handles well. Takes about 2 minutes.
        </p>
        <div className="pt-2">
          <button onClick={onStart} className="btn btn-primary btn-lg gap-1">
            Start packing →
          </button>
        </div>
        <p className="text-small text-base-content/50">
          Free · No sign-up · Nothing to install
        </p>
      </div>
    </div>
  )
}
