const { app, BrowserWindow, Menu, shell } = require('electron');
const path = require('path');

if (require('electron-squirrel-startup')) app.quit();

const createWindow = () => {
    const mainWindow = new BrowserWindow({
        title: 'YouTube Video Downloader || M. Simon',
        width: 800,
        height: 500,
        webPreferences: { nodeIntegration: true, devTools: true },
        resizable: false,
        icon: './assets/images/icon.png',
    });

    mainWindow.loadFile(path.join(__dirname, 'index.html'));

    const mainMenu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Quit',
                    click() {
                        app.quit();
                    },
                },
            ],
        },
        {
            label: 'Help',
            submenu: [
                {
                    label: 'GitHub',
                    accelerator: 'F1',
                    click() {
                        shell.openExternal('https://github.com/5E7EN');
                    },
                },
                {
                    label: 'Website',
                    click() {
                        shell.openExternal('https://5e7en.me');
                    },
                },
            ],
        },
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
