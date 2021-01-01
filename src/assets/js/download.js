// Modules
const {
    remote: { dialog },
    shell,
} = require('electron');
const ytdl = require('ytdl-core');
const fs = require('fs');

// Elements
const dlUrl = document.getElementById('downloadUrl');
const dlBtn = document.getElementById('downloadBtn');
const status = document.getElementById('statusMsg');
const loader = document.getElementById('loader');
const websiteLink = document.getElementById('websiteLink');

dlBtn.onclick = () => {
    status.style.color = '#000000';
    status.innerHTML = 'Please wait...';
    downloadVideo(dlUrl.value);
};

websiteLink.onclick = () => {
    shell.openExternal('https://5e7en.me/tools');
};

function showLoader() {
    dlBtn.style.display = 'none';
    loader.style.display = 'block';
}
function hideLoader() {
    dlBtn.style.display = 'block';
    loader.style.display = 'none';
}

function infoMsg(element, message) {
    element.style.color = '#000000';
    element.innerHTML = message;
}

function successMsg(element, message) {
    element.style.color = '#3dcc00';
    element.innerHTML = message;
}

function errorMsg(element, message) {
    element.style.color = '#cc0000';
    element.innerHTML = message;
}
// Hide loader on page load
hideLoader();

async function downloadVideo(url = '') {
    if (!url || url.length === 0 || !/(https?:\/\/)?[\w#%+-.:=@~]{1,256}\.[a-z]{2,6}\b([\w#%&+-./:=?@~]*)/.test(url)) return errorMsg(status, 'Invalid YouTube URL!');

    const isValidURL = await ytdl.validateURL(url);
    if (!isValidURL) return errorMsg(status, `Invalid YouTube video!`);

    const videoInfo = await ytdl.getBasicInfo(url);
    showLoader();
    infoMsg(status, 'Please select a download path in the popup window!');

    const video = ytdl(url, { format: 'mp4' });

    let startTime = Date.now();

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `${videoInfo.title}`,
        filters: [{ name: 'Videos', extensions: ['mp4'] }],
    });

    if (filePath) {
        infoMsg(status, `Video download started. Please wait...`);
        video.pipe(fs.createWriteStream(filePath));
    } else {
        video.destroy();
        hideLoader();
        return errorMsg(status, `You must enter a valid save path!`);
    }

    // Handlers
    video.once('response', () => {
        startTime = Date.now();
    });

    video.on('progress', (chunkLength, downloaded, total) => {
        const percentComplete = downloaded / total;
        const downloadedMinutes = (Date.now() - startTime) / 1000 / 60;
        const estimatedDownloadTime = downloadedMinutes / percentComplete - downloadedMinutes;

        infoMsg(
            status,
            `Video download started. Please wait... <br />${(percentComplete * 100).toFixed(2)}% complete 
            (${(downloaded / 1024 / 1024).toFixed(2)}/${(total / 1024 / 1024).toFixed(2)} MB). 
            Time left: ${estimatedDownloadTime.toFixed(2)} minutes`
        );
    });

    video.on('end', () => {
        hideLoader();
        successMsg(status, `Download complete! Video saved to ${filePath}`);
    });
}
