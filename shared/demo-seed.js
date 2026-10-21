// Fictional demo data, shared by the API seeder (server/seed) and the
// browser-only demo store (client/src/lib/demoStore.ts).
//
// Every organisation, place, person and donation below is invented. Places are
// deliberately made-up neighbourhood names, and the UI badges every seeded
// campaign as "Fictional demo". Totals are never typed in by hand: each
// campaign's raised amount is the sum of the seeded donation records, so the
// organiser dashboard and admin analytics always agree with each other.

export const CATEGORIES = [
  "Education",
  "Healthcare",
  "Environment",
  "Community Development",
  "Emergency Relief",
  "Arts & Culture",
  "Sports & Recreation",
  "Technology",
  "Animal Welfare",
  "Human Rights",
  "Other",
];

export const DEMO_ACCOUNTS = {
  organiser: { email: "demo@captainfunds.app", password: "demo123", name: "Demo Organiser" },
  admin: { email: "admin@captainfunds.app", password: "admin123", name: "Demo Admin" },
};

const DAY = 24 * 60 * 60 * 1000;

const USERS = [
  { key: "user-demo", ...DEMO_ACCOUNTS.organiser, isAdmin: false },
  { key: "user-admin", ...DEMO_ACCOUNTS.admin, isAdmin: true },
  // Second fictional organiser so the admin view has more than one owner.
  // No usable password: it exists only as campaign owner data.
  { key: "user-mira", name: "Mira Okonjo (fictional)", email: "mira@demo.captainfunds.app", password: null, isAdmin: false },
];

const CAMPAIGNS = [
  {
    key: "camp-harbourline-fridge",
    owner: "user-demo",
    title: "Harbourline Community Fridge",
    organizer: "Harbourline Neighbours Collective",
    category: "Community Development",
    location: "Harbourline (fictional)",
    target: 12000,
    fundedRatio: 0.62,
    createdDaysAgo: 38,
    endsInDays: 24,
    featured: true,
    description:
      "A solar-powered, always-open fridge and pantry outside the Harbourline rec centre. Neighbours drop off what they can and take what they need, no questions asked.\n\nThe goal covers a commercial-grade fridge, a weatherproof shelter, a year of electricity and food-safety training for twelve volunteer stewards. Any surplus goes into a restock fund for winter months, when donations usually dip.",
  },
  {
    key: "camp-lantern-robotics",
    owner: "user-demo",
    title: "Lantern Street Youth Robotics Club",
    organizer: "Lantern Street Makers",
    category: "Education",
    location: "Lantern Street (fictional)",
    target: 8500,
    fundedRatio: 0.81,
    createdDaysAgo: 52,
    endsInDays: 11,
    featured: true,
    description:
      "Thirty teenagers, two donated laptops and a borrowed classroom. We want to enter this season's regional robotics league with kits the whole club can share.\n\nFunds buy four competition kits, spare motors and sensors, travel to three tournaments and pizza for every Saturday build night.",
  },
  {
    key: "camp-cedar-kennels",
    owner: "user-mira",
    title: "Cedar Hollow Rescue: Winter Kennels",
    organizer: "Cedar Hollow Animal Rescue",
    category: "Animal Welfare",
    location: "Cedar Hollow (fictional)",
    target: 20000,
    fundedRatio: 0.44,
    createdDaysAgo: 29,
    endsInDays: 40,
    featured: true,
    description:
      "Our outdoor runs freeze from December to March. Insulated, heated kennels would let us take in twelve more dogs through the winter instead of turning them away.\n\nThe build is quoted by a local contractor; we will post photos of every stage on this page as it goes up.",
  },
  {
    key: "camp-saltmarsh-cleanup",
    owner: "user-mira",
    title: "Saltmarsh Creek Spring Cleanup",
    organizer: "Friends of Saltmarsh Creek",
    category: "Environment",
    location: "Saltmarsh Creek (fictional)",
    target: 4000,
    fundedRatio: 1.08,
    createdDaysAgo: 60,
    endsInDays: 6,
    featured: false,
    description:
      "One weekend, two kilometres of creek bank, as many volunteers as we can feed. Money covers waders, grabbers, bins, a dumpster rental and native plantings for the eroded stretch by the footbridge.",
  },
  {
    key: "camp-quiet-hours-van",
    owner: "user-demo",
    title: "The Quiet Hours Library Van",
    organizer: "Quiet Hours Reading Project",
    category: "Arts & Culture",
    location: "Northbank (fictional)",
    target: 15000,
    fundedRatio: 0.27,
    createdDaysAgo: 17,
    endsInDays: 58,
    featured: false,
    description:
      "A converted cargo van with shelves, a reading nook and a ramp, parked outside seniors' residences and after-school programs on a weekly loop. The goal covers the van conversion, the first 1,500 books and a year of insurance.",
  },
  {
    key: "camp-northbank-clinic",
    owner: "user-mira",
    title: "Northbank Free Clinic: Exam Room Refit",
    organizer: "Northbank Community Health (fictional)",
    category: "Healthcare",
    location: "Northbank (fictional)",
    target: 25000,
    fundedRatio: 0.36,
    createdDaysAgo: 22,
    endsInDays: 45,
    featured: false,
    description:
      "Our volunteer clinic sees walk-in patients four evenings a week out of a single exam room. A second, fully equipped room would cut the wait in half. Funds cover an exam table, diagnostic kit, privacy partitions and a hand-wash station.",
  },
  {
    key: "camp-fernway-mural",
    owner: "user-demo",
    title: "Fernway Underpass Mural Walk",
    organizer: "Fernway Arts Collective",
    category: "Arts & Culture",
    location: "Fernway (fictional)",
    target: 6000,
    fundedRatio: 0,
    createdDaysAgo: 2,
    endsInDays: 60,
    featured: false,
    pending: true,
    description:
      "Six local artists, one grey concrete underpass. We want to turn the walk to Fernway station into a gallery, with lighting so it feels safe after dark. Awaiting review by a platform admin.",
  },
];

const FIRST = [
  "Amara", "Ben", "Chloe", "Dev", "Elena", "Farid", "Grace", "Hugo", "Isla", "Jonah",
  "Kiran", "Leah", "Mateo", "Nia", "Owen", "Priya", "Quinn", "Rosa", "Sami", "Tara",
  "Uma", "Victor", "Wren", "Yusuf", "Zoe",
];
const LAST_INITIAL = "ABCDEFGHJKLMNOPRSTW";
const MESSAGES = [
  "Happy to chip in.",
  "Good luck with this!",
  "Saw the flyer at the library.",
  "From one neighbour to another.",
  "Hope you hit the goal.",
  "Glad this exists.",
];
// Typical small-gift distribution: lots of $20-$50, a few large ones.
const AMOUNTS = [10, 15, 20, 20, 25, 25, 25, 30, 40, 50, 50, 50, 60, 75, 100, 100, 120, 150, 200, 250, 500];

function prng(seed) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

function hash(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619);
  return h >>> 0;
}

/**
 * Builds the full fictional dataset relative to `now`, deterministically.
 * Returns plain objects keyed by string ids; callers map them onto their
 * own storage (Mongo ObjectIds on the server, localStorage in the browser).
 */
export function buildDemoSeed(now = Date.now()) {
  const users = USERS.map((u) => ({ ...u }));

  const campaigns = [];
  const donations = [];

  for (const c of CAMPAIGNS) {
    const rand = prng(hash(c.key));
    const createdAt = new Date(now - c.createdDaysAgo * DAY);
    const goalRaised = Math.round(c.target * c.fundedRatio);
    let raised = 0;
    let i = 0;
    const spanMs = c.createdDaysAgo * DAY;

    while (raised < goalRaised) {
      let amount = AMOUNTS[Math.floor(rand() * AMOUNTS.length)];
      if (raised + amount > goalRaised && goalRaised - raised >= 5) amount = goalRaised - raised;
      raised += amount;
      // Skew toward recent days so the activity chart has a realistic tail.
      const ageMs = Math.pow(rand(), 1.6) * spanMs;
      const isAnonymous = rand() < 0.18;
      const first = FIRST[Math.floor(rand() * FIRST.length)];
      const last = LAST_INITIAL[Math.floor(rand() * LAST_INITIAL.length)];
      donations.push({
        key: `${c.key}-don-${i++}`,
        campaignKey: c.key,
        donorName: isAnonymous ? "Anonymous" : `${first} ${last}.`,
        amount,
        message: rand() < 0.28 ? MESSAGES[Math.floor(rand() * MESSAGES.length)] : "",
        isAnonymous,
        createdAt: new Date(now - ageMs),
      });
    }

    campaigns.push({
      key: c.key,
      owner: c.owner,
      title: c.title,
      description: c.description,
      organizer: c.organizer,
      image: "",
      EventTargetAmount: c.target,
      EventCurrentAmount: raised,
      donationCount: i,
      EventCategory: c.category,
      location: c.location,
      endDate: new Date(now + c.endsInDays * DAY),
      status: "active",
      isActive: true,
      isApproved: !c.pending,
      isRejected: false,
      isFeatured: c.featured,
      isDeleted: false,
      isDemo: true,
      createdAt,
      updatedAt: createdAt,
    });
  }

  donations.sort((a, b) => b.createdAt - a.createdAt);
  return { users, campaigns, donations };
}
