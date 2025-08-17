import { NextResponse } from 'next/server'

// OpenObserve connection
const OPENOBSERVE_URL = 'http://localhost:5080'
const OPENOBSERVE_AUTH = Buffer.from('admin@aardi.com:aardi123').toString('base64')

async function fetchLatestMetrics() {
  try {
    // Query the default stream for latest metrics
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
      console.log('OpenObserve response:', JSON.stringify(data, null, 2))
      
      // Get the first hit
      if (data.hits && data.hits.length > 0) {
        return data.hits[0]
      }
    } else {
      console.error('OpenObserve query failed:', response.status, await response.text())
    }
  } catch (error) {
    console.error('Error fetching from OpenObserve:', error)
  }
  return null
}

export async function POST(request: Request) {
  const { command } = await request.json()
  const lower = command.toLowerCase()
  
  console.log('Processing command:', command)
  
  // Fetch real metrics from OpenObserve
  const liveData = await fetchLatestMetrics()
  console.log('Live data retrieved:', liveData ? 'Yes' : 'No')
  
  const cards = []
  let response = ""
  
  // Extract metrics from the OpenObserve data
  const metrics = liveData || {}
  
  if (lower.includes('security') || lower.includes('threat')) {
    cards.push({
      id: `sec-${Date.now()}`,
      title: 'Security Analysis',
      badge: metrics.threats_blocked > 20 ? 'critical' : metrics.threats_blocked > 10 ? 'warning' : 'success',
      badgeText: 'Live',
      metrics: [
        { label: 'Threats Blocked', value: metrics.threats_blocked?.toString() || '0', color: metrics.threats_blocked > 20 ? '#ef4444' : '#10b981' },
        { label: 'Error Rate', value: `${parseFloat(metrics.error_rate || 0).toFixed(2)}%`, color: metrics.error_rate > 2 ? '#f59e0b' : '#10b981' },
        { label: 'Active Connections', value: metrics.active_connections?.toString() || '0' },
        { label: 'Environment', value: metrics.environment || 'production', color: '#60a5fa' }
      ],
      chart: true,
      priority: 1
    })
    response = `Security analysis from OpenObserve: ${metrics.threats_blocked || 0} threats blocked.`
  }
  
  if (lower.includes('system') || lower.includes('production') || lower.includes('performance')) {
    cards.push({
      id: `sys-${Date.now()}`,
      title: 'System Performance',
      badge: 'info',
      badgeText: 'Real-Time',
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
    response = response || `Live system metrics from OpenObserve: CPU at ${parseFloat(metrics.cpu_usage || 0).toFixed(1)}%, Memory at ${parseFloat(metrics.memory_usage || 0).toFixed(1)}%`
  }
  
  if (lower.includes('network') || lower.includes('traffic')) {
    cards.push({
      id: `net-${Date.now()}`,
      title: 'Network Status',
      badge: 'success',
      badgeText: 'Healthy',
      metrics: [
        { label: 'Network I/O', value: `${parseFloat(metrics.network_io || 0).toFixed(0)} Mbps` },
        { label: 'Active Connections', value: metrics.active_connections?.toString() || '0' },
        { label: 'Requests/sec', value: metrics.requests_per_sec?.toString() || '0' },
        { label: 'Response Time', value: `${metrics.response_time || 0}ms` }
      ],
      chart: false,
      priority: 3
    })
    response = response || `Network performance is stable with ${metrics.active_connections || 0} active connections.`
  }
  
  // Default overview if no specific request
  if (cards.length === 0 || lower.includes('everything') || lower.includes('overview') || lower.includes('status')) {
    cards.push({
      id: `overview-${Date.now()}`,
      title: 'Live Telemetry Overview',
      badge: 'success',
      badgeText: 'OpenObserve',
      metrics: [
        { label: 'Data Source', value: 'OpenObserve', color: '#10b981' },
        { label: 'CPU', value: `${parseFloat(metrics.cpu_usage || 0).toFixed(1)}%`, color: metrics.cpu_usage > 70 ? '#f59e0b' : '#10b981' },
        { label: 'Memory', value: `${parseFloat(metrics.memory_usage || 0).toFixed(1)}%`, color: metrics.memory_usage > 80 ? '#f59e0b' : '#10b981' },
        { label: 'Threats Blocked', value: metrics.threats_blocked?.toString() || '0', color: metrics.threats_blocked > 20 ? '#ef4444' : '#10b981' },
        { label: 'Cache Hit', value: `${parseFloat(metrics.cache_hit_rate || 0).toFixed(1)}%`, color: '#10b981' },
        { label: 'Last Update', value: new Date().toLocaleTimeString(), color: '#60a5fa' }
      ],
      chart: true,
      priority: 5
    })
    response = liveData ? "Connected to OpenObserve live telemetry stream." : "Connecting to OpenObserve..."
  }
  
  console.log('Returning', cards.length, 'cards')
  
  return NextResponse.json({ cards, response })
}
