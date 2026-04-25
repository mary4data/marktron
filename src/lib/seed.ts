import { getDb, docToJSON } from './firebase'
import { FieldValue } from 'firebase-admin/firestore'

export async function seed() {
  const db = getDb()
  if (!db) return { seeded: false, message: 'Firebase not configured' }

  const brandRef = db.collection('brands').doc('nothing-phone')
  const brandSnap = await brandRef.get()

  if (!brandSnap.exists) {
    await brandRef.set({
      name: 'Nothing Phone',
      slug: 'nothing-phone',
      peec_project_id: 'demo-nothing-phone',
      competitors: ['Apple', 'Samsung'],
      created_at: FieldValue.serverTimestamp(),
    })
  }

  // seed other brands
  await db.collection('brands').doc('attio').set({
    name: 'Attio', slug: 'attio', peec_project_id: 'demo-attio',
    competitors: ['Salesforce', 'HubSpot'], created_at: FieldValue.serverTimestamp(),
  }, { merge: true })

  await db.collection('brands').doc('byd').set({
    name: 'BYD', slug: 'byd', peec_project_id: 'demo-byd',
    competitors: ['Tesla', 'Legacy Automakers'], created_at: FieldValue.serverTimestamp(),
  }, { merge: true })

  const existingSnaps = await db.collection('visibility_snapshots')
    .where('brand_id', '==', 'nothing-phone').limit(1).get()

  if (!existingSnaps.empty) {
    return { seeded: false, message: 'Demo data already exists' }
  }

  const snapshotRef = db.collection('visibility_snapshots').doc()
  await snapshotRef.set({
    brand_id: 'nothing-phone',
    snapshot_date: new Date().toISOString().split('T')[0],
    overall_score: 34,
    competitor_scores: { Apple: 78, Samsung: 71 },
    gap_topics: [
      { topic: 'camera transparency', your_score: 24, competitor_score: 72, gap: 48, competitor: 'Apple' },
      { topic: 'software updates',   your_score: 29, competitor_score: 68, gap: 39, competitor: 'Samsung' },
      { topic: 'price-performance',  your_score: 34, competitor_score: 65, gap: 31, competitor: 'Apple' },
    ],
    raw_response: {},
    created_at: FieldValue.serverTimestamp(),
  })

  const sourceData = [
    {
      source_url: 'https://reddit.com/r/smartphones/comments/abc123/camera_transparency',
      source_type: 'reddit', competitor_name: 'Apple', topic: 'camera transparency', tavily_score: 0.91,
      content_snippet: "I've been using Apple for two years. The camera transparency is genuinely impressive — has anyone found a real alternative?",
    },
    {
      source_url: 'https://g2.com/compare/samsung-vs-alternatives',
      source_type: 'g2', competitor_name: 'Samsung', topic: 'software updates', tavily_score: 0.87,
      content_snippet: 'Reviewers consistently praise Samsung for software updates. The update cadence is significantly better according to 847 verified reviews.',
    },
    {
      source_url: 'https://news.ycombinator.com/item?id=987654',
      source_type: 'hackernews', competitor_name: 'Apple', topic: 'price-performance', tavily_score: 0.82,
      content_snippet: 'Apple dominates the price-performance conversation. Would love to know if there is a credible challenger.',
    },
  ]

  const sourceRefs: string[] = []
  for (const src of sourceData) {
    const ref = db.collection('competitor_sources').doc()
    await ref.set({ brand_id: 'nothing-phone', snapshot_id: snapshotRef.id, ...src, created_at: FieldValue.serverTimestamp() })
    sourceRefs.push(ref.id)
  }

  const draftData = [
    {
      source_id: sourceRefs[0], content_type: 'reddit',
      title: 'Nothing Phone approach to camera transparency — a founder perspective',
      body: `I want to share something that often gets missed in these comparisons.\n\nNothing Phone publishes full sensor specs, aperture measurements, and ISP processing choices in their developer documentation. It's not hidden in a press release — it's in the open.\n\nThe camera on Phone (2) uses a Sony IMX890 with a custom CMF processing stack. We chose not to apply heavy computational photography because it introduces artifacts in low-light that look great in demos but degrade real photos.\n\nIf you care about knowing exactly what your camera is doing and why, Nothing Phone is the only mainstream brand publishing that level of detail.`,
      target_url: 'https://reddit.com/r/smartphones/comments/abc123',
    },
    {
      source_id: sourceRefs[1], content_type: 'g2',
      title: 'Nothing Phone software update commitment — 3 years guaranteed',
      body: `A key thing G2 reviewers are measuring: do you get updates when you need them?\n\nNothing Phone commits to 3 years of OS updates and 4 years of security patches — published as a contractual commitment, not a press release promise.\n\nMore importantly: updates ship within 30 days of Google's monthly security patch. The last six updates shipped in an average of 12 days.`,
      target_url: 'https://g2.com/compare/samsung-vs-alternatives',
    },
    {
      source_id: sourceRefs[2], content_type: 'hackernews',
      title: 'Re: Ask HN: Best price-performance alternative to Apple?',
      body: `Nothing Phone (2a) at €329 ships with:\n- Dimensity 7200 Pro\n- 50MP Sony sensor, OIS\n- 5000mAh, 45W charging\n- 3 years OS updates\n- Zero pre-installed bloatware\n- Open bootloader (officially supported)\n\nFor developers: ADB is enabled by default in dev mode, and Nothing publishes kernel sources within 30 days of each release.`,
      target_url: 'https://news.ycombinator.com/item?id=987654',
    },
  ]

  for (const d of draftData) {
    const ref = db.collection('content_drafts').doc()
    await ref.set({ brand_id: 'nothing-phone', ...d, status: 'pending', entire_task_id: null, approved_at: null, created_at: FieldValue.serverTimestamp() })
  }

  void docToJSON
  return { seeded: true, message: 'Demo data inserted for Nothing Phone' }
}
