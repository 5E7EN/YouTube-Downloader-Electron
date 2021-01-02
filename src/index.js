const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        title: 'YouTube Downloader by MSimon',
        width: 600,
        height: 400,
        webPreferences: { nodeIntegration: true, devTools: true },
        resizable: false
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    const mainMenu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
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
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

// Hot Reloader
try {
    require('electron-reloader')(module);
} catch (_) {}
