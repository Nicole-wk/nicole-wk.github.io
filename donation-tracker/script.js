let donations = [];
let chart = null;

// Load saved data when page opens
function loadData() {
    const saved = localStorage.getItem('donations');
    if (saved) {
        donations = JSON.parse(saved);
    }
    updateDashboard();
}

// Save data automatically
function saveData() {
    localStorage.setItem('donations', JSON.stringify(donations));
}

// Add new donation
function addDonation() {
    const name = document.getElementById('donorName').value;
    const amount = parseFloat(document.getElementById('donationAmount').value);
    const date = document.getElementById('donationDate').value;
    const category = document.getElementById('donationCategory').value;
    
    if (!name || !amount || !date) {
        alert('Please fill in all fields');
        return;
    }
    
    if (amount <= 0) {
        alert('Amount must be greater than 0');
        return;
    }
    
    donations.push({
        id: Date.now(),
        name: name,
        amount: amount,
        date: date,
        category: category
    });
    
    // Clear form
    document.getElementById('donorName').value = '';
    document.getElementById('donationAmount').value = '';
    document.getElementById('donationDate').value = '';
    
    saveData();
    updateDashboard();
}

// Delete a donation
function deleteDonation(id) {
    donations = donations.filter(d => d.id !== id);
    saveData();
    updateDashboard();
}

// Calculate statistics
function calculateStats() {
    const total = donations.reduce((sum, d) => sum + d.amount, 0);
    const uniqueDonors = [...new Set(donations.map(d => d.name))].length;
    const avg = donations.length > 0 ? total / donations.length : 0;
    
    return { total, uniqueDonors, avg };
}

// Update the entire dashboard
function updateDashboard() {
    const stats = calculateStats();
    
    document.getElementById('totalRaised').innerHTML = `$${stats.total.toFixed(2)}`;
    document.getElementById('totalDonors').innerHTML = stats.uniqueDonors;
    document.getElementById('avgDonation').innerHTML = `$${stats.avg.toFixed(2)}`;
    
    displayDonationList();
    updateChart();
}

// Show list of donations
function displayDonationList() {
    const container = document.getElementById('donationTable');
    
    if (donations.length === 0) {
        container.innerHTML = '<p>No donations recorded yet. Add your first donation above!</p>';
        return;
    }
    
    let html = '<table><tr><th>Date</th><th>Donor</th><th>Amount</th><th>Type</th><th></th></tr>';
    
    // Show most recent first
    [...donations].reverse().forEach(d => {
        html += `
            <tr>
                <td>${d.date}</td>
                <td>${d.name}</td>
                <td>$${d.amount.toFixed(2)}</td>
                <td>${d.category}</td>
                <td><button class="delete-btn" onclick="deleteDonation(${d.id})">Delete</button></td>
            </tr>
        `;
    });
    
    html += '</table>';
    container.innerHTML = html;
}

// Create the chart
function updateChart() {
    // Group donations by month
    const monthlyData = {};
    
    donations.forEach(d => {
        const month = d.date.substring(0, 7); // Gets "2024-01"
        monthlyData[month] = (monthlyData[month] || 0) + d.amount;
    });
    
    const months = Object.keys(monthlyData).sort();
    const amounts = months.map(m => monthlyData[m]);
    
    const ctx = document.getElementById('donationChart').getContext('2d');
    
    if (chart) {
        chart.destroy();
    }
    
    chart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: months,
            datasets: [{
                label: 'Donations ($)',
                data: amounts,
                borderColor: '#27ae60',
                backgroundColor: 'rgba(39, 174, 96, 0.1)',
                tension: 0.3
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Donations Over Time'
                }
            }
        }
    });
}

// Export to CSV (for Excel)
function exportToCSV() {
    if (donations.length === 0) {
        alert('No data to export');
        return;
    }
    
    let csv = 'Donor Name,Amount ($),Date,Category\n';
    
    donations.forEach(d => {
        csv += `"${d.name}",${d.amount},${d.date},${d.category}\n`;
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `donations_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

// Clear all data
function clearAllData() {
    if (confirm('⚠️ Are you sure? This will delete ALL donation records.')) {
        donations = [];
        saveData();
        updateDashboard();
    }
}

// Initialize
loadData();
