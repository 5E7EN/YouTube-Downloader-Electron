// Modules
const {
    ipcRenderer,
    remote: { dialog }
} = require('electron');
const ytdl = require('ytdl-core');
const humanizeDuration = require('humanize-duration');
const fs = require('fs');

// Elements
const dlUrl = document.getElementById('downloadUrl');
const dlBtn = document.getElementById('downloadBtn');
const statusMsg = document.getElementById('statusMsg');
const progressBar = document.getElementById('progressBar');
const loader = document.getElementById('loader');
const version = document.getElementById('version');
const notification = document.getElementById('notification');
const notificationMsg = document.getElementById('notificationMsg');
const restartButton = document.getElementById('notificationRestartBtn');

dlBtn.onclick = () => {
    console.info('User requested download...');
    downloadVideo(dlUrl.value);
};

function showProgressBar() {
    dlBtn.classList.add('hidden');
    progressBar.classList.remove('hidden');
}

function hideProgressBar() {
    dlBtn.classList.remove('hidden');
    progressBar.classList.add('hidden');
}

function setStatus(type, message) {
    if (statusMsg.classList.contains('hidden')) {
        statusMsg.classList.remove('hidden');
    }

    statusMsg.className = `alert alert-${type || 'secondary'}`;
    statusMsg.innerHTML = message;
}

// Initial config (page load)
hideProgressBar();
ipcRenderer.send('app_version');
ipcRenderer.on('app_version', (event, arg) => {
    ipcRenderer.removeAllListeners('app_version');
    version.innerText = `Version ${arg.version}`;
});

async function downloadVideo(url = '') {
    if (!url || url.length === 0 || !/(https?:\/\/)?[\w#%+-.:=@~]{1,256}\.[a-z]{2,6}\b([\w#%&+-./:=?@~]*)/.test(url)) {
        console.warn('Video validation failed (via local regex).');
        return setStatus('danger', 'Invalid YouTube URL!');
    }

    const isValidURL = await ytdl.validateURL(url);
    if (!isValidURL) {
        console.warn('Video validation failed (via external provider).');
        return setStatus('danger', 'Invalid YouTube video!');
    }

    // TODO: Find better way to update result on set interval
    let startTime = Date.now();
    let downloadedRemote = null;
    let downloadedMinutes = null;
    let totalRemote = null;
    let estimatedDownloadTime = null;
    let percentComplete = null;
    let percentCompleteDisplay = null;

    const updateIntervalID = setInterval(() => {
        if (downloadedRemote && percentComplete && downloadedMinutes && estimatedDownloadTime && percentCompleteDisplay) {
            setStatus(
                'primary',
                `Video download started. Please wait... <br />
                ${(downloadedRemote / 1024 / 1024).toFixed(2)}/${(totalRemote / 1024 / 1024).toFixed(2)} MB. 
                Time left: ${humanizeDuration(estimatedDownloadTime, { round: true })}`
            );
        }
    }, 1000);

    const video = ytdl(url, { format: 'mp4' });
    const videoInfo = await ytdl.getBasicInfo(url);

    console.info('Video passed validation. Requesting save path...');

    // Fetch save path
    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `${videoInfo.videoDetails.title}`,
        filters: [{ name: 'Videos', extensions: ['mp4'] }]
    });

    if (filePath) {
        console.info('Save path acquired! Downloading video data...');

        showProgressBar();
        video.pipe(fs.createWriteStream(filePath));
        setStatus('primary', 'Video download started. Please wait...');
    } else {
        console.warn('User did not provide save path, aborting!');
        video.destroy();
        hideProgressBar();
        return setStatus('danger', `You must select a valid download location!`);
    }

    // Handlers
    video.on('progress', (chunkLength, downloaded, total) => {
        downloadedRemote = downloaded;
        totalRemote = total;
        percentComplete = downloadedRemote / totalRemote;
        downloadedMinutes = (Date.now() - startTime) / 1000 / 60;
        estimatedDownloadTime = (downloadedMinutes / percentComplete - downloadedMinutes) * 1e5;
        percentCompleteDisplay = (percentComplete * 100) | 0;

        loader.style.width = `${percentCompleteDisplay || 0}%`;
        loader.innerHTML = `${percentCompleteDisplay || 0}%`;
    });

    video.on('end', () => {
        console.info('Video download finished!');
        window.clearInterval(updateIntervalID);
        hideProgressBar();
        setStatus('success', `Download complete! Video saved to ${filePath}`);
    });

    video.on('error', (err) => {
        console.error('Got youtube-dl error:', err);
        window.clearInterval(updateIntervalID);
        setStatus('danger', 'An error occured. See developer console.');
    });
}

function closeNotification() {
    notification.classList.add('hidden');
}

function restartApp() {
    ipcRenderer.send('restart_app');
}

// Auto-updater
ipcRenderer.on('update_available', () => {
    ipcRenderer.removeAllListeners('update_available');
    notificationMsg.innerText = 'A new update is available. Downloading now...';
    notification.classList.remove('hidden');
});

ipcRenderer.on('update_downloaded', () => {
    ipcRenderer.removeAllListeners('update_downloaded');
    notificationMsg.innerText = 'Update Downloaded. It will be installed on restart. Restart now?';
    restartButton.classList.remove('hidden');
    notification.classList.remove('hidden');
});
