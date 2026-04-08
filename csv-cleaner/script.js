// Global variables
let originalData = [];
let cleanedData = [];
let headers = [];

// Load CSV when file is selected
document.getElementById('csvFile').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(event) {
        const text = event.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
});

// Parse CSV text into array of objects
function parseCSV(text) {
    const lines = text.split('\n').filter(line => line.trim());
    
    if (lines.length === 0) {
        alert('Empty file');
        return;
    }
    
    // Get headers from first line
    headers = lines[0].split(',').map(h => h.replace(/["']/g, '').trim());
    
    // Parse data rows
    originalData = [];
    for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.replace(/["']/g, '').trim());
        
        // Skip rows that don't match header count
        if (values.length !== headers.length) continue;
        
        const row = {};
        headers.forEach((h, idx) => {
            row[h] = values[idx] || '';
        });
        originalData.push(row);
    }
    
    cleanedData = [...originalData];
    
    // Show options card
    document.getElementById('optionsCard').style.display = 'block';
    
    // Show preview
    showPreview(originalData, 'Original Data (First 10 rows)');
    
    console.log(`Loaded ${originalData.length} rows`); // Debug
}

// Clean the data
function cleanData() {
    console.log('Cleaning started...'); // Debug
    
    let data = [...originalData];
    const stats = {
        originalRows: data.length,
        removedEmpty: 0,
        removedDuplicates: 0,
        fixedDates: 0
    };
    
    // 1. Remove empty rows (rows where all fields are empty)
    if (document.getElementById('removeEmptyRows').checked) {
        const before = data.length;
        data = data.filter(row => {
            return Object.values(row).some(val => val && val.trim() !== '');
        });
        stats.removedEmpty = before - data.length;
        console.log(`Removed ${stats.removedEmpty} empty rows`);
    }
    
    // 2. Trim spaces
    if (document.getElementById('trimSpaces').checked) {
        data = data.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                newRow[key] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            });
            return newRow;
        });
        console.log('Trimmed spaces');
    }
    
    // 3. Remove duplicate rows
    if (document.getElementById('removeDuplicates').checked) {
        const before = data.length;
        const seen = new Set();
        data = data.filter(row => {
            const key = JSON.stringify(row);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
        stats.removedDuplicates = before - data.length;
        console.log(`Removed ${stats.removedDuplicates} duplicates`);
    }
    
    // 4. Fix dates (simple version)
    if (document.getElementById('fixDates').checked) {
        data = data.map(row => {
            Object.keys(row).forEach(key => {
                const val = row[key];
                if (typeof val === 'string' && val.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
                    stats.fixedDates++;
                    // Try to standardize to YYYY-MM-DD
                    const parts = val.split(/[\/\-]/);
                    if (parts.length === 3) {
                        let year = parts[2];
                        let month = parts[0];
                        let day = parts[1];
                        if (year.length === 2) year = '20' + year;
                        if (month.length === 1) month = '0' + month;
                        if (day.length === 1) day = '0' + day;
                        row[key] = `${year}-${month}-${day}`;
                    }
                }
            });
            return row;
        });
        console.log(`Fixed ${stats.fixedDates} dates`);
    }
    
    cleanedData = data;
    stats.cleanedRows = data.length;
    
    console.log(`Cleaning complete: ${stats.cleanedRows} rows remaining`);
    
    generateReport(stats);
    showPreview(cleanedData, 'Cleaned Data (First 10 rows)');
    document.getElementById('reportCard').style.display = 'block';
}

// Generate and display report
function generateReport(stats) {
    const reportDiv = document.getElementById('reportContent');
    
    let html = `
        <div class="stat-box" style="background:#e8f4f8;">
            <strong>📊 Cleaning Summary</strong><br>
            Original rows: ${stats.originalRows}<br>
            Cleaned rows: ${stats.cleanedRows}<br>
            Empty rows removed: ${stats.removedEmpty}<br>
            Duplicates removed: ${stats.removedDuplicates}<br>
            Dates standardized: ${stats.fixedDates}
        </div>
    `;
    
    // Column analysis
    html += '<h3>📋 Column Analysis:</h3>';
    headers.forEach(header => {
        const values = cleanedData.map(row => row[header]).filter(v => v && v.trim());
        const unique = new Set(values).size;
        const emptyCount = cleanedData.length - values.length;
        const sample = values.slice(0, 3).join(', ');
        
        html += `
            <div class="stat-box">
                <strong>${header}</strong><br>
                • Non-empty values: ${values.length}/${cleanedData.length}<br>
                • Unique values: ${unique}<br>
                • Empty cells: ${emptyCount}<br>
                • Sample: ${sample || '(empty)'}
            </div>
        `;
    });
    
    html += `
        <div class="stat-box" style="background:#d5f4e6;">
            <strong>✅ Ready for analysis!</strong><br>
            Your data is now clean and can be used for reporting, visualization, or AI training.
        </div>
    `;
    
    reportDiv.innerHTML = html;
}

// Show preview table
function showPreview(data, title) {
    const previewDiv = document.getElementById('preview');
    
    if (!data || data.length === 0) {
        previewDiv.innerHTML = '<p>No data to preview</p>';
        document.getElementById('previewCard').style.display = 'block';
        return;
    }
    
    const first10 = data.slice(0, 10);
    
    let html = `<h3>${title}</h3><table>`;
    
    // Headers
    html += '<thead><tr>';
    headers.forEach(h => {
        html += `<th>${h}</th>`;
    });
    html += '</tr></thead><tbody>';
    
    // Rows
    first10.forEach(row => {
        html += '<tr>';
        headers.forEach(h => {
            let cell = row[h] || '';
            if (cell.length > 30) cell = cell.substring(0, 27) + '...';
            html += `<td>${cell}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</tbody></table>';
    
    if (data.length > 10) {
        html += `<p><em>... and ${data.length - 10} more rows</em></p>`;
    }
    
    previewDiv.innerHTML = html;
    document.getElementById('previewCard').style.display = 'block';
}

// Download cleaned CSV
function downloadCleanedCSV() {
    if (!cleanedData || cleanedData.length === 0) {
        alert('No cleaned data to download. Please load and clean a CSV first.');
        return;
    }
    
    let csv = headers.join(',') + '\n';
    cleanedData.forEach(row => {
        const rowValues = headers.map(h => {
            let val = row[h] || '';
            // Wrap in quotes if contains comma
            if (val.includes(',') || val.includes('"')) {
                val = `"${val.replace(/"/g, '""')}"`;
            }
            return val;
        });
        csv += rowValues.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_data_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Download report
function downloadReport() {
    const reportContent = document.getElementById('reportContent');
    if (!reportContent || !reportContent.innerText) {
        alert('No report to download. Please clean a CSV first.');
        return;
    }
    
    const reportText = reportContent.innerText;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_report_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

// Make functions available globally
window.cleanData = cleanData;
window.downloadCleanedCSV = downloadCleanedCSV;
window.downloadReport = downloadReport;
