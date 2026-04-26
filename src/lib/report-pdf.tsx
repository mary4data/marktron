import { Document, Page, Text, View, StyleSheet, Svg, Path } from '@react-pdf/renderer'

function ArrowUp({ size = 14, color }: { size?: number; color: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M13 5.828V20h-2V5.828L5.929 10.9 4.515 9.485 12 2l7.485 7.485-1.414 1.414L13 5.828z" fill={color} />
    </Svg>
  )
}

const BLUE = '#3b82f6'
const DARK = '#18181b'
const MUTED = '#71717a'
const BORDER = '#e4e4e7'
const AMBER = '#f59e0b'
const GREEN = '#10b981'
const VIOLET = '#8b5cf6'
const BG_SECTION = '#fafafa'

const s = StyleSheet.create({
  page: { fontFamily: 'Helvetica', backgroundColor: '#ffffff', paddingHorizontal: 44, paddingVertical: 40 },

  // Header
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 28 },
  brandName: { fontSize: 20, fontFamily: 'Helvetica-Bold', color: DARK },
  tagline: { fontSize: 8, color: MUTED, marginTop: 3, letterSpacing: 1.5 },
  dateBlock: { alignItems: 'flex-end' },
  dateLabel: { fontSize: 7, color: MUTED, letterSpacing: 1, marginBottom: 2 },
  dateValue: { fontSize: 9, color: DARK, fontFamily: 'Helvetica-Bold' },

  divider: { height: 1, backgroundColor: BORDER, marginBottom: 22 },

  // Score hero
  heroRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 24 },
  scoreBubble: { width: 72, height: 72, borderRadius: 36, backgroundColor: BLUE, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 26, fontFamily: 'Helvetica-Bold', color: '#ffffff' },
  scorePct: { fontSize: 10, color: '#ffffff', opacity: 0.8 },
  scoreRight: { flex: 1 },
  scoreTitle: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: DARK, marginBottom: 6 },
  scoreBar: { height: 6, backgroundColor: BORDER, borderRadius: 3, marginBottom: 10 },
  scoreBarFill: { height: 6, backgroundColor: BLUE, borderRadius: 3 },
  compRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  compChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, backgroundColor: BG_SECTION, borderWidth: 1, borderColor: BORDER },
  compDot: { width: 6, height: 6, borderRadius: 3 },
  compText: { fontSize: 7, color: DARK },
  compScore: { fontSize: 7, color: MUTED, fontFamily: 'Helvetica-Bold' },

  // Section
  section: { marginBottom: 18 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  sectionDot: { width: 8, height: 8, borderRadius: 4 },
  sectionTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: DARK, letterSpacing: 1.2 },

  // Gap rows
  gapRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
  gapTopic: { fontSize: 9, color: DARK, flex: 1 },
  gapCompetitor: { fontSize: 8, color: MUTED, marginRight: 10 },
  gapBadge: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 3, backgroundColor: '#fffbeb', borderWidth: 1, borderColor: '#fde68a' },
  gapBadgeText: { fontSize: 8, color: AMBER, fontFamily: 'Helvetica-Bold' },

  // Action rows
  actionRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: BORDER },
  actionType: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 3, backgroundColor: '#eff6ff', borderWidth: 1, borderColor: '#bfdbfe' },
  actionTypeText: { fontSize: 7, color: BLUE, fontFamily: 'Helvetica-Bold' },
  actionTitle: { fontSize: 9, color: DARK, flex: 1 },

  // Forecast box
  forecastBox: { backgroundColor: '#f5f3ff', borderRadius: 8, padding: 16, borderWidth: 1, borderColor: '#ddd6fe', flexDirection: 'row', alignItems: 'center', gap: 20 },
  forecastLabel: { fontSize: 7, color: VIOLET, letterSpacing: 1, marginBottom: 3 },
  forecastArrow: { width: 22, height: 22 },
  forecastNums: { flex: 1 },
  forecastScores: { fontSize: 14, fontFamily: 'Helvetica-Bold', color: DARK },
  forecastSub: { fontSize: 8, color: MUTED, marginTop: 3 },
  forecastBoost: { alignItems: 'center' },
  boostNum: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: GREEN },
  boostLabel: { fontSize: 7, color: MUTED },

  // Footer
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 24, paddingTop: 14, borderTopWidth: 1, borderTopColor: BORDER },
  footerLeft: { fontSize: 7, color: MUTED },
  footerRight: { fontSize: 7, color: MUTED },

  emptyNote: { fontSize: 8, color: MUTED, fontStyle: 'italic', paddingVertical: 6 },
})

export interface ReportData {
  brandName: string
  date: string
  overallScore: number | null
  competitors: { name: string; color: string; score: number | null }[]
  gaps: { topic: string; competitor: string; gap: number }[]
  actions: { title: string; content_type: string }[]
  currentScore: number
  projectedScore: number
  contentBoostTotal: number
  approvedCount: number
}

function scoreBarWidth(score: number | null) {
  return `${Math.min(100, Math.max(0, score ?? 0))}%`
}

export function ReportDocument({ data }: { data: ReportData }) {
  const {
    brandName, date, overallScore, competitors, gaps, actions,
    currentScore, projectedScore, contentBoostTotal, approvedCount,
  } = data

  return (
    <Document>
      <Page size="A4" style={s.page}>

        {/* Header */}
        <View style={s.headerRow}>
          <View>
            <Text style={s.brandName}>{brandName}</Text>
            <Text style={s.tagline}>AI VISIBILITY REPORT</Text>
          </View>
          <View style={s.dateBlock}>
            <Text style={s.dateLabel}>GENERATED</Text>
            <Text style={s.dateValue}>{date}</Text>
          </View>
        </View>

        <View style={s.divider} />

        {/* Visibility score hero */}
        <View style={s.heroRow}>
          <View style={s.scoreBubble}>
            <Text style={s.scoreNum}>{overallScore ?? '—'}</Text>
            <Text style={s.scorePct}>/ 100</Text>
          </View>
          <View style={s.scoreRight}>
            <Text style={s.scoreTitle}>Overall Visibility Score</Text>
            <View style={s.scoreBar}>
              <View style={[s.scoreBarFill, { width: scoreBarWidth(overallScore) }]} />
            </View>
            <View style={s.compRow}>
              {competitors.map((c) => (
                <View key={c.name} style={s.compChip}>
                  <View style={[s.compDot, { backgroundColor: c.color }]} />
                  <Text style={s.compText}>{c.name}</Text>
                  {c.score !== null && <Text style={s.compScore}> {c.score}</Text>}
                </View>
              ))}
            </View>
          </View>
        </View>

        <View style={s.divider} />

        {/* Gaps */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: AMBER }]} />
            <Text style={s.sectionTitle}>TOP VISIBILITY GAPS</Text>
          </View>
          {gaps.length === 0 ? (
            <Text style={s.emptyNote}>No gaps identified yet. Run a cycle to detect gaps.</Text>
          ) : (
            gaps.slice(0, 5).map((g, i) => (
              <View key={i} style={s.gapRow}>
                <Text style={s.gapTopic}>{g.topic}</Text>
                <Text style={s.gapCompetitor}>vs {g.competitor}</Text>
                <View style={s.gapBadge}>
                  <Text style={s.gapBadgeText}>+{g.gap}pt</Text>
                </View>
              </View>
            ))
          )}
        </View>

        {/* Actions */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: BLUE }]} />
            <Text style={s.sectionTitle}>APPROVED ACTIONS</Text>
          </View>
          {actions.length === 0 ? (
            <Text style={s.emptyNote}>No approved content yet. Approve drafts in the queue to track actions.</Text>
          ) : (
            actions.slice(0, 5).map((a, i) => (
              <View key={i} style={s.actionRow}>
                <View style={s.actionType}>
                  <Text style={s.actionTypeText}>{a.content_type.toUpperCase()}</Text>
                </View>
                <Text style={s.actionTitle}>{a.title}</Text>
              </View>
            ))
          )}
        </View>

        {/* Forecast */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <View style={[s.sectionDot, { backgroundColor: VIOLET }]} />
            <Text style={s.sectionTitle}>2-DAY FORECAST</Text>
          </View>
          <View style={s.forecastBox}>
            <View style={s.forecastArrow}><ArrowUp size={22} color={VIOLET} /></View>
            <View style={s.forecastNums}>
              <Text style={s.forecastLabel}>PROJECTED SCORE</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={s.forecastScores}>{currentScore}</Text>
                <ArrowUp size={12} color={VIOLET} />
                <Text style={s.forecastScores}>{projectedScore}</Text>
              </View>
              <Text style={s.forecastSub}>
                Based on {approvedCount} approved draft{approvedCount !== 1 ? 's' : ''} · trend + content impact model
              </Text>
            </View>
            <View style={s.forecastBoost}>
              <Text style={s.boostNum}>+{contentBoostTotal}</Text>
              <Text style={s.boostLabel}>projected pts</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={s.footer}>
          <Text style={s.footerLeft}>Powered by Peec AI · marktron</Text>
          <Text style={s.footerRight}>{date}</Text>
        </View>

      </Page>
    </Document>
  )
}
