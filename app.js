const downloadBtn = document.getElementById('downloadBtn');
const videoUrlInput = document.getElementById('videoUrl');
const fileNameInput = document.getElementById('fileName');
const statusDiv = document.getElementById('status');
const progressDiv = document.getElementById('progress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');

const SERVER_URL = 'http://localhost:5000';
let pollTimer = null;

downloadBtn.addEventListener('click', async () => {
    const videoUrl = videoUrlInput.value.trim();
    const fileName = fileNameInput.value.trim();

    if (!videoUrl || !isValidUrl(videoUrl)) {
        showStatus('សូមបញ្ចូល URL ដែលមានសុពលភាព', 'error');
        return;
    }

    downloadVideo(videoUrl, fileName);
});

function isValidUrl(string) {
    try {
        new URL(string);
        return true;
    } catch (_) {
        return false;
    }
}

async function downloadVideo(url, fileName) {
    downloadBtn.disabled = true;
    showStatus('ចាប់ផ្តើម download...', 'loading');
    progressDiv.style.display = 'block';
    updateProgress(0);

    try {
        const response = await fetch(`${SERVER_URL}/download`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ url, fileName })
        });

        const data = await response.json();

        if (data.success) {
            pollStatus(data.taskId);
        } else {
            showStatus(`❌ កំហុស: ${data.message}`, 'error');
            downloadBtn.disabled = false;
        }
    } catch (error) {
        showStatus(`❌ កំហុស: ${error.message}`, 'error');
        downloadBtn.disabled = false;
    }
}

function pollStatus(taskId) {
    clearInterval(pollTimer);
    pollTimer = setInterval(async () => {
        try {
            const response = await fetch(`${SERVER_URL}/status/${taskId}`);
            const data = await response.json();

            if (!data.success) {
                clearInterval(pollTimer);
                showStatus(`❌ កំហុស: ${data.message}`, 'error');
                downloadBtn.disabled = false;
                return;
            }

            updateProgress(data.percent || 0);

            if (data.status === 'downloading') {
                showStatus(`កំពុង download... ${data.percent || 0}%`, 'loading');
            } else if (data.status === 'processing') {
                showStatus('កំពុងដំណើរការ...', 'loading');
            } else if (data.status === 'completed') {
                clearInterval(pollTimer);
                updateProgress(100);
                showStatus(`✅ Download បានលទ្ធផល: ${data.file}`, 'success');
                downloadBtn.disabled = false;
                triggerFileSave(data.file);
            } else if (data.status === 'error') {
                clearInterval(pollTimer);
                showStatus(`❌ កំហុស: ${data.message}`, 'error');
                downloadBtn.disabled = false;
            }
        } catch (error) {
            clearInterval(pollTimer);
            showStatus(`❌ កំហុស: ${error.message}`, 'error');
            downloadBtn.disabled = false;
        }
    }, 1000);
}

function triggerFileSave(fileName) {
    if (!fileName) return;
    const url = `${SERVER_URL}/videos/${encodeURIComponent(fileName)}`;
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    link.remove();
}

function showStatus(message, type) {
    statusDiv.textContent = message;
    statusDiv.className = `status-box status-${type}`;
}

function updateProgress(percent) {
    progressFill.style.width = percent + '%';
    progressText.textContent = percent + '%';
}
