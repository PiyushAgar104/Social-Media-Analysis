import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'
import axios from 'axios'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useEffect, useMemo, useState } from 'react'

type Mode = 'live' | 'demo'

type Kpi = {
  label: string
  value: string
  change: string
  trend: 'up' | 'down' | 'neutral'
}

type TrendPoint = {
  time: string
  volume: number
  sentiment: number
  risk: number
}

type Trend = {
  name: string
  volume: number
  sentiment: number
  risk: number
  velocity: number
  signal: string
}

type AlertItem = {
  level: string
  title: string
  summary: string
  source: string
}

type FeedItem = {
  source: string
  author: string
  title: string
  text: string
  url: string
  timestamp: string
  language: string
  likes: number
  comments: number
  shares: number
  views: number
  location: string
}

type SourceStatus = {
  name: string
  status: string
  detail: string
}

type Geography = {
  region: string
  value: number
}

type DashboardResponse = {
  mode: string
  banner: string
  status_message: string
  kpis: Kpi[]
  trend_series: TrendPoint[]
  trends: Trend[]
  alerts: AlertItem[]
  feed: FeedItem[]
  geography: Geography[]
  sources: SourceStatus[]
}

type Theme = 'dark' | 'light' | 'system'
type FeedFilter = 'all' | 'positive' | 'neutral' | 'negative'
type MediaAnalysis = {
  asset: string
  mediaType: 'Image' | 'Video'
  risk: number
  level: string
  deepfake: number
  manipulation: number
  authenticity: number
  metadata: string
  source: string
  visual: string
  audio: string
  verdict: string
  suspiciousFrames: number
  faceManipulation: number
  syncRisk: number
}

const streamEvents = [
  { platform: 'X', topic: '#GridResilience', headline: 'Regional grid resilience discussion accelerates', author: '@energywatch', location: 'US / Canada', sentiment: 'positive' as const, credibility: 'Medium', risk: 31, likes: 12800, comments: 840, shares: 2900 },
  { platform: 'Reddit', topic: 'Energy storage policy', headline: 'Community compares new storage incentives across regions', author: 'u/marketpulse', location: 'UK / EU', sentiment: 'neutral' as const, credibility: 'Medium', risk: 42, likes: 8200, comments: 1100, shares: 640 },
  { platform: 'YouTube', topic: 'Climate tech funding', headline: 'Analysts review the latest climate-tech funding cycle', author: 'GridSignal', location: 'Global', sentiment: 'positive' as const, credibility: 'High', risk: 18, likes: 5700, comments: 420, shares: 380 },
  { platform: 'News', topic: 'Grid operator updates', headline: 'Operators publish updated emergency reserve guidance', author: 'Reuters', location: 'APAC', sentiment: 'neutral' as const, credibility: 'High', risk: 12, likes: 3400, comments: 180, shares: 720 },
  { platform: 'X', topic: 'Battery safety claims', headline: 'Unverified battery safety claim begins cross-platform spread', author: '@civicbrief', location: 'United States', sentiment: 'negative' as const, credibility: 'Low', risk: 79, likes: 9100, comments: 1400, shares: 3300 },
  { platform: 'Reddit', topic: 'Climate investment', headline: 'Investors debate whether new capital signals a durable trend', author: 'u/longhorizon', location: 'Germany', sentiment: 'positive' as const, credibility: 'Medium', risk: 24, likes: 4600, comments: 520, shares: 290 },
]

const demoTopics = ['Grid resilience', 'Energy storage', 'Climate tech', 'Battery safety', 'Emergency reserves', 'Climate investment']

const rumours = [
  { claim: '“The national grid will be offline for 72 hours this weekend.”', type: 'Social post', risk: 86, misinformation: 91, confidence: 94, status: 'False', credibility: 'Low', platforms: 5, evidence: 'No primary-source confirmation; recycled 2024 image; coordinated repost timing.' },
  { claim: '“New battery storage plants are causing regional water contamination.”', type: 'Video + text', risk: 63, misinformation: 68, confidence: 81, status: 'Suspicious', credibility: 'Low', platforms: 3, evidence: 'Unverified footage location; claim conflicts with regulator reports.' },
  { claim: '“Grid operators are expanding emergency reserve capacity.”', type: 'News report', risk: 18, misinformation: 11, confidence: 89, status: 'Verified', credibility: 'High', platforms: 7, evidence: 'Matched operator release, filings, and independent reporting.' },
]

const defaultMediaAnalysis: MediaAnalysis = {
  asset: 'viral-grid-incident.mp4',
  mediaType: 'Video',
  risk: 78,
  level: 'HIGH',
  deepfake: 64,
  manipulation: 72,
  authenticity: 22,
  metadata: 'Anomalous',
  source: 'Low reliability',
  visual: 'Frame interpolation detected at 00:18–00:22',
  audio: 'Lip-sync drift detected in 3.4% of speech',
  verdict: 'High Risk — likely manipulated',
  suspiciousFrames: 14,
  faceManipulation: 69,
  syncRisk: 41,
}

const riskDistribution = [
  { name: 'Low risk', value: 42, color: '#34d399' },
  { name: 'Medium', value: 28, color: '#fbbf24' },
  { name: 'High', value: 21, color: '#fb7185' },
  { name: 'Critical', value: 9, color: '#a78bfa' },
]

const platformRisk = [
  { platform: 'X', claims: 42, confirmed: 18 },
  { platform: 'Reddit', claims: 31, confirmed: 16 },
  { platform: 'YouTube', claims: 24, confirmed: 11 },
  { platform: 'News', claims: 12, confirmed: 8 },
]

const spreadTimeline = [
  { time: '08:00', mentions: 420, platforms: 1 },
  { time: '09:00', mentions: 980, platforms: 2 },
  { time: '10:00', mentions: 2400, platforms: 4 },
  { time: '11:00', mentions: 4100, platforms: 5 },
  { time: '12:00', mentions: 5300, platforms: 6 },
]

const queryClient = new QueryClient()

const defaultDashboard: DashboardResponse = {
  mode: 'demo',
  banner: 'DEMO MODE — SIMULATED DATA',
  status_message: 'Demonstration data is enabled to preview the product experience.',
  kpis: [
    { label: 'Content signals', value: '38.6K', change: '+16.4%', trend: 'up' },
    { label: 'Positive sentiment', value: '68%', change: '+4.1%', trend: 'up' },
    { label: 'Misinformation risk', value: '24%', change: '-2.8%', trend: 'down' },
    { label: 'Geo coverage', value: '42 regions', change: '+7', trend: 'up' },
  ],
  trend_series: [
    { time: '00:00', volume: 500, sentiment: 58, risk: 21 },
    { time: '04:00', volume: 820, sentiment: 60, risk: 24 },
    { time: '08:00', volume: 1200, sentiment: 64, risk: 27 },
    { time: '12:00', volume: 1500, sentiment: 67, risk: 29 },
    { time: '16:00', volume: 1850, sentiment: 69, risk: 31 },
    { time: '20:00', volume: 2150, sentiment: 72, risk: 35 },
  ],
  trends: [
    { name: '#electionwatch', volume: 14200, sentiment: 64, risk: 48, velocity: 3.9, signal: 'Early surge' },
    { name: '#greenenergy', volume: 11800, sentiment: 72, risk: 31, velocity: 3.1, signal: 'Sustained growth' },
    { name: '#cybersecurity', volume: 9600, sentiment: 69, risk: 46, velocity: 2.9, signal: 'Watchlist' },
    { name: '#climatetech', volume: 8400, sentiment: 74, risk: 22, velocity: 2.6, signal: 'Momentum' },
  ],
  alerts: [
    { level: 'high', title: 'Narrative acceleration', summary: 'A misinformation cluster around energy policy is expanding across Reddit and news conversations.', source: 'Cross-platform' },
    { level: 'medium', title: 'Regional spike', summary: 'Mentions of grid resilience increased sharply in the Northeast and West Coast.', source: 'Geo intelligence' },
    { level: 'low', title: 'Sentiment shift', summary: 'Brand perception around logistics and supply chains is turning more positive in U.S. audiences.', source: 'Social listening' },
  ],
  feed: [
    { source: 'Reddit', author: 'u/marketpulse', title: 'Users tracking an unusually fast adoption curve in EV charging capacity discussions', text: 'The volume of discussion is accelerating, and claims are spreading faster across niche communities.', url: 'https://example.com/ev-charging', timestamp: '2026-09-20T10:24:00Z', language: 'en', likes: 820, comments: 110, shares: 42, views: 18500, location: 'United States' },
    { source: 'YouTube', author: 'GridSignal', title: 'Policy analysts debate resilience upgrades after recent outages', text: 'New commentary is surfacing across creator channels with rapid engagement growth.', url: 'https://example.com/grid-policy', timestamp: '2026-09-20T09:40:00Z', language: 'en', likes: 1760, comments: 194, shares: 88, views: 40200, location: 'Canada' },
    { source: 'Google News', author: 'Reuters', title: 'Energy storage investment heats up as grid operators look to resilience', text: 'Coverage is broadening beyond technical reporting into mainstream business analysis.', url: 'https://example.com/energy-storage', timestamp: '2026-09-20T08:12:00Z', language: 'en', likes: 430, comments: 58, shares: 26, views: 11200, location: 'United Kingdom' },
  ],
  geography: [
    { region: 'North America', value: 34 },
    { region: 'Europe', value: 26 },
    { region: 'Asia', value: 22 },
    { region: 'Middle East', value: 11 },
    { region: 'LATAM', value: 7 },
  ],
  sources: [
    { name: 'Reddit', status: 'Demo Stream', detail: 'Live demo events are streaming locally.' },
    { name: 'YouTube', status: 'Demo Stream', detail: 'Live demo events are streaming locally.' },
    { name: 'GDELT', status: 'Demo Stream', detail: 'Live demo events are streaming locally.' },
    { name: 'News RSS', status: 'Demo Stream', detail: 'Live demo events are streaming locally.' },
    { name: 'X', status: 'Demo Stream', detail: 'Live demo events are streaming locally.' },
  ],
}

function getStatusClass(status: string): string {
  switch (status) {
    case 'Connected':
      return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
    case 'Error':
      return 'border-amber-500/40 bg-amber-500/10 text-amber-300'
    case 'Not Configured':
    default:
      return 'border-slate-500/40 bg-slate-500/10 text-slate-300'
  }
}

function riskTone(score: number): string {
  if (score >= 75) return 'text-rose-300'
  if (score >= 45) return 'text-amber-300'
  return 'text-emerald-300'
}

function statusTone(status: string): string {
  if (status === 'False') return 'border-rose-500/40 bg-rose-500/10 text-rose-300'
  if (status === 'Suspicious') return 'border-amber-500/40 bg-amber-500/10 text-amber-300'
  return 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
}

function RiskGauge({ score, label }: { score: number; label: string }) {
  const radius = 42
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  return (
    <div className="relative h-32 w-32 shrink-0">
      <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r={radius} fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-800" />
        <circle
          cx="50"
          cy="50"
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className={score >= 75 ? 'text-rose-400' : score >= 45 ? 'text-amber-400' : 'text-emerald-400'}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className={`text-2xl font-semibold ${riskTone(score)}`}>{score}</span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-slate-400">{label}</span>
      </div>
    </div>
  )
}

async function fetchDashboard(mode: Mode): Promise<DashboardResponse> {
  const { data } = await axios.get<DashboardResponse>(`/api/dashboard?mode=${mode}`)
  return data
}

function AppContents() {
  const [mode, setMode] = useState<Mode>('demo')
  const [liveUpdate, setLiveUpdate] = useState<DashboardResponse | null>(null)
  const [theme, setTheme] = useState<Theme>('light')
  const [streamIndex, setStreamIndex] = useState(0)
  const [feedPaused, setFeedPaused] = useState(false)
  const [platformFilter, setPlatformFilter] = useState('All')
  const [sentimentFilter, setSentimentFilter] = useState<FeedFilter>('all')
  const [lastUpdated, setLastUpdated] = useState(new Date())
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadStatus, setUploadStatus] = useState('Ready for upload')
  const [uploadedAnalysis, setUploadedAnalysis] = useState<MediaAnalysis | null>(null)

  useEffect(() => {
    const root = document.documentElement
    const prefersLight = window.matchMedia('(prefers-color-scheme: light)').matches
    root.dataset.theme = theme === 'system' && prefersLight ? 'light' : theme === 'light' ? 'light' : 'dark'
  }, [theme])

  useEffect(() => {
    if (feedPaused) return undefined
    const timer = window.setInterval(() => {
      setStreamIndex((current) => (current + 1) % streamEvents.length)
      setLastUpdated(new Date())
    }, 3500)
    return () => window.clearInterval(timer)
  }, [feedPaused])

  useEffect(() => () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
  }, [previewUrl])

  const streamRows = useMemo(() => {
    const rows = Array.from({ length: 4 }, (_, offset) => streamEvents[(streamIndex + offset) % streamEvents.length])
    return rows.map((item, offset) => ({
      ...item,
      timestamp: new Date(Date.now() - offset * 47000).toISOString(),
      engagement: item.likes + item.comments + item.shares,
      velocity: `${(2.4 + ((streamIndex + offset) % 5) * 0.6).toFixed(1)}x`,
    }))
  }, [streamIndex])

  const filteredStreamRows = streamRows.filter((item) =>
    (platformFilter === 'All' || item.platform === platformFilter)
    && (sentimentFilter === 'all' || item.sentiment === sentimentFilter)
  )

  const analyticsRows = streamRows
  const analytics = useMemo(() => {
    const totalMentions = analyticsRows.reduce((sum, item) => sum + item.likes + item.comments + item.shares, 0)
    const engagement = analyticsRows.reduce((sum, item) => sum + item.engagement, 0)
    const positive = analyticsRows.filter((item) => item.sentiment === 'positive').length
    const negative = analyticsRows.filter((item) => item.sentiment === 'negative').length
    const neutral = analyticsRows.filter((item) => item.sentiment === 'neutral').length
    const highRisk = analyticsRows.filter((item) => item.risk >= 70).length
    const topics = demoTopics.map((topic) => {
      const matching = analyticsRows.filter((item) => item.topic.toLowerCase().includes(topic.toLowerCase().split(' ')[0]))
      const mentions = matching.reduce((sum, item) => sum + item.likes + item.comments + item.shares, 0)
      return {
        topic,
        mentions,
        engagement: mentions,
        sentiment: matching.length ? Math.round(matching.reduce((sum, item) => sum + (item.sentiment === 'positive' ? 78 : item.sentiment === 'neutral' ? 58 : 32), 0) / matching.length) : 0,
        risk: matching.length ? Math.round(matching.reduce((sum, item) => sum + item.risk, 0) / matching.length) : 0,
        velocity: matching.length ? (2.2 + matching.length * 0.8 + (streamIndex % 3) * 0.3).toFixed(1) : '1.2',
      }
    }).sort((a, b) => b.mentions - a.mentions)
    const platformData = ['Reddit', 'YouTube', 'X', 'News'].map((platform) => ({
      platform,
      value: analyticsRows.filter((item) => item.platform === platform).length,
      engagement: analyticsRows.filter((item) => item.platform === platform).reduce((sum, item) => sum + item.engagement, 0),
      positive: analyticsRows.filter((item) => item.platform === platform && item.sentiment === 'positive').length,
      neutral: analyticsRows.filter((item) => item.platform === platform && item.sentiment === 'neutral').length,
      negative: analyticsRows.filter((item) => item.platform === platform && item.sentiment === 'negative').length,
      lowRisk: analyticsRows.filter((item) => item.platform === platform && item.risk < 45).length,
      mediumRisk: analyticsRows.filter((item) => item.platform === platform && item.risk >= 45 && item.risk < 70).length,
      highRisk: analyticsRows.filter((item) => item.platform === platform && item.risk >= 70).length,
    }))
    const platformContribution = platformData.map((item) => ({ name: item.platform, value: item.engagement }))
    const rumourSpread = ['Reddit', 'X', 'YouTube', 'News'].map((platform, index) => {
      const rows = analyticsRows.filter((item) => item.platform === platform)
      return {
        platform,
        mentions: rows.length,
        engagement: rows.reduce((sum, item) => sum + item.engagement, 0),
        velocity: `${(2.1 + ((streamIndex + index) % 5) * 0.7).toFixed(1)}x`,
        risk: rows.length ? Math.round(rows.reduce((sum, item) => sum + item.risk, 0) / rows.length) : 0,
      }
    })
    const momentumSeries = Array.from({ length: 6 }, (_, index) => {
      const interval = index + 1
      const point: Record<string, string | number> = { time: `${8 + index * 2}:00` }
      platformData.forEach((platform, platformIndex) => {
        const base = platform.engagement / Math.max(platformData.reduce((sum, item) => sum + item.engagement, 0), 1) * 100
        point[platform.platform] = Math.round(base * (0.68 + interval * 0.055 + ((streamIndex + platformIndex + interval) % 3) * 0.06))
      })
      return point
    })
    const topicMomentum = demoTopics.map((topic) => {
      const topicRows = analyticsRows.filter((item) => item.topic.toLowerCase().includes(topic.toLowerCase().split(' ')[0]))
      const platformScores = ['X', 'Reddit', 'YouTube', 'News'].map((platform) => {
        const row = topicRows.find((item) => item.platform === platform)
        return row ? Math.round(row.engagement * (1 + (streamIndex % 3) * 0.08)) : 0
      })
      const momentum = platformScores.reduce((sum, value) => sum + value, 0)
      return {
        topic,
        x: platformScores[0],
        reddit: platformScores[1],
        youtube: platformScores[2],
        news: platformScores[3],
        momentum,
        direction: momentum > 4000 ? 'Rising' : momentum > 0 ? 'Stable' : 'Falling',
      }
    }).sort((a, b) => b.momentum - a.momentum).slice(0, 4)
    return {
      totalMentions,
      engagement,
      activeTrends: topics.filter((item) => item.mentions > 0).length,
      rumours: analyticsRows.filter((item) => item.risk >= 45).length,
      highRisk,
      positive,
      negative,
      neutral,
      topics,
      platformData,
      platformContribution,
      rumourSpread,
      momentumSeries,
      topicMomentum,
      sentimentData: [
        { name: 'Positive', value: positive, color: '#16a34a' },
        { name: 'Neutral', value: neutral, color: '#64748b' },
        { name: 'Negative', value: negative, color: '#dc2626' },
      ],
      riskData: [
        { name: 'Low', value: analyticsRows.filter((item) => item.risk < 45).length },
        { name: 'Medium', value: analyticsRows.filter((item) => item.risk >= 45 && item.risk < 70).length },
        { name: 'High', value: highRisk },
      ],
      engagementTrend: Array.from({ length: 5 }, (_, index) => ({
        time: `${8 + index}:00`,
        engagement: Math.round((engagement / 5) * (0.74 + index * 0.08 + ((streamIndex + index) % 2) * 0.05)),
      })),
    }
  }, [analyticsRows, streamIndex])

  function handleFile(file: File | undefined) {
    if (!file) return
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime', 'video/x-msvideo']
    if (!allowed.includes(file.type)) {
      setUploadStatus('Unsupported file type. Use JPG, JPEG, PNG, WEBP, MP4, MOV, or AVI.')
      return
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setSelectedFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setUploadStatus('Uploaded — ready to analyze')
    setUploadedAnalysis(null)
  }

  function analyzeMedia() {
    if (!selectedFile) return
    const isVideo = selectedFile.type.startsWith('video/')
    const hash = selectedFile.size % 17
    setUploadedAnalysis({
      ...defaultMediaAnalysis,
      asset: selectedFile.name,
      mediaType: isVideo ? 'Video' : 'Image',
      risk: isVideo ? 78 + (hash % 5) : 68 + (hash % 9),
      level: isVideo ? 'HIGH' : 'MEDIUM',
      deepfake: isVideo ? 64 + (hash % 7) : 18 + (hash % 8),
      manipulation: isVideo ? 72 + (hash % 6) : 46 + (hash % 10),
      authenticity: isVideo ? 22 - (hash % 5) : 49 + (hash % 8),
      metadata: hash % 2 === 0 ? 'Anomalous' : 'No anomaly detected',
      source: hash % 3 === 0 ? 'Low reliability' : 'Unknown — not verified',
      visual: isVideo ? 'Frame interpolation detected in sampled sequence' : 'Compression pattern requires source confirmation',
      audio: isVideo ? 'Lip-sync drift detected in sampled speech' : 'Not applicable',
      verdict: isVideo ? 'High Risk — review before publication' : 'Medium Risk — source verification required',
      suspiciousFrames: isVideo ? 12 + (hash % 9) : 0,
      faceManipulation: isVideo ? 61 + (hash % 12) : 0,
      syncRisk: isVideo ? 35 + (hash % 15) : 0,
    })
    setUploadStatus('Demo analysis complete — deterministic file signal engine')
  }

  useEffect(() => {
    const socket = new WebSocket('ws://localhost:8000/ws/live')

    socket.onmessage = (event) => {
      const data = JSON.parse(event.data) as { payload?: DashboardResponse }
      if (data.payload) {
        setLiveUpdate(data.payload)
      }
    }

    return () => {
      socket.close()
    }
  }, [])

  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', mode],
    queryFn: () => fetchDashboard(mode),
    staleTime: 6000,
  })

  const dashboard = mode === 'live' ? (liveUpdate ?? data ?? defaultDashboard) : (data ?? defaultDashboard)
  const analysis = uploadedAnalysis ?? defaultMediaAnalysis

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 transition-colors">
      <div className="dashboard-shell">
        <aside className="dashboard-sidebar">
          <div className="sidebar-brand">
            <span className="brand-mark">TT</span>
            <div>
              <div className="sidebar-eyebrow">TrendTrace</div>
              <div className="sidebar-title">INTELLIGENCE HUB</div>
            </div>
          </div>
          <nav className="sidebar-nav" aria-label="Primary navigation">
            {['Dashboard', 'Intelligence Center', 'Live Trends', 'Content Feed', 'Sentiment', 'Topics & Tags', 'Risk Analysis', 'Multimodal Lab', 'Alerts', 'Source Comparison', 'AI Insights', 'Settings'].map((item, index) => (
              <button key={item} type="button" className={`sidebar-link ${index === 0 ? 'active' : ''}`}>
                <span className="sidebar-icon">{['▦', '◈', '⌁', '▤', '◉', '◇', '◌', '▣', '♧', '⌘', '✦', '⚙'][index]}</span>
                <span>{item}</span>
                {item === 'Alerts' && <span className="sidebar-badge">5</span>}
              </button>
            ))}
          </nav>
          <div className="engine-card">
            <div className="engine-title"><span className="engine-dot" /> Real-Time Engine</div>
            <p>Aggregating and normalizing live multi-channel signals with local demo streaming.</p>
          </div>
        </aside>
        <main className="dashboard-main">
        <div className="topic-strip">
          <span className="topic-label">Popular topics</span>
          {['#AI Technology', '#OpenAI', '#Climate Change', '#Bitcoin', '#Semiconductor', '#Cybersecurity'].map((topic) => <span key={topic} className="topic-chip">{topic}</span>)}
        </div>
        <div className="mx-auto max-w-7xl">
        <header className="panel mb-6 overflow-hidden p-4 md:p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs uppercase tracking-[0.28em] text-cyan-300/80">
                <span className="inline-flex h-2.5 w-2.5 rounded-full bg-cyan-400" />
                TrendTrace
              </div>
              <h1 className="text-2xl font-semibold tracking-tight md:text-4xl">SOCIAL INTELLIGENCE PLATFORM</h1>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-2">
              <div className="flex items-center gap-2 rounded-full border border-cyan-500/30 bg-slate-900 p-1">
                {(['live', 'demo'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      mode === option
                        ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {option === 'live' ? 'LIVE MODE' : 'DEMO MODE'}
                  </button>
                ))}
              </div>
              <label className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-slate-300">
                <span>Theme</span>
                <select
                  value={theme}
                  onChange={(event) => setTheme(event.target.value as Theme)}
                  className="bg-transparent font-medium text-cyan-300 outline-none"
                >
                  <option value="dark">Dark</option>
                  <option value="light">Light</option>
                  <option value="system">System</option>
                </select>
              </label>
            </div>
          </div>
        </header>

        <section className="context-strip mb-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="context-item"><span className="context-icon">▣</span><span>Data Sources:</span><strong>News + Hackernews + GDELT</strong></div>
            </div>
            <div className="context-item"><span className="context-icon">▤</span><span>Records Analyzed:</span><strong>{analytics.totalMentions.toLocaleString()} verified items</strong></div>
            <div className="context-item"><span className="context-icon green">◷</span><span>Live Refreshed:</span><strong>{lastUpdated.toLocaleTimeString()}</strong></div>
          </div>
        </section>

        {isLoading && <div className="mb-6 text-slate-300">Loading live intelligence feed...</div>}
        {error && <div className="mb-6 text-rose-300">Unable to load dashboard data.</div>}

        <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Total Mentions', value: analytics.totalMentions.toLocaleString(), change: `+${analyticsRows.length}`, trend: 'up' as const },
            { label: 'Active Trends', value: analytics.activeTrends.toString(), change: 'Live', trend: 'up' as const },
            { label: 'Rumours Detected', value: analytics.rumours.toString(), change: `${analytics.negative} negative`, trend: analytics.rumours ? 'down' as const : 'neutral' as const },
            { label: 'High-Risk Content', value: analytics.highRisk.toString(), change: `${Math.round((analytics.highRisk / Math.max(analyticsRows.length, 1)) * 100)}%`, trend: analytics.highRisk ? 'down' as const : 'neutral' as const },
          ].map((metric) => (
            <article key={metric.label} className="panel p-4">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.18em] text-slate-400">
                <span>{metric.label}</span>
                <span
                  className={`rounded-full border px-2 py-0.5 text-[10px] font-medium ${
                    metric.trend === 'up'
                      ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                      : metric.trend === 'down'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : 'border-slate-500/40 bg-slate-500/10 text-slate-300'
                  }`}
                >
                  {metric.change}
                </span>
              </div>
              <div className="mt-4 text-3xl font-semibold text-white">{metric.value}</div>
            </article>
          ))}
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.75fr_1fr]">
          <div className="panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Multi-Platform Trend Momentum</h2>
                <p className="mt-1 text-sm text-slate-500">How shared topics gain or lose activity across platforms over time.</p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-cyan-300">Live stream</span>
            </div>

            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics.momentumSeries}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="time" stroke="#64748b" />
                  <YAxis label={{ value: 'Momentum', angle: -90, position: 'insideLeft', fill: '#64748b' }} stroke="#64748b" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Line type="monotone" dataKey="X" name="X / Twitter" stroke="#111827" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Reddit" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="YouTube" stroke="#dc2626" strokeWidth={2.5} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="News" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
              {[
                ['X / Twitter', '#111827'],
                ['Reddit', '#f97316'],
                ['YouTube', '#dc2626'],
                ['News', '#2563eb'],
              ].map(([label, color]) => <span key={label}><span className="mr-2 inline-block h-2 w-5 rounded-full" style={{ backgroundColor: color }} />{label}</span>)}
            </div>
            <div className="mt-5 border-t border-slate-100 pt-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-slate-800">Top Trending Topics</h3>
                <span className="text-xs text-slate-500">Momentum by platform</span>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-xs">
                  <thead className="text-[10px] uppercase tracking-wide text-slate-500">
                    <tr>
                      <th className="pb-2 pr-3">Topic</th>
                      <th className="pb-2 pr-3">X</th>
                      <th className="pb-2 pr-3">Reddit</th>
                      <th className="pb-2 pr-3">YouTube</th>
                      <th className="pb-2 pr-3">News</th>
                      <th className="pb-2">Momentum</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analytics.topicMomentum.map((topic) => (
                      <tr key={topic.topic} className="border-t border-slate-100">
                        <td className="py-2 pr-3 font-semibold text-slate-700">{topic.topic}</td>
                        {[topic.x, topic.reddit, topic.youtube, topic.news].map((value, index) => <td key={`${topic.topic}-${index}`} className="py-2 pr-3"><span className={value > 0 ? 'text-blue-600' : 'text-slate-300'}>{value > 0 ? `${value.toLocaleString()} · ${index === 0 || value > 1800 ? 'Rising' : 'Stable'}` : '—'}</span></td>)}
                        <td className="py-2 font-semibold text-slate-800">{topic.momentum.toLocaleString()} <span className={topic.direction === 'Rising' ? 'text-emerald-600' : topic.direction === 'Stable' ? 'text-amber-600' : 'text-rose-600'}>· {topic.direction}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Source status</h2>
              <span className="text-xs uppercase tracking-[0.18em] text-slate-400">live</span>
            </div>
            <div className="space-y-3">
              {dashboard.sources.map((source) => (
                <div key={source.name} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-medium text-slate-100">{source.name}</span>
                    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${getStatusClass(source.status)}`}>
                      {source.status}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-300">{source.detail}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <section className="panel mb-6 p-4 md:p-5">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">Analysis</h2>
              <p className="mt-1 text-sm text-slate-500">Calculated from the current Live Demo Stream dataset.</p>
            </div>
            <span className="text-xs uppercase tracking-[0.16em] text-blue-600">Auto-updating</span>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Sentiment distribution</h3>
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={analytics.sentimentData} dataKey="value" nameKey="name" innerRadius={48} outerRadius={72} paddingAngle={3}>
                      {analytics.sentimentData.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 text-xs text-slate-500">{analytics.sentimentData.map((item) => <span key={item.name}><span className="mr-1 inline-block h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}: {item.value}</span>)}</div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Platform distribution</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="platform" stroke="#64748b" />
                    <YAxis allowDecimals={false} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" name="Items" fill="#2563eb" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Engagement trend</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={analytics.engagementTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="time" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Line type="monotone" dataKey="engagement" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-3">
              <h3 className="mb-2 text-sm font-semibold text-slate-800">Misinformation risk distribution</h3>
              <div className="h-60">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.riskData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="name" stroke="#64748b" />
                    <YAxis allowDecimals={false} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" fill="#dc2626" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        <section className="panel mb-6 p-4 md:p-5">
          <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-slate-900">Multi-Platform Social Media Analytics</h2>
                <span className="rounded-full border border-blue-200 bg-blue-50 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-blue-700">4 sources</span>
              </div>
              <p className="mt-1 text-sm text-slate-500">Compare activity, sentiment, engagement, and misinformation risk across the live stream.</p>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
              {['X', 'Reddit', 'YouTube', 'News'].map((platform) => <span key={platform} className="platform-label"><span className={`platform-icon platform-${platform.toLowerCase()}`}>{platform === 'YouTube' ? '▶' : platform === 'Reddit' ? '●' : platform === 'X' ? '𝕏' : 'N'}</span>{platform}</span>)}
            </div>
          </div>
          <div className="grid gap-5 xl:grid-cols-2">
            <div className="viz-card">
              <h3 className="viz-title">Platform activity comparison</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="platform" stroke="#64748b" />
                    <YAxis stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="value" name="Posts" fill="#2563eb" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="engagement" name="Engagement" fill="#60a5fa" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="viz-card">
              <h3 className="viz-title">Platform-wise sentiment</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="platform" stroke="#64748b" />
                    <YAxis allowDecimals={false} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="positive" stackId="sentiment" name="Positive" fill="#16a34a" />
                    <Bar dataKey="neutral" stackId="sentiment" name="Neutral" fill="#94a3b8" />
                    <Bar dataKey="negative" stackId="sentiment" name="Negative" fill="#dc2626" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="viz-card">
              <h3 className="viz-title">Platform-wise misinformation risk</h3>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={analytics.platformData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="platform" stroke="#64748b" />
                    <YAxis allowDecimals={false} stroke="#64748b" />
                    <Tooltip />
                    <Bar dataKey="lowRisk" name="Low risk" fill="#16a34a" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="mediumRisk" name="Medium risk" fill="#d97706" radius={[3, 3, 0, 0]} />
                    <Bar dataKey="highRisk" name="High risk" fill="#dc2626" radius={[3, 3, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="viz-card">
              <h3 className="viz-title">Platform contribution</h3>
              <div className="grid items-center gap-3 sm:grid-cols-[1fr_1fr]">
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={analytics.platformContribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={3}>
                        {analytics.platformContribution.map((entry, index) => <Cell key={entry.name} fill={['#111827', '#ff4500', '#dc2626', '#2563eb'][index]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 text-xs">{analytics.platformContribution.map((item, index) => <div key={item.name} className="flex items-center justify-between"><span className="flex items-center gap-2 text-slate-600"><span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: ['#111827', '#ff4500', '#dc2626', '#2563eb'][index] }} />{item.name}</span><strong className="text-slate-800">{Math.round((item.value / Math.max(analytics.engagement, 1)) * 100)}%</strong></div>)}</div>
              </div>
            </div>
          </div>
          <div className="viz-card mt-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <h3 className="viz-title">Rumour spread across platforms</h3>
                <p className="text-xs text-slate-500">Same claim path, ordered by observed propagation sequence.</p>
              </div>
              <span className="text-xs font-semibold text-blue-600">Reddit → X → YouTube → News</span>
            </div>
            <div className="space-y-3">
              {analytics.rumourSpread.map((item, index) => (
                <div key={item.platform} className="grid items-center gap-3 md:grid-cols-[100px_1fr_72px_72px_72px]">
                  <div className="flex items-center gap-2 text-sm font-semibold text-slate-700"><span className={`platform-icon platform-${item.platform.toLowerCase()}`}>{item.platform === 'YouTube' ? '▶' : item.platform === 'Reddit' ? '●' : item.platform === 'X' ? '𝕏' : 'N'}</span>{item.platform}</div>
                  <div className="h-3 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, 24 + index * 19 + item.mentions * 10)}%` }} /></div>
                  <span className="text-xs text-slate-500">{item.mentions} mentions</span>
                  <span className="text-xs font-semibold text-blue-600">{item.velocity}</span>
                  <span className={`text-xs font-semibold ${riskTone(item.risk)}`}>{item.risk}/100 risk</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mb-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-white">Trending Topics</h2>
                <p className="mt-1 text-sm text-slate-500">Topic frequency and velocity calculated from the stream.</p>
              </div>
              <span className="text-xs uppercase tracking-[0.18em] text-blue-600">signal map</span>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-xs uppercase tracking-[0.18em] text-slate-400">
                    <th className="pb-2 pr-4">Trend</th>
                    <th className="pb-2 pr-4">Volume</th>
                    <th className="pb-2 pr-4">Sentiment</th>
                    <th className="pb-2 pr-4">Risk</th>
                    <th className="pb-2 pr-4">Velocity</th>
                  </tr>
                </thead>
                <tbody>
                  {analytics.topics.map((trend) => (
                    <tr key={trend.topic} className="rounded-xl bg-slate-900/80 text-sm text-slate-200">
                      <td className="rounded-l-xl px-3 py-3">
                        <div className="font-medium text-white">{trend.topic}</div>
                        <div className="text-xs text-slate-400">{trend.mentions > 0 ? 'Increasing activity' : 'Monitoring'}</div>
                      </td>
                      <td className="px-3 py-3">{trend.mentions.toLocaleString()}</td>
                      <td className="px-3 py-3">{trend.sentiment}%</td>
                      <td className="px-3 py-3">{trend.risk}%</td>
                      <td className="rounded-r-xl px-3 py-3">{trend.velocity}x</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Geographic intelligence</h2>
              <span className="text-xs uppercase tracking-[0.18em] text-emerald-300">coverage</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dashboard.geography} layout="vertical" margin={{ left: 12, right: 12 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis type="number" stroke="#94a3b8" />
                  <YAxis type="category" dataKey="region" width={80} stroke="#94a3b8" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#020817',
                      border: '1px solid rgba(52, 211, 153, 0.25)',
                      borderRadius: '0.75rem',
                    }}
                  />
                  <Bar dataKey="value" radius={[0, 10, 10, 0]} fill="#34d399" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className="mb-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Risk alerts</h2>
              <span className="text-xs uppercase tracking-[0.18em] text-rose-300">priority</span>
            </div>
            <div className="space-y-3">
              {dashboard.alerts.map((alert) => (
                <div key={`${alert.title}-${alert.source}`} className="rounded-xl border border-slate-700 bg-slate-900/70 p-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.18em] ${
                      alert.level === 'high'
                        ? 'border-rose-500/40 bg-rose-500/10 text-rose-300'
                        : alert.level === 'medium'
                          ? 'border-amber-500/40 bg-amber-500/10 text-amber-300'
                          : 'border-sky-500/40 bg-sky-500/10 text-sky-300'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="text-xs text-slate-400">{alert.source}</span>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-white">{alert.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{alert.summary}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="panel p-4 md:p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Live intelligence feed</h2>
              <span className="text-xs uppercase tracking-[0.18em] text-cyan-300">normalized</span>
            </div>
            <div className="space-y-3">
              {dashboard.feed.map((entry) => (
                <a
                  key={`${entry.source}-${entry.title}`}
                  href={entry.url}
                  target="_blank"
                  rel="noreferrer"
                  className="block rounded-xl border border-slate-700 bg-slate-900/75 p-3 transition hover:border-cyan-400/40 hover:bg-slate-800"
                >
                  <div className="mb-2 flex items-center justify-between gap-3">
                    <span className="rounded-full border border-cyan-500/30 bg-cyan-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-cyan-200">
                      {entry.source}
                    </span>
                    <span className="text-xs text-slate-400">{new Date(entry.timestamp).toLocaleString()}</span>
                  </div>
                  <h3 className="text-base font-semibold text-white">{entry.title}</h3>
                  <p className="mt-2 text-sm text-slate-300">{entry.text}</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-400">
                    <span>By {entry.author}</span>
                    <span>Lat/Long: {entry.location}</span>
                    <span>{entry.likes.toLocaleString()} likes</span>
                    <span>{entry.comments.toLocaleString()} comments</span>
                    <span>{entry.views.toLocaleString()} views</span>
                  </div>
                </a>
              ))}
            </div>
          </div>

          <section className="panel mb-6 p-4 md:p-5">
            <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-xl font-semibold text-white">Live Social Media Intelligence</h2>
                  <span className="live-pulse rounded-full border border-emerald-400/40 bg-emerald-500/10 px-2 py-1 text-[10px] uppercase tracking-[0.18em] text-emerald-300">Live</span>
                </div>
                <p className="mt-1 text-sm text-slate-400">Live Demo Stream · structured events refresh every 3.5 seconds.</p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs text-slate-500">Updated {lastUpdated.toLocaleTimeString()}</span>
                <button type="button" onClick={() => setFeedPaused((paused) => !paused)} className="button-secondary">
                  {feedPaused ? 'Resume live feed' : 'Pause live feed'}
                </button>
              </div>
            </div>
            <div className="mb-4 flex flex-wrap gap-2">
              {['All', 'X', 'Reddit', 'YouTube', 'News'].map((platform) => (
                <button key={platform} type="button" onClick={() => setPlatformFilter(platform)} className={platformFilter === platform ? 'filter-button active' : 'filter-button'}>{platform}</button>
              ))}
              <span className="mx-1 border-l border-slate-300" />
              {(['all', 'positive', 'neutral', 'negative'] as const).map((sentiment) => (
                <button key={sentiment} type="button" onClick={() => setSentimentFilter(sentiment)} className={sentimentFilter === sentiment ? 'filter-button active' : 'filter-button'}>{sentiment}</button>
              ))}
            </div>
            <div className="grid gap-3">
              {filteredStreamRows.map((signal, index) => (
                <article key={`${signal.platform}-${signal.topic}-${signal.timestamp}`} className={`stream-row rounded-xl border border-slate-200 bg-white p-4 transition ${index === 0 && !feedPaused ? 'new-event' : ''}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.16em] text-blue-600">
                        <span className={`platform-icon platform-${signal.platform.toLowerCase()}`}>{signal.platform === 'YouTube' ? '▶' : signal.platform === 'Reddit' ? '●' : signal.platform === 'X' ? '𝕏' : 'N'}</span>
                        {signal.platform}
                      </div>
                      <h3 className="mt-2 text-base font-semibold text-slate-900">{signal.headline}</h3>
                    </div>
                    <span className="text-xs text-slate-500">{new Date(signal.timestamp).toLocaleTimeString()} UTC</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-600">
                    <span>Source: <strong>{signal.author}</strong></span>
                    <span>Topic: <strong>{signal.topic}</strong></span>
                    <span>Location: <strong>{signal.location}</strong></span>
                    <span>Credibility: <strong>{signal.credibility}</strong></span>
                    <span>Risk: <strong className={riskTone(signal.risk)}>{signal.risk}/100</strong></span>
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 text-sm sm:grid-cols-6">
                    <div><div className="metric-label">Engagement</div><div className="metric-value">{signal.engagement.toLocaleString()}</div></div>
                    <div><div className="metric-label">Likes/upvotes</div><div className="metric-value">{signal.likes.toLocaleString()}</div></div>
                    <div><div className="metric-label">Comments</div><div className="metric-value">{signal.comments.toLocaleString()}</div></div>
                    <div><div className="metric-label">Shares</div><div className="metric-value">{signal.shares.toLocaleString()}</div></div>
                    <div><div className="metric-label">Sentiment</div><div className="metric-value text-emerald-600">{signal.sentiment}</div></div>
                    <div><div className="metric-label">Velocity</div><div className="metric-value text-blue-600">{signal.velocity}</div></div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
            <div className="panel p-4 md:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">Fake Rumour Detection</h2>
                  <p className="mt-1 text-sm text-slate-400">Claim-level verification across text, image, video, and social content.</p>
                  <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-500">
                    <span>Total rumours <strong className="text-slate-800">{analytics.rumours}</strong></span>
                    <span>Verified <strong className="text-emerald-600">{analytics.positive}</strong></span>
                    <span>Suspicious <strong className="text-amber-600">{analytics.neutral}</strong></span>
                    <span>Unverified <strong className="text-slate-700">{analytics.negative}</strong></span>
                    <span>High-risk <strong className="text-rose-600">{analytics.highRisk}</strong></span>
                  </div>
                </div>
                <span className="rounded-full border border-violet-400/30 bg-violet-500/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-violet-300">AI triage</span>
              </div>
              <div className="space-y-3">
                {rumours.map((rumour) => (
                  <article key={rumour.claim} className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
                      <RiskGauge score={rumour.risk} label="Risk" />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full border px-2 py-1 text-[10px] uppercase tracking-[0.16em] ${statusTone(rumour.status)}`}>{rumour.status}</span>
                          <span className="text-xs text-slate-500">{rumour.type}</span>
                        </div>
                        <h3 className="mt-2 text-sm font-semibold leading-6 text-white">{rumour.claim}</h3>
                        <div className="mt-3 flex flex-wrap items-center gap-1 text-[10px] uppercase tracking-wide text-slate-500">
                          {['Claim', 'Source verification', 'Cross-platform matching', 'Media verification', 'Risk assessment', 'Final verdict'].map((step, stepIndex) => <span key={step} className="flex items-center gap-1"><span className={stepIndex < 4 ? 'text-blue-600' : 'text-slate-500'}>{step}</span>{stepIndex < 5 && <span>→</span>}</span>)}
                        </div>
                        <p className="mt-2 text-xs leading-5 text-slate-400"><span className="text-slate-300">Evidence:</span> {rumour.evidence}</p>
                        <div className="mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
                          <span>Misinfo <strong className={riskTone(rumour.misinformation)}>{rumour.misinformation}%</strong></span>
                          <span>Confidence <strong className="text-cyan-300">{rumour.confidence}%</strong></span>
                          <span>Credibility <strong className="text-slate-200">{rumour.credibility}</strong></span>
                          <span>Matched on <strong className="text-violet-300">{rumour.platforms} platforms</strong></span>
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="panel p-4 md:p-5">
              <h2 className="text-lg font-semibold text-white">Risk distribution</h2>
              <p className="mt-1 text-sm text-slate-400">Current claim queue by severity.</p>
              <div className="mt-3 h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={riskDistribution} dataKey="value" nameKey="name" innerRadius={52} outerRadius={78} paddingAngle={4}>
                      {riskDistribution.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                    </Pie>
                    <Tooltip contentStyle={{ backgroundColor: '#020817', border: '1px solid #334155', borderRadius: '0.75rem' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {riskDistribution.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2 text-slate-300"><span className="h-2 w-2 rounded-full" style={{ backgroundColor: item.color }} />{item.name}</span>
                    <span className="font-medium text-slate-100">{item.value}%</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="panel mb-6 p-4 md:p-5">
            <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Fake Rumour &amp; Media Verification</h2>
                <p className="mt-1 text-sm text-slate-500">Upload an image or video for a transparent demo analysis. No file leaves this browser.</p>
              </div>
              <span className="rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs uppercase tracking-[0.16em] text-blue-700">Demo analysis engine</span>
            </div>
            <label
              htmlFor="media-upload"
              className="flex min-h-36 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed border-blue-200 bg-blue-50/40 p-6 text-center transition hover:border-blue-400 hover:bg-blue-50"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => { event.preventDefault(); handleFile(event.dataTransfer.files[0]) }}
            >
              <span className="text-base font-semibold text-slate-800">Drag &amp; Drop Media Here</span>
              <span className="my-2 text-sm text-slate-500">OR</span>
              <span className="button-primary">Upload Image / Video</span>
              <span className="mt-3 text-xs text-slate-500">JPG, JPEG, PNG, WEBP, MP4, MOV, AVI</span>
              <input id="media-upload" type="file" accept=".jpg,.jpeg,.png,.webp,.mp4,.mov,.avi" className="sr-only" onChange={(event) => handleFile(event.target.files?.[0])} />
            </label>
            <div className="mt-4 grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                {selectedFile && previewUrl ? (
                  selectedFile.type.startsWith('video/')
                    ? <video src={previewUrl} controls className="max-h-56 w-full rounded-md bg-slate-900 object-contain" />
                    : <img src={previewUrl} alt="Uploaded media preview" className="max-h-56 w-full rounded-md object-contain" />
                ) : (
                  <div className="flex h-40 items-center justify-center text-sm text-slate-400">Preview appears here after upload</div>
                )}
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  <div>File: <strong className="text-slate-700">{selectedFile?.name ?? '—'}</strong></div>
                  <div>Size: <strong className="text-slate-700">{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB` : '—'}</strong></div>
                  <div>Type: <strong className="text-slate-700">{selectedFile?.type || '—'}</strong></div>
                  <div>Status: <strong className="text-blue-700">{uploadStatus}</strong></div>
                </div>
                <button type="button" disabled={!selectedFile} onClick={analyzeMedia} className="button-primary mt-4 w-full disabled:cursor-not-allowed disabled:opacity-40">Analyze Media</button>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <RiskGauge score={analysis.risk} label="Risk score" />
                  <div>
                    <div className="text-sm text-slate-500">{selectedFile ? analysis.asset : 'No upload selected — showing reference analysis'}</div>
                    <h3 className={`mt-1 text-lg font-semibold ${riskTone(analysis.risk)}`}>{analysis.risk}/100 · {analysis.level} RISK</h3>
                    <p className="mt-2 text-sm text-slate-600">{analysis.verdict}</p>
                  </div>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Fake probability', `${analysis.manipulation}%`],
                    ['Authenticity score', `${analysis.authenticity}%`],
                    ['Manipulation probability', `${analysis.manipulation}%`],
                    ['Deepfake probability', `${analysis.deepfake}%`],
                    ['Source credibility', analysis.source],
                    ['Metadata anomaly', analysis.metadata],
                    ['Visual anomaly', analysis.visual],
                    ['Reverse/source verification', 'Not matched to a verified source'],
                  ].map(([label, value]) => <div key={label} className="rounded-md border border-slate-100 bg-slate-50 px-3 py-2"><div className="text-xs text-slate-500">{label}</div><div className="mt-1 text-sm font-medium text-slate-800">{value}</div></div>)}
                </div>
                {analysis.mediaType === 'Video' && <div className="mt-4 border-t border-slate-100 pt-4"><div className="mb-2 flex justify-between text-xs text-slate-500"><span>Frame anomaly timeline</span><span>{analysis.suspiciousFrames}% suspicious frames</span></div><div className="flex h-5 gap-1 overflow-hidden rounded bg-slate-100">{Array.from({ length: 24 }, (_, index) => <span key={index} className={`flex-1 ${index % 5 === 0 || index > 16 ? 'bg-rose-400' : 'bg-emerald-200'}`} />)}</div><div className="mt-2 text-xs text-slate-500">Face manipulation: {analysis.faceManipulation}% · Audio-video sync risk: {analysis.syncRisk}%</div></div>}
              </div>
            </div>
          </section>

          <section className="panel mb-6 p-4 md:p-5">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-slate-900">Cross-Platform Rumour Tracking</h2>
                <p className="mt-1 text-sm text-slate-500">Similar claims are grouped into one traceable propagation cluster.</p>
              </div>
              <span className="text-xs uppercase tracking-[0.16em] text-blue-600">Cluster #104</span>
            </div>
            <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <div className="text-sm font-semibold text-slate-900">“The national grid will be offline for 72 hours”</div>
                <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <div><div className="metric-label">First detected</div><div className="metric-value">08:14 UTC</div></div>
                  <div><div className="metric-label">Latest activity</div><div className="metric-value">10:41 UTC</div></div>
                  <div><div className="metric-label">Spread velocity</div><div className="metric-value text-rose-600">4.8x / hour</div></div>
                  <div><div className="metric-label">Engagement</div><div className="metric-value">38.4K</div></div>
                </div>
                <div className="mt-4"><div className="metric-label">Risk score</div><div className="mt-1 flex items-center gap-3"><div className="h-2 flex-1 rounded-full bg-slate-200"><div className="h-2 rounded-full bg-rose-500" style={{ width: '86%' }} /></div><strong className="text-rose-600">86/100</strong></div></div>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white p-6 text-sm font-semibold text-slate-700">
                {['Reddit', 'YouTube', 'X', 'News'].map((platform, index) => <div key={platform} className="flex items-center gap-2"><span className={`flex h-12 w-12 items-center justify-center rounded-full border-2 ${index === 3 ? 'border-rose-400 bg-rose-50 text-rose-700' : 'border-blue-200 bg-blue-50 text-blue-700'}`}>{platform}</span>{index < 3 && <span className="text-blue-500">→</span>}</div>)}
              </div>
            </div>
          </section>

          <section className="mb-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
            <div className="panel p-4 md:p-5">
              <div className="mb-5 flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-white">AI Media Risk Analysis</h2>
                  <p className="mt-1 text-sm text-slate-400">Multimodal integrity signals for analyzed uploads.</p>
                </div>
                <span className="rounded-full border border-rose-400/30 bg-rose-500/10 px-3 py-1 text-xs uppercase tracking-[0.16em] text-rose-300">{analysis.mediaType}</span>
              </div>
              <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <RiskGauge score={analysis.risk} label="Media risk" />
                  <div>
                    <div className="text-sm text-slate-400">{analysis.asset}</div>
                    <h3 className="mt-1 text-lg font-semibold text-rose-300">{analysis.verdict}</h3>
                    <div className="mt-3 h-2 w-full min-w-52 overflow-hidden rounded-full bg-slate-800">
                      <div className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-amber-400 to-rose-400" style={{ width: `${analysis.risk}%` }} />
                    </div>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  {[
                    ['Deepfake probability', `${analysis.deepfake}%`],
                    ['Manipulation probability', `${analysis.manipulation}%`],
                    ['Authenticity score', `${analysis.authenticity}%`],
                    ['Metadata anomalies', analysis.metadata],
                    ['Source reliability', analysis.source],
                    ['Suspicious frames', `${analysis.suspiciousFrames}%`],
                    ['Face manipulation', `${analysis.faceManipulation}%`],
                    ['A/V sync risk', `${analysis.syncRisk}%`],
                  ].map(([label, value]) => (
                    <div key={label} className="rounded-lg border border-slate-800 bg-slate-950/60 px-3 py-2">
                      <div className="text-xs text-slate-500">{label}</div>
                      <div className={`mt-1 text-sm font-medium ${label.includes('probability') || label.includes('risk') || label.includes('frames') || label.includes('manipulation') ? riskTone(Number.parseInt(value, 10)) : 'text-slate-100'}`}>{value}</div>
                    </div>
                  ))}
                </div>
                <div className="mt-4 space-y-2 border-t border-slate-800 pt-4 text-xs text-slate-400">
                  <div><span className="text-slate-200">Visual:</span> {analysis.visual}</div>
                  <div><span className="text-slate-200">Audio:</span> {analysis.audio}</div>
                </div>
              </div>
            </div>

            <div className="panel p-4 md:p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-white">Rumour propagation</h2>
                  <p className="mt-1 text-sm text-slate-400">Spread velocity and platform matching over the last 5 hours.</p>
                </div>
                <span className="text-xs uppercase tracking-[0.16em] text-cyan-300">Cross-platform</span>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={spreadTimeline}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="time" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#020817', border: '1px solid #334155', borderRadius: '0.75rem' }} />
                    <Line type="monotone" dataKey="mentions" stroke="#22d3ee" strokeWidth={3} dot={{ r: 3 }} />
                    <Line type="monotone" dataKey="platforms" stroke="#a78bfa" strokeWidth={2} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-400">
                <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-cyan-400" />Mentions</span>
                <span><span className="mr-2 inline-block h-2 w-2 rounded-full bg-violet-400" />Platforms matching</span>
              </div>
              <div className="mt-6 h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={platformRisk}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis dataKey="platform" stroke="#94a3b8" />
                    <YAxis stroke="#94a3b8" />
                    <Tooltip contentStyle={{ backgroundColor: '#020817', border: '1px solid #334155', borderRadius: '0.75rem' }} />
                    <Bar dataKey="claims" fill="#fb7185" radius={[5, 5, 0, 0]} />
                    <Bar dataKey="confirmed" fill="#34d399" radius={[5, 5, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </section>

        </div>
        </div>
        </main>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppContents />
    </QueryClientProvider>
  )
}
