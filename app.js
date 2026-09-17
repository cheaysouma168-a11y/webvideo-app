const downloadBtn = document.getElementById('downloadBtn');
const videoUrlInput = document.getElementById('videoUrl');
const fileNameInput = document.getElementById('fileName');
const websiteSelect = document.getElementById('website');
const statusDiv = document.getElementById('status');
const progressDiv = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

const SERVER_URL = 'http://localhost:5000';

downloadBtn.addEventListener('click', async () => {
    const videoUrl = videoUrlInput.value.trim();
    const fileName = fileNameInput.value.trim() || 'video';
    const website = websiteSelect.value;

    if (!videoUrl) {
        showStatus('សូមបញ្ចូល URL ដែលមានសុពលភាព', 'error');
        return;
    }

    downloadVideo(videoUrl, fileName, website);
});

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function downloadVideo(url, fileName, website) {
    downloadBtn.disabled = true;
    showStatus('ចាប់ផ្តើម download...', 'loading');
    progressDiv.style.display = 'block';

    try {
        const response = await fetch(`${SERVER_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                url: url,
                fileName: fileName,
                website: website
            })
        });

        const data = await response.json();

        if (data.success) {
            showStatus('✅ Download បានលទ្ធផល!', 'success');
            updateProgress(100);
        } else {
            showStatus(`❌ កំហុស: ${data.message}`, 'error');
        }
    } catch (error) {
        showStatus(`❌ កំហុស: ${error.message}`, 'error');
    } finally {
        downloadBtn.disabled = false;
    }
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-box status-${type}`;
}

function updateProgress(percent) {
    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '%';
}

// Mini Android Preview: wraps the app inside a phone-shaped frame so it can
// be previewed as a mobile/Android view without leaving the browser.
const androidToggleBtn = document.getElementById('androidToggleBtn');
const appContainer = document.querySelector('.container');
let androidFrameEl = null;
let androidClockInterval = null;

androidToggleBtn.addEventListener('click', () => {
    const isActive = document.body.classList.toggle('android-preview-active');
    if (isActive) {
        enableAndroidFrame();
    } else {
        disableAndroidFrame();
    }
});

function enableAndroidFrame() {
    androidFrameEl = document.createElement('div');
    androidFrameEl.className = 'android-frame';
    androidFrameEl.innerHTML = `
        <div class="android-notch"></div>
        <div class="android-statusbar">
            <span id="androidClock">9:41</span>
            <span>🔋 📶 📡</span>
        </div>
        <div class="android-screen"></div>
        <div class="android-navbar">
            <span>◁</span>
            <span>○</span>
            <span>▢</span>
        </div>
    `;
    document.body.insertBefore(androidFrameEl, appContainer);
    androidFrameEl.querySelector('.android-screen').appendChild(appContainer);

    updateAndroidClock();
    androidClockInterval = setInterval(updateAndroidClock, 30000);
}

function disableAndroidFrame() {
    if (!androidFrameEl) return;
    document.body.insertBefore(appContainer, androidFrameEl);
    androidFrameEl.remove();
    androidFrameEl = null;
    clearInterval(androidClockInterval);
    androidClockInterval = null;
}

function updateAndroidClock() {
    const clockEl = document.getElementById('androidClock');
    if (clockEl) {
        clockEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
    }
}
