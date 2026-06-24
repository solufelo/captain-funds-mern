import type { Campaign, Donation } from '../interfaces'

const USERS_KEY = 'cf_users'
const CAMPAIGNS_KEY = 'cf_campaigns'
const DONATIONS_KEY = 'cf_donations'
const SIM_KEY = 'cf_sim_running'

export interface DemoUser {
  _id: string
  name: string
  email: string
  isAdmin: boolean
  isActive: boolean
  passwordHash: string
}

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    return raw ? (JSON.parse(raw) as T) : fallback
  } catch {
    return fallback
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value))
}

async function hashPassword(password: string) {
  const data = new TextEncoder().encode(password)
  const digest = await crypto.subtle.digest('SHA-256', data)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function seedCampaigns(): Campaign[] {
  return [
    {
      _id: 'camp-1',
      title: 'Help for Education',
      description:
        'Supporting underprivileged children with educational resources and school supplies.',
      organizer: 'Education Foundation',
      image: '',
      EventTargetAmount: 10000,
      EventCurrentAmount: 2500,
      status: 'active',
      EventCategory: 'Education',
      location: 'New York, NY',
      endDate: new Date('2026-12-01'),
      isActive: true,
      isApproved: true,
      isFeatured: true,
    },
    {
      _id: 'camp-2',
      title: 'Medical Emergency Fund',
      description: 'Emergency medical assistance for community members in urgent need.',
      organizer: 'Community Health Center',
      image: '',
      EventTargetAmount: 5000,
      EventCurrentAmount: 1200,
      status: 'active',
      EventCategory: 'Healthcare',
      location: 'Los Angeles, CA',
      endDate: new Date('2026-11-15'),
      isActive: true,
      isApproved: true,
    },
    {
      _id: 'camp-3',
      title: 'Community Development',
      description: 'Infrastructure projects for local neighborhoods.',
      organizer: 'City Development Board',
      image: '',
      EventTargetAmount: 15000,
      EventCurrentAmount: 8750,
      status: 'active',
      EventCategory: 'Community',
      location: 'Chicago, IL',
      endDate: new Date('2026-10-30'),
      isActive: true,
      isApproved: true,
      isFeatured: true,
    },
  ]
}

export async function ensureDemoSeeded() {
  let users = read<DemoUser[]>(USERS_KEY, [])
  if (users.length === 0) {
    users = [
      {
        _id: 'user-demo',
        name: 'Demo User',
        email: 'demo@captainfunds.app',
        isAdmin: false,
        isActive: true,
        passwordHash: await hashPassword('demo123'),
      },
      {
        _id: 'user-admin',
        name: 'Admin User',
        email: 'admin@captainfunds.app',
        isAdmin: true,
        isActive: true,
        passwordHash: await hashPassword('admin123'),
      },
    ]
    write(USERS_KEY, users)
  }

  if (!localStorage.getItem(CAMPAIGNS_KEY)) {
    write(CAMPAIGNS_KEY, seedCampaigns())
  }
  if (!localStorage.getItem(DONATIONS_KEY)) {
    write(DONATIONS_KEY, [] as Donation[])
  }
}

export async function demoLogin(email: string, password: string) {
  await ensureDemoSeeded()
  const users = read<DemoUser[]>(USERS_KEY, [])
  const hash = await hashPassword(password)
  const user = users.find((u) => u.email === email.trim().toLowerCase() && u.passwordHash === hash)
  if (!user) throw new Error('Invalid email or password')
  if (!user.isActive) throw new Error('Account is inactive')

  const publicUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    isAdmin: user.isAdmin,
    isActive: user.isActive,
  }
  const token = `demo-${user._id}`
  return { message: 'Login successful', token, user: publicUser }
}

export async function demoRegister(name: string, email: string, password: string) {
  await ensureDemoSeeded()
  const users = read<DemoUser[]>(USERS_KEY, [])
  const emailNorm = email.trim().toLowerCase()
  if (users.some((u) => u.email === emailNorm)) {
    throw new Error('Email already registered')
  }
  const user: DemoUser = {
    _id: `user-${crypto.randomUUID()}`,
    name: name.trim(),
    email: emailNorm,
    isAdmin: false,
    isActive: true,
    passwordHash: await hashPassword(password),
  }
  users.push(user)
  write(USERS_KEY, users)
  return { message: 'User created successfully' }
}

export function demoGetCampaigns(): Campaign[] {
  return read<Campaign[]>(CAMPAIGNS_KEY, seedCampaigns()).filter((c) => c.isActive !== false)
}

export function demoGetCampaignById(id: string): Campaign | undefined {
  return demoGetCampaigns().find((c) => c._id === id)
}

export function demoDonate(input: {
  campaignId: string
  amount: number
  message?: string
  isAnonymous: boolean
  paymentMethod: string
  donor: { id: string; name: string; email: string }
}): Donation {
  const campaigns = read<Campaign[]>(CAMPAIGNS_KEY, seedCampaigns())
  const idx = campaigns.findIndex((c) => c._id === input.campaignId)
  if (idx < 0) throw new Error('Campaign not found')

  const campaign = campaigns[idx]
  campaign.EventCurrentAmount += input.amount
  campaigns[idx] = campaign
  write(CAMPAIGNS_KEY, campaigns)

  const donation: Donation = {
    _id: `don-${crypto.randomUUID()}`,
    campaignId: campaign._id!,
    campaignTitle: campaign.title,
    donorId: input.donor.id,
    donorName: input.isAnonymous ? 'Anonymous' : input.donor.name,
    donorEmail: input.donor.email,
    amount: input.amount,
    message: input.message,
    isAnonymous: input.isAnonymous,
    paymentMethod: input.paymentMethod as Donation['paymentMethod'],
    paymentStatus: 'completed',
    transactionId: `demo_tx_${Date.now()}`,
    processingFee: 0,
    netAmount: input.amount,
    createdAt: new Date(),
  }

  const donations = read<Donation[]>(DONATIONS_KEY, [])
  donations.unshift(donation)
  write(DONATIONS_KEY, donations)

  window.dispatchEvent(
    new CustomEvent('new-donation', {
      detail: {
        amount: input.amount,
        campaignTitle: campaign.title,
        donationType: 'demo',
      },
    }),
  )

  return donation
}

export function demoGetUserDonations(userId: string): Donation[] {
  return read<Donation[]>(DONATIONS_KEY, []).filter((d) => d.donorId === userId)
}

export function demoGetAllDonations(): Donation[] {
  return read<Donation[]>(DONATIONS_KEY, [])
}

export function demoGetDonationStats() {
  const donations = demoGetAllDonations().filter((d) => d.paymentStatus === 'completed')
  const totalAmount = donations.reduce((s, d) => s + d.amount, 0)
  const byCampaign = new Map<string, { campaignId: string; campaignTitle: string; totalAmount: number; donationCount: number }>()

  donations.forEach((d) => {
    const cur = byCampaign.get(d.campaignId) || {
      campaignId: d.campaignId,
      campaignTitle: d.campaignTitle,
      totalAmount: 0,
      donationCount: 0,
    }
    cur.totalAmount += d.amount
    cur.donationCount += 1
    byCampaign.set(d.campaignId, cur)
  })

  return {
    totalDonations: donations.length,
    totalAmount,
    averageDonation: donations.length ? totalAmount / donations.length : 0,
    monthlyTotal: totalAmount,
    topCampaigns: [...byCampaign.values()].sort((a, b) => b.totalAmount - a.totalAmount).slice(0, 5),
  }
}

export function demoIsSimulationRunning(): boolean {
  return read<boolean>(SIM_KEY, false)
}

export function demoSetSimulationRunning(running: boolean) {
  write(SIM_KEY, running)
}
