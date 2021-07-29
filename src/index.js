const { app, BrowserWindow, Menu, shell, ipcMain } = require('electron');
const { autoUpdater } = require('electron-updater');
const path = require('path');

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        title: 'YouTube Downloader by MSimon',
        width: 650,
        height: 450,
        webPreferences: { nodeIntegration: true, enableRemoteModule: true, devTools: true },
        resizable: false
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    const mainMenu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Check for Updates',
                    click() {
                        autoUpdater.checkForUpdatesAndNotify();
                    }
                },
                { type: 'separator' },
                {
                    label: 'Quit',
                    click() {
                        app.quit();
                    }
                }
            ]
        },
        {
            label: 'Help',
            submenu: [
                { role: 'toggledevtools' },
                { type: 'separator' },
                {
                    label: 'GitHub',
                    click() {
                        shell.openExternal('https://github.com/5E7EN');
                    }
                },
                {
                    label: 'Website',
                    click() {
                        shell.openExternal('https://5e7en.me');
                    }
                }
            ]
        }
    ]);

    Menu.setApplicationMenu(mainMenu);

    // Check for updates
    autoUpdater.checkForUpdatesAndNotify();

    // Auto-updater Events
    autoUpdater.on('error', (err) => {
        console.error('[AutoUpdater] Encountered error:', err);
    });

    autoUpdater.on('update-available', (info) => {
        console.info('[AutoUpdater] Update available:', info);
    });

    autoUpdater.on('update-not-available', (info) => {
        console.info('[AutoUpdater] Update unavailable:', info);
    });
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

ipcMain.on('app_version', (event) => {
    event.sender.send('app_version', { version: app.getVersion() });
});

// Auto-updater
autoUpdater.on('update-available', () => {
    mainWindow.webContents.send('update_available');
});

autoUpdater.on('update-downloaded', () => {
    mainWindow.webContents.send('update_downloaded');
});

ipcMain.on('restart_app', () => {
    autoUpdater.quitAndInstall();
});

// Hot Reloader
try {
    require('electron-reloader')(module);
} catch (_) {}
