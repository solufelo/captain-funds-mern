import { Alert } from 'antd'
import { isDemoMode } from '../lib/config'

export default function DemoBanner() {
  if (!isDemoMode()) return null

  return (
    <Alert
      type="info"
      showIcon
      banner
      message="Netlify demo mode"
      description="Data is stored in this browser. Try demo@captainfunds.app / demo123 or admin@captainfunds.app / admin123"
      className="rounded-none"
    />
  )
}
