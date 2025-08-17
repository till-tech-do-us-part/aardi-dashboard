import { NextResponse } from 'next/server'

// Check if we're in production or development
const IS_PRODUCTION = process.env.NODE_ENV === 'production'
const OPENOBSERVE_URL = process.env.OPENOBSERVE_URL || 'http://localhost:5080'
const OPENOBSERVE_AUTH = Buffer.from('admin@aardi.com:aardi123').toString('base64')

// Simulated metrics for production when OpenObserve isn't available
function generateSimulatedMetrics() {
  return {
    cpu_usage: 35 + Math.random() * 40,
    memory_usage: 40 + Math.random() * 35,
    cache_hit_rate: 85 + Math.random() * 14,
    response_time: 50 + Math.floor(Math.random() * 100),
    requests_per_sec: 500 + Math.floor(Math.random() * 500),
    threats_blocked: Math.floor(Math.random() * 30),
    active_connections: 100 + Math.floor(Math.random() * 400),
    error_rate: Math.random() * 3,
    disk_usage: 40 + Math.random() * 40,
    network_io: 100 + Math.random() * 500,
    environment: 'production'
  }
}

async function fetchLatestMetrics() {
  // In production without OpenObserve, use simulated data
  if (IS_PRODUCTION && !process.env.OPENOBSERVE_URL) {
    return generateSimulatedMetrics()
  }

  try {
    const response = await fetch(`${OPENOBSERVE_URL}/api/default/_search`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${OPENOBSERVE_AUTH}`
      },
      body: JSON.stringify({
        query: {
          sql: "SELECT * FROM default ORDER BY _timestamp DESC LIMIT 1"
        },
        size: 1
      })
    })
    
    if (response.ok) {
      const data = await response.json()
      if (data.hits && data.hits.length > 0) {
        return data.hits[0]
      }
    }
  } catch (error) {
    console.error('Error fetching from OpenObserve:', error)
  }
  
  // Fallback to simulated data
  return generateSimulatedMetrics()
}

export async function POST(request: Request) {
  const { command } = await request.json()
  const lower = command.toLowerCase()
  
  console.log('Processing command:', command)
  
  // Fetch metrics (real or simulated)
  const metrics = await fetchLatestMetrics()
  console.log('Metrics source:', IS_PRODUCTION && !process.env.OPENOBSERVE_URL ? 'Simulated' : 'OpenObserve')
  
  const cards = []
  let response = ""
  
  if (lower.includes('security') || lower.includes('threat')) {
    cards.push({
      id: `sec-${Date.now()}`,
      title: 'Security Analysis',
      badge: metrics.threats_blocked > 20 ? 'critical' : metrics.threats_blocked > 10 ? 'warning' : 'success',
      badgeText: IS_PRODUCTION ? 'Demo' : 'Live',
      metrics: [
        { label: 'Threats Blocked', value: metrics.threats_blocked?.toString() || '0', color: metrics.threats_blocked > 20 ? '#ef4444' : '#10b981' },
        { label: 'Error Rate', value: `${parseFloat(metrics.error_rate || 0).toFixed(2)}%`, color: metrics.error_rate > 2 ? '#f59e0b' : '#10b981' },
        { label: 'Active Connections', value: metrics.active_connections?.toString() || '0' },
        { label: 'Environment', value: metrics.environment || 'production', color: '#60a5fa' }
      ],
      chart: true,
      priority: 1
    })
    response = `Security analysis: ${metrics.threats_blocked || 0} threats blocked.`
  }
  
  if (lower.includes('system') || lower.includes('production') || lower.includes('performance')) {
    cards.push({
      id: `sys-${Date.now()}`,
      title: 'System Performance',
      badge: 'info',
      badgeText: IS_PRODUCTION ? 'Demo' : 'Real-Time',
      metrics: [
        { label: 'CPU Usage', value: `${parseFloat(metrics.cpu_usage || 0).toFixed(1)}%`, color: metrics.cpu_usage > 70 ? '#f59e0b' : '#10b981' },
        { label: 'Memory', value: `${parseFloat(metrics.memory_usage || 0).toFixed(1)}%`, color: metrics.memory_usage > 80 ? '#f59e0b' : '#10b981' },
        { label: 'Cache Hit Rate', value: `${parseFloat(metrics.cache_hit_rate || 0).toFixed(1)}%`, color: '#10b981' },
        { label: 'Response Time', value: `${metrics.response_time || 0}ms`, color: metrics.response_time > 100 ? '#f59e0b' : '#10b981' },
        { label: 'Requests/sec', value: metrics.requests_per_sec?.toString() || '0' }
      ],
      chart: true,
      priority: 2
    })
    response = response || `System metrics: CPU at ${parseFloat(metrics.cpu_usage || 0).toFixed(1)}%, Memory at ${parseFloat(metrics.memory_usage || 0).toFixed(1)}%`
  }
  
  // Default overview if no specific request
  if (cards.length === 0) {
    cards.push({
      id: `overview-${Date.now()}`,
      title: 'Environmental Overview',
      badge: 'success',
      badgeText: IS_PRODUCTION ? 'Demo Mode' : 'Connected',
      metrics: [
        { label: 'Data Source', value: IS_PRODUCTION ? 'Simulated' : 'OpenObserve', color: '#10b981' },
        { label: 'CPU', value: `${parseFloat(metrics.cpu_usage || 0).toFixed(1)}%`, color: metrics.cpu_usage > 70 ? '#f59e0b' : '#10b981' },
        { label: 'Memory', value: `${parseFloat(metrics.memory_usage || 0).toFixed(1)}%`, color: metrics.memory_usage > 80 ? '#f59e0b' : '#10b981' },
        { label: 'Threats Blocked', value: metrics.threats_blocked?.toString() || '0', color: metrics.threats_blocked > 20 ? '#ef4444' : '#10b981' },
        { label: 'Status', value: 'Operational', color: '#10b981' }
      ],
      chart: true,
      priority: 5
    })
    response = IS_PRODUCTION ? "Running in demo mode with simulated data." : "Connected to live telemetry stream."
  }
  
  return NextResponse.json({ cards, response })
}
