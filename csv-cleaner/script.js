let originalData = [];
let cleanedData = [];
let headers = [];

function loadCSV() {
    const file = document.getElementById('csvFile').files[0];
    if (!file) {
        alert('Please select a CSV file');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const text = e.target.result;
        parseCSV(text);
    };
    reader.readAsText(file);
}

function parseCSV(text) {
    const lines = text.split('\n');
    headers = lines[0].split(',').map(h => h.replace(/["']/g, '').trim());
    
    originalData = [];
    for (let i = 1; i < lines.length; i++) {
        if (lines[i].trim()) {
            const values = lines[i].split(',').map(v => v.replace(/["']/g, '').trim());
            if (values.length === headers.length) {
                const row = {};
                headers.forEach((h, idx) => {
                    row[h] = values[idx] || '';
                });
                originalData.push(row);
            }
        }
    }
    
    cleanedData = [...originalData];
    
    document.getElementById('optionsCard').style.display = 'block';
    showPreview(originalData, 'Original Data Preview');
}

function cleanData() {
    let data = [...originalData];
    const stats = {
        originalRows: data.length,
        removedEmpty: 0,
        removedDuplicates: 0,
        fixedDates: 0
    };
    
    // Remove empty rows
    if (document.getElementById('removeEmptyRows').checked) {
        const before = data.length;
        data = data.filter(row => {
            return Object.values(row).some(val => val && val.trim());
        });
        stats.removedEmpty = before - data.length;
    }
    
    // Trim spaces
    if (document.getElementById('trimSpaces').checked) {
        data = data.map(row => {
            const newRow = {};
            Object.keys(row).forEach(key => {
                newRow[key] = typeof row[key] === 'string' ? row[key].trim() : row[key];
            });
            return newRow;
        });
    }
    
    // Fix dates (simple version)
    if (document.getElementById('fixDates').checked) {
        data = data.map(row => {
            Object.keys(row).forEach(key => {
                if (row[key] && row[key].match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/)) {
                    stats.fixedDates++;
                }
            });
            return row;
        });
    }
    
    // Remove duplicates
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
    }
    
    cleanedData = data;
    stats.cleanedRows = data.length;
    
    generateReport(stats);
    showPreview(cleanedData, 'Cleaned Data Preview');
    document.getElementById('reportCard').style.display = 'block';
}

function generateReport(stats) {
    const reportDiv = document.getElementById('reportContent');
    
    // Calculate column statistics
    let columnStats = '<h3>Column Analysis:</h3>';
    headers.forEach(header => {
        const values = cleanedData.map(row => row[header]).filter(v => v);
        const unique = new Set(values).size;
        const emptyCount = cleanedData.length - values.length;
        const type = values.length > 0 ? (isNaN(values[0]) ? 'Text' : 'Numeric') : 'Empty';
        
        columnStats += `
            <div class="stat-box">
                <strong>${header}</strong><br>
                - Type: ${type}<br>
                - Unique values: ${unique}<br>
                - Empty cells: ${emptyCount}<br>
                - Non-empty: ${values.length}
            </div>
        `;
    });
    
    reportDiv.innerHTML = `
        <div class="stat-box">
            <strong>📊 Summary</strong><br>
            Original rows: ${stats.originalRows}<br>
            Cleaned rows: ${stats.cleanedRows}<br>
            Rows removed (empty): ${stats.removedEmpty}<br>
            Duplicates removed: ${stats.removedDuplicates}<br>
            Dates standardized: ${stats.fixedDates}
        </div>
        ${columnStats}
        <div class="stat-box" style="background:#d5f4e6;">
            <strong>✅ Data Quality Score: ${Math.round((stats.cleanedRows / stats.originalRows) * 100)}%</strong><br>
            Ready for analysis or AI training!
        </div>
    `;
}

function showPreview(data, title) {
    const previewDiv = document.getElementById('preview');
    const first10 = data.slice(0, 10);
    
    if (first10.length === 0) {
        previewDiv.innerHTML = '<p>No data to preview</p>';
        document.getElementById('previewCard').style.display = 'block';
        return;
    }
    
    let html = '<table><tr>';
    headers.forEach(h => {
        html += `<th>${h}</th>`;
    });
    html += '</tr>';
    
    first10.forEach(row => {
        html += '<tr>';
        headers.forEach(h => {
            html += `<td>${row[h] || ''}</td>`;
        });
        html += '</tr>';
    });
    
    html += '</table>';
    if (data.length > 10) {
        html += `<p><em>... and ${data.length - 10} more rows</em></p>`;
    }
    
    previewDiv.innerHTML = html;
    document.getElementById('previewCard').style.display = 'block';
}

function downloadCleanedCSV() {
    if (cleanedData.length === 0) {
        alert('No cleaned data to download');
        return;
    }
    
    let csv = headers.join(',') + '\n';
    cleanedData.forEach(row => {
        const rowValues = headers.map(h => `"${row[h] || ''}"`);
        csv += rowValues.join(',') + '\n';
    });
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cleaned_data_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
}

function downloadReport() {
    const reportText = document.getElementById('reportContent').innerText;
    const blob = new Blob([reportText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `data_report_${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
}
