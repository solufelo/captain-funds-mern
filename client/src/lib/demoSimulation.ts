import { demoGetCampaigns, demoSetSimulationRunning } from './demoStore'

let timer: ReturnType<typeof setInterval> | null = null

const donors = ['Alex', 'Jordan', 'Sam', 'Riley', 'Casey', 'Morgan']
const amounts = [25, 50, 75, 100, 150, 200]

export function startDemoSimulation() {
  if (timer) return
  demoSetSimulationRunning(true)

  timer = setInterval(() => {
    const campaigns = demoGetCampaigns()
    if (!campaigns.length) return

    const campaign = campaigns[Math.floor(Math.random() * campaigns.length)]
    const amount = amounts[Math.floor(Math.random() * amounts.length)]
    const donor = donors[Math.floor(Math.random() * donors.length)]

    window.dispatchEvent(
      new CustomEvent('new-donation', {
        detail: {
          amount,
          campaignTitle: campaign.title,
          donationType: 'simulated',
          donor,
        },
      }),
    )

    window.dispatchEvent(
      new CustomEvent('live-stats-update', {
        detail: {
          totalCampaigns: campaigns.length,
          totalDonations: Math.floor(Math.random() * 500) + 100,
          totalAmountRaised: campaigns.reduce((s, c) => s + c.EventCurrentAmount, 0),
          activeCampaigns: campaigns.filter((c) => c.isActive).length,
          averageDonation: amount,
        },
      }),
    )
  }, 4000)
}

export function stopDemoSimulation() {
  if (timer) {
    clearInterval(timer)
    timer = null
  }
  demoSetSimulationRunning(false)
}

export function getDemoSimulationStatus() {
  return { running: Boolean(timer), mode: 'demo' as const }
}
