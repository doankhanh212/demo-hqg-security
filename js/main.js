/* ========================================= */
/* 1. THREE.JS NETWORK TOPOLOGY BACKGROUND   */
/* ========================================= */
const container = document.getElementById('canvas-container');
const scene = new THREE.Scene();

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 25;
camera.position.y = 5;

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
container.appendChild(renderer.domElement);

// Network Nodes - Healthcare Network Topology
const nodeCount = 160;
const geometry = new THREE.BufferGeometry();
const positions = new Float32Array(nodeCount * 3);
const colors = new Float32Array(nodeCount * 3);
const velocities = [];

// Color palette: Cyan to Blue gradient
const colorPalette = [
    { r: 0.024, g: 0.714, b: 0.831 }, // Cyan
    { r: 0.231, g: 0.510, b: 0.965 }, // Blue
    { r: 0.063, g: 0.725, b: 0.506 }, // Green
];

for (let i = 0; i < nodeCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 55;
    positions[i * 3 + 1] = (Math.random() - 0.5) * 35;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 25;

    const color = colorPalette[Math.floor(Math.random() * colorPalette.length)];
    colors[i * 3] = color.r;
    colors[i * 3 + 1] = color.g;
    colors[i * 3 + 2] = color.b;

    velocities.push({
        x: (Math.random() - 0.5) * 0.035,
        y: (Math.random() - 0.5) * 0.035,
        z: (Math.random() - 0.5) * 0.035
    });
}

geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

const material = new THREE.PointsMaterial({
    size: 0.45,
    transparent: true,
    opacity: 0.85,
    vertexColors: true,
    blending: THREE.AdditiveBlending
});

const particles = new THREE.Points(geometry, material);
scene.add(particles);

const lineMaterial = new THREE.LineBasicMaterial({
    color: 0x06b6d4,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending
});

let lineGeometry = new THREE.BufferGeometry();
const lineMesh = new THREE.LineSegments(lineGeometry, lineMaterial);
scene.add(lineMesh);

let mouseX = 0;
let mouseY = 0;
const windowHalfX = window.innerWidth / 2;
const windowHalfY = window.innerHeight / 2;

document.addEventListener('mousemove', (event) => {
    mouseX = (event.clientX - windowHalfX) * 0.001;
    mouseY = (event.clientY - windowHalfY) * 0.001;
});

function animate() {
    requestAnimationFrame(animate);

    const positions = particles.geometry.attributes.position.array;
    
    for (let i = 0; i < nodeCount; i++) {
        positions[i * 3] += velocities[i].x;
        positions[i * 3 + 1] += velocities[i].y;
        positions[i * 3 + 2] += velocities[i].z;

        if (Math.abs(positions[i * 3]) > 28) velocities[i].x *= -1;
        if (Math.abs(positions[i * 3 + 1]) > 18) velocities[i].y *= -1;
        if (Math.abs(positions[i * 3 + 2]) > 13) velocities[i].z *= -1;
    }
    particles.geometry.attributes.position.needsUpdate = true;

    camera.position.x += (mouseX * 8 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 8 - camera.position.y) * 0.04;
    camera.lookAt(scene.position);

    const linePositions = [];
    const connectionRadius = 5.5;

    for (let i = 0; i < nodeCount; i++) {
        for (let j = i + 1; j < nodeCount; j++) {
            const dx = positions[i * 3] - positions[j * 3];
            const dy = positions[i * 3 + 1] - positions[j * 3 + 1];
            const dz = positions[i * 3 + 2] - positions[j * 3 + 2];
            const distSq = dx*dx + dy*dy + dz*dz;

            if (distSq < connectionRadius * connectionRadius) {
                linePositions.push(
                    positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2],
                    positions[j * 3], positions[j * 3 + 1], positions[j * 3 + 2]
                );
            }
        }
    }

    lineMesh.geometry.setAttribute('position', new THREE.Float32BufferAttribute(linePositions, 3));
    scene.rotation.y += 0.0008;
    renderer.render(scene, camera);
}

animate();

window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});


/* ========================================= */
/* 2. DEMO HUD - HEALTHCARE SOC SIMULATION   */
/* ========================================= */
const startBtn = document.getElementById('start-demo-btn');
const closeBtn = document.getElementById('close-demo-btn');
const demoHud = document.getElementById('demo-hud');
const terminalOutput = document.getElementById('terminal-content');
const resultPanel = document.getElementById('result-panel');
const exportReportBtn = document.getElementById('export-report-btn');
const REPORT_STORAGE_KEY = 'hqgExecutiveReportData';

// Mock Data - Healthcare focused, Full Vietnamese Diacritics
const mockData = {
    score: 8.5,
    cveCount: "12 (3 Nghiêm trọng)",
    epss: "89%",
    
    assets: "Phát hiện 3 phân vùng mạng bệnh viện:\\n" +
            "• HIS - Hệ thống thông tin bệnh viện (192.168.10.x)\\n" +
            "• PACS - Lưu trữ hình ảnh nội khoa DICOM (192.168.20.x)\\n" +
            "• IoMT - Thiết bị y tế kết nối: Máy MRI, CT Scanner\\n" +
            "Cảnh báo: Máy chủ DICOM đang mở kết nối không mã hóa ra ngoài.",
    
    cwe: "• CWE-306: Thiếu xác thực cho chức năng cốt lõi\\n" +
         "• CWE-319: Truyền tải thông tin nhạy cảm dạng Cleartext\\n" +
         "• CWE-522: Bảo vệ tài khoản đăng nhập không đầy đủ",
    
    mitre: "Chiến thuật phát hiện (MITRE ATT&CK):\\n" +
           "• TA0001 (Initial Access) - Khai thác ứng dụng web HIS\\n" +
           "• TA0008 (Lateral Movement) - Di chuyển trái phép giữa các phân vùng y tế\\n" +
           "• TA0040 (Impact) - Rủi ro thao túng và mã hóa dữ liệu bệnh nhân",
    
    cisa: "Phát hiện 2 lỗ hổng (CVE-2024-21762, CVE-2023-46805) thuộc danh sách CISA Known Exploited (KEV). Khuyến cáo vá NGAY LẬP TỨC.",
    
    nist: "Đề xuất kiểm soát an ninh theo chuẩn NIST SP 800-53:\\n" +
          "• SC-7: Thiết lập Bảo vệ Ranh giới Mạng (Firewall/WAF)\\n" +
          "• SC-7(1): Phân lập nghiêm ngặt các vùng mạng y tế (HIS, PACS)\\n" +
          "• AC-2: Quản lý chặt chẽ tài khoản truy cập hệ thống EMR\\n" +
          "• SI-4: Giám sát luồng mạng để phát hiện sự kiện bất thường"
};

// Terminal simulation logs - Full Vietnamese Diacritics
const mockLogs = [
    { text: "[+] Khởi tạo module phân tích an ninh mạng cho Y tế...", cls: "log-cyan", delay: 600 },
    { text: "[*] Phân tích topology mạng bệnh viện...", cls: "log-info", delay: 800 },
    { text: "    --> Phát hiện 3 phân vùng: HIS, PACS, IoMT", cls: "log-info", delay: 500 },
    { text: "[*] Kết nối cơ sở dữ liệu NVD & CWE (Chế độ Offline)...", cls: "log-info", delay: 1000 },
    { text: "[+] Đã tải 247,832 bản ghi CVE và danh sách điểm yếu CWE...", cls: "log-suc", delay: 800 },
    { text: "[*] Đối chiếu các dịch vụ với cơ sở dữ liệu rủi ro...", cls: "log-info", delay: 1200 },
    { text: "[!] Phát hiện 12 lỗ hổng liên quan đến hệ thống thiết bị y tế", cls: "log-err", delay: 600 },
    { text: "    --> CVE-2024-21762 (Fortinet) - CVSS 9.8 (CWE-134)", cls: "log-err", delay: 400 },
    { text: "    --> CVE-2023-46805 (Ivanti) - CVSS 8.2 (CWE-288)", cls: "log-warn", delay: 400 },
    { text: "[*] Truy vấn đánh giá xác suất khai thác bằng EPSS...", cls: "log-info", delay: 1000 },
    { text: "    --> Lỗ hổng nguy hiểm nhất: Khả năng bị tấn công tới 89%", cls: "log-warn", delay: 600 },
    { text: "[*] Ánh xạ vào Ma trận MITRE ATT&CK...", cls: "log-cyan", delay: 1000 },
    { text: "[+] Ghi nhận Chiến thuật ẩn nấp: Initial Access, Lateral Movement...", cls: "log-suc", delay: 600 },
    { text: "[*] Kiểm tra đối chiếu với danh sách CISA KEV...", cls: "log-info", delay: 800 },
    { text: "[!] Tồn tại lỗ hổng đang bị Hacker khai thác trong thực tế!", cls: "log-err", delay: 500 },
    { text: "[*] Xây dựng khuyến nghị kiểm soát (SC-7, AC-2, SI-4) theo chuẩn NIST...", cls: "log-info", delay: 1000 },
    { text: "[+] Đã kích hoạt các quy tắc bảo vệ tường lửa và định danh...", cls: "log-suc", delay: 600 },
    { text: "[+] Đánh giá hoàn tất. Đang tổng hợp báo cáo chi tiết...", cls: "log-suc", delay: 800 },
    { text: "[============ PHÂN TÍCH HOÀN TẤT ============]", cls: "log-cyan", delay: 500 }
];

let scanInProgress = false;

startBtn.addEventListener('click', () => {
    if (scanInProgress) return;
    scanInProgress = true;
    
    terminalOutput.innerHTML = "";
    document.getElementById('res-score').innerText = "--";
    document.getElementById('res-cve').innerText = "--";
    document.getElementById('res-epss').innerText = "--";
    document.getElementById('res-assets').innerText = "Đang phân tích dữ liệu...";
    document.getElementById('res-cwe').innerText = "Đang phân tích dữ liệu...";
    document.getElementById('res-mitre').innerText = "Đang phân tích dữ liệu...";
    document.getElementById('res-cisa').innerText = "Đang phân tích dữ liệu...";
    document.getElementById('res-nist').innerText = "Đang phân tích dữ liệu...";
    resultPanel.classList.remove('active');
    exportReportBtn.disabled = true;

    demoHud.classList.remove('hidden');
    runScanSimulation();
});

closeBtn.addEventListener('click', () => {
    demoHud.classList.add('hidden');
    scanInProgress = false;
});

async function runScanSimulation() {
    for (let log of mockLogs) {
        if (!scanInProgress) break;

        await new Promise(res => setTimeout(res, log.delay));
        
        const line = document.createElement('div');
        line.className = 'terminal-line ' + log.cls;
        line.innerText = log.text;
        terminalOutput.appendChild(line);
        terminalOutput.scrollTop = terminalOutput.scrollHeight;
    }

    if(scanInProgress) {
        showResults();
        scanInProgress = false;
    }
}

function showResults() {
    resultPanel.classList.add('active');
    
    document.getElementById('res-score').innerText = mockData.score;
    document.getElementById('res-cve').innerText = mockData.cveCount;
    document.getElementById('res-epss').innerText = mockData.epss;

    typeText('res-assets', mockData.assets, 10);
    typeText('res-cwe', mockData.cwe, 10);
    typeText('res-mitre', mockData.mitre, 10);
    typeText('res-cisa', mockData.cisa, 10);
    typeText('res-nist', mockData.nist, 10);

    exportReportBtn.disabled = false;
}

exportReportBtn.addEventListener('click', () => {
    const reportData = {
        generatedAt: new Date().toISOString(),
        score: mockData.score,
        cveCount: mockData.cveCount,
        epss: mockData.epss,
        assets: mockData.assets,
        cwe: mockData.cwe,
        mitre: mockData.mitre,
        cisa: mockData.cisa,
        nist: mockData.nist
    };

    localStorage.setItem(REPORT_STORAGE_KEY, JSON.stringify(reportData));
    const reportWindow = window.open('report.html', '_blank');
    if (!reportWindow) {
        window.location.href = 'report.html';
    }
});

function typeText(elementId, content, speed = 10) {
    const el = document.getElementById(elementId);
    el.innerHTML = "";
    
    // Replace the literal string "\n" with actual newline characters
    const text = content.replace(/\\n/g, '\n');
    let i = 0;
    
    const timer = setInterval(() => {
        if (!scanInProgress && demoHud.classList.contains('hidden')) {
            clearInterval(timer);
            return;
        }
        if (i < text.length) {
            if (text.charAt(i) === '\n') {
                el.innerHTML += '<br>';
            } else {
                el.innerHTML += text.charAt(i);
            }
            i++;
        } else {
            clearInterval(timer);
        }
    }, speed);
}
