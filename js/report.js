const REPORT_STORAGE_KEY = 'hqgExecutiveReportData';

const fallbackData = {
    generatedAt: new Date().toISOString(),
    score: '--',
    cveCount: '--',
    epss: '--',
    assets: 'Chưa có dữ liệu phiên quét gần nhất.',
    cwe: 'Chưa có dữ liệu.',
    mitre: 'Chưa có dữ liệu.',
    cisa: 'Chưa có dữ liệu.',
    nist: 'Chưa có dữ liệu.'
};

function getReportData() {
    try {
        const raw = localStorage.getItem(REPORT_STORAGE_KEY);
        if (!raw) return fallbackData;
        return { ...fallbackData, ...JSON.parse(raw) };
    } catch {
        return fallbackData;
    }
}

function toVnDate(isoDate) {
    const date = new Date(isoDate);
    if (Number.isNaN(date.getTime())) return '--';
    return date.toLocaleString('vi-VN');
}

function buildSummary(data) {
    return `Kết quả đánh giá cho thấy mức rủi ro hiện tại là ${data.score}/10, với ${data.cveCount} và xác suất khai thác cao nhất theo EPSS là ${data.epss}. ` +
        `Bệnh viện cần ưu tiên xử lý các điểm yếu đang bị khai thác thực tế và tăng cường kiểm soát theo NIST SP 800-53 Rev.5 để giảm thiểu nguy cơ gián đoạn dịch vụ lâm sàng.`;
}

function renderReport() {
    const data = getReportData();

    document.getElementById('report-time').innerText = `Thời gian tạo báo cáo: ${toVnDate(data.generatedAt)}`;
    document.getElementById('metric-score').innerText = data.score;
    document.getElementById('metric-cve').innerText = data.cveCount;
    document.getElementById('metric-epss').innerText = data.epss;

    document.getElementById('summary-text').innerText = buildSummary(data);
    document.getElementById('sec-assets').innerText = data.assets;
    document.getElementById('sec-cwe').innerText = data.cwe;
    document.getElementById('sec-mitre').innerText = data.mitre;
    document.getElementById('sec-cisa').innerText = data.cisa;
    document.getElementById('sec-nist').innerText = data.nist;
}

document.getElementById('btn-back').addEventListener('click', () => {
    if (window.history.length > 1) {
        window.history.back();
        return;
    }
    window.location.href = 'index.html';
});

renderReport();
