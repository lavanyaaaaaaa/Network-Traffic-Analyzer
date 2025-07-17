let packets = [];
let paused = false;
let chart;
let captureInterval = null;

function startCapture() {
    paused = false;
    if (!captureInterval) {
        simulatePacketFlow();
    }
}

function pauseCapture() {
    paused = true;
}

function resumeCapture() {
    paused = false;
}

function stopCapture() {
    paused = true;
    clearInterval(captureInterval);
    captureInterval = null;
    packets = [];
    updateTable();
    updateChart();
}

function clearData() {
    packets = [];
    updateTable();
    updateChart();
}

function toggleTheme() {
    document.body.classList.toggle('dark-mode');
    const isDark = document.body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    document.getElementById('themeToggle').innerText = isDark ? 'Light Mode' : 'Dark Mode';
}

function loadTheme() {
    const saved = localStorage.getItem('theme');
    if (saved === 'dark') {
        document.body.classList.add('dark-mode');
        document.getElementById('themeToggle').innerText = 'Light Mode';
    }
}

function exportCSV() {
    if (!packets.length) return;
    const rows = [['#', 'Source', 'Destination', 'Protocol'], ...packets.map((p, i) => [i+1, p.src, p.dst, p.proto])];
    const csvContent = rows.map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "packets.csv";
    link.click();
}

function updateTable() {
    const table = document.getElementById("packetTable");
    table.innerHTML = "";
    packets.forEach((p, i) => {
        const row = `<tr><td>${i+1}</td><td>${p.src}</td><td>${p.dst}</td><td>${p.proto}</td></tr>`;
        table.innerHTML += row;
    });
}

function updateChart() {
    const counts = {};
    packets.forEach(p => counts[p.proto] = (counts[p.proto] || 0) + 1);
    const data = {
        labels: Object.keys(counts),
        datasets: [{
            label: 'Protocol Count',
            data: Object.values(counts),
            backgroundColor: ['#0d6efd', '#198754', '#ffc107', '#dc3545']
        }]
    };
    if (chart) chart.destroy();
    chart = new Chart(document.getElementById('protocolChart'), {
        type: 'bar',
        data: data
    });
}

function simulatePacketFlow() {
    captureInterval = setInterval(() => {
        if (paused) return;
        const proto = ['TCP', 'UDP', 'ICMP'][Math.floor(Math.random()*3)];
        packets.push({ src: '192.168.1.' + Math.floor(Math.random()*255), dst: '10.0.0.' + Math.floor(Math.random()*255), proto });
        updateTable();
        updateChart();
    }, 1000);
}

window.onload = () => {
    loadTheme();
};