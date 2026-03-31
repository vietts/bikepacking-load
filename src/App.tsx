import { WizardProvider } from './hooks/useWizard'
import { WizardLayout } from './components/wizard/WizardLayout'
import './index.css'

function App() {
  return (
    <WizardProvider>
      <WizardLayout />
    </WizardProvider>
  )
}

export default App
