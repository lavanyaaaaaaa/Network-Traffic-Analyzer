// Global variables
let protocolChart;
let updateInterval;
const MAX_ALERTS = 20;
const UPDATE_INTERVAL = 2000; // 2 seconds

// DOM elements
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusEl = document.getElementById('status');
const interfaceSelect = document.getElementById('interfaceSelect');
const totalPacketsEl = document.getElementById('totalPackets');
const packetsPerSecEl = document.getElementById('packetsPerSec');
const talkersTable = document.getElementById('talkersTable').querySelector('tbody');
const alertsContainer = document.getElementById('alertsContainer');

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    // Load available network interfaces
    fetch('/interfaces')
        .then(response => response.json())
        .then(data => {
            data.interfaces.forEach(iface => {
                const option = document.createElement('option');
                option.value = iface;
                option.textContent = iface;
                interfaceSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error('Error loading interfaces:', error);
        });

    // Set up event listeners
    startBtn.addEventListener('click', startCapture);
    stopBtn.addEventListener('click', stopCapture);
});

function startCapture() {
    const interface = interfaceSelect.value;
    
    fetch(`/start_capture?interface=${encodeURIComponent(interface)}`)
        .then(response => {
            if (!response.ok) throw new Error('Failed to start capture');
            return response.json();
        })
        .then(data => {
            statusEl.textContent = 'Status: Running';
            statusEl.className = 'status running';
            startBtn.disabled = true;
            stopBtn.disabled = false;
            interfaceSelect.disabled = true;
            
            // Start updating stats
            updateStats();
            updateInterval = setInterval(updateStats, UPDATE_INTERVAL);
        })
        .catch(error => {
            console.error('Error starting capture:', error);
            statusEl.textContent = 'Status: Error - see console';
            statusEl.className = 'status error';
        });
}

function stopCapture() {
    fetch('/stop_capture')
        .then(response => {
            if (!response.ok) throw new Error('Failed to stop capture');
            return response.json();
        })
        .then(data => {
            clearInterval(updateInterval);
            statusEl.textContent = 'Status: Stopped';
            statusEl.className = 'status stopped';
            startBtn.disabled = false;
            stopBtn.disabled = true;
            interfaceSelect.disabled = false;
        })
        .catch(error => {
            console.error('Error stopping capture:', error);
            statusEl.textContent = 'Status: Error - see console';
            statusEl.className = 'status error';
        });
}

function updateStats() {
    fetch('/get_stats')
        .then(response => {
            if (!response.ok) throw new Error('Network response was not ok');
            return response.json();
        })
        .then(data => {
            // Update basic stats
            totalPacketsEl.textContent = data.total_packets.toLocaleString();
            packetsPerSecEl.textContent = data.packets_per_sec.toFixed(2);
            
            // Update protocol chart
            updateProtocolChart(data.protocols);
            
            // Update top talkers table
            updateTopTalkers(data.top_talkers);
            
            // Update alerts
            updateAlerts(data.alerts);
        })
        .catch(error => {
            console.error('Error fetching stats:', error);
            statusEl.textContent = 'Status: Error - see console';
            statusEl.className = 'status error';
        });
}

function updateProtocolChart(protocolData) {
    const ctx = document.getElementById('protocolChart').getContext('2d');
    const labels = Object.keys(protocolData);
    const data = Object.values(protocolData);
    
    if (protocolChart) {
        protocolChart.data.labels = labels;
        protocolChart.data.datasets[0].data = data;
        protocolChart.update();
    } else {
        protocolChart = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        '#FF6384', // TCP
                        '#36A2EB', // UDP
                        '#FFCE56', // ICMP
                        '#4BC0C0', // Other
                        '#9966FF'
                    ],
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

function updateTopTalkers(talkersData) {
    // Sort by packet count (descending)
    const sortedTalkers = Object.entries(talkersData)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10); // Show top 10
    
    talkersTable.innerHTML = '';
    
    sortedTalkers.forEach(([ip, count]) => {
        const row = document.createElement('tr');
        
        const ipCell = document.createElement('td');
        ipCell.textContent = ip;
        
        const countCell = document.createElement('td');
        countCell.textContent = count.toLocaleString();
        
        row.appendChild(ipCell);
        row.appendChild(countCell);
        talkersTable.appendChild(row);
    });
}

function updateAlerts(alerts) {
    // Limit number of displayed alerts
    const recentAlerts = alerts.slice(-MAX_ALERTS).reverse();
    
    alertsContainer.innerHTML = '';
    
    if (recentAlerts.length === 0) {
        const noAlerts = document.createElement('div');
        noAlerts.className = 'alert info';
        noAlerts.textContent = 'No security alerts detected';
        alertsContainer.appendChild(noAlerts);
        return;
    }
    
    recentAlerts.forEach(alert => {
        const alertEl = document.createElement('div');
        alertEl.className = 'alert warning';
        alertEl.textContent = alert;
        alertsContainer.appendChild(alertEl);
    });
}