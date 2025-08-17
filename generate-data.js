// Generate metrics for OpenObserve
const https = require('http');

const sendMetrics = () => {
  const metrics = {
    cpu_usage: Math.random() * 100,
    memory_usage: Math.random() * 100,
    requests_per_sec: Math.floor(Math.random() * 1000) + 100,
    error_rate: Math.random() * 5,
    response_time: Math.floor(Math.random() * 200) + 20,
    active_connections: Math.floor(Math.random() * 500) + 100,
    disk_usage: Math.random() * 90,
    network_io: Math.random() * 1000,
    cache_hit_rate: 85 + Math.random() * 15,
    threats_blocked: Math.floor(Math.random() * 50)
  };

  const data = JSON.stringify({
    ...metrics,
    timestamp: Date.now(),
    source: 'aardi-simulator',
    environment: 'production'
  });

  const options = {
    hostname: 'localhost',
    port: 5080,
    path: '/api/default/default/_json',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Authorization': 'Basic ' + Buffer.from('admin@aardi.com:aardi123').toString('base64')
    }
  };

  const req = https.request(options, (res) => {
    if (res.statusCode === 200 || res.statusCode === 201) {
      console.log('✅ Metrics sent:', new Date().toLocaleTimeString(), '-', 
        `CPU: ${metrics.cpu_usage.toFixed(1)}%`,
        `Mem: ${metrics.memory_usage.toFixed(1)}%`,
        `Req/s: ${metrics.requests_per_sec}`
      );
    } else {
      console.log('Response status:', res.statusCode);
    }
  });

  req.on('error', (error) => {
    console.error('Error sending metrics:', error.message);
  });

  req.write(data);
  req.end();
};

// Send initial metric
sendMetrics();

// Send metrics every 2 seconds
setInterval(sendMetrics, 2000);

console.log('🚀 Generating telemetry data for OpenObserve...');
console.log('📊 Data is being sent to http://localhost:5080');
console.log('Press Ctrl+C to stop');
