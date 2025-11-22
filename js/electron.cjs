const { app, BrowserWindow, shell, ipcMain } = require('electron');
require('dotenv').config();

let mainWindow;

const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID
const REDIRECT_URI = 'http://127.0.0.1:8888/callback';
const SCOPES = [
    'user-read-private',
    'user-read-email',
    'streaming',
    'user-modify-playback-state',
    'user-read-playback-state'
];

const createWindow = () => {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: true
        }
    });

    mainWindow.maximize();
    mainWindow.loadFile('index.html');
    mainWindow.webContents.setWindowOpenHandler(({ url }) => {
        shell.openExternal(url);
        return { action: 'deny' };
    });
};

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.handle('open-auth-window', async () => {
    return new Promise(async (resolve, reject) => {

        const generateRandomString = (length) => {
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let result = '';
            for (let i = 0; i < length; i++) {
                result += chars.charAt(Math.floor(Math.random() * chars.length));
            }
            return result;
        }

        let codeVerifier = generateRandomString(128);
        let codeChallenge

        try {
            const hashed = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(codeVerifier));
            codeChallenge = btoa(String.fromCharCode(...new Uint8Array(hashed)))
                .replace(/=/g, '')
                .replace(/\+/g, '-')
                .replace(/\//g, '_');
        } catch (e) {
            console.error('Error generating code challenge:', e);
            reject(new Error('Failed to generate code challenge'));
            return;
        }

        const authUrl = new URL('https://accounts.spotify.com/authorize');
        authUrl.searchParams.append('client_id', CLIENT_ID);
        authUrl.searchParams.append('response_type', 'code');
        authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
        authUrl.searchParams.append('scope', SCOPES.join(' '));
        authUrl.searchParams.append('code_challenge_method', 'S256');
        authUrl.searchParams.append('code_challenge', codeChallenge);

        const authWindow = new BrowserWindow({
            width: 800,
            height: 600,
            show: true
        });

        const filter = {
            urls: [REDIRECT_URI + '*']
        };

        authWindow.webContents.session.webRequest.onBeforeRequest(filter, (details, callback) => {
            console.log("Intercepted redirect to:", details.url);
            const urlObj = new URL(details.url);
            console.log(urlObj);

            if (urlObj.searchParams.has('code')) {
                const authCode = urlObj.searchParams.get('code');
                callback({ cancel: true });
                authWindow.close();
                console.log("Auth code received:", authCode);
                resolve({"result_code": authCode, "code_verifier": codeVerifier});
            } else if (urlObj.searchParams.has('error')) {
                callback({ cancel: true });
                authWindow.close();
                reject(new Error(urlObj.searchParams.get('error')));
            } else {
                callback({ cancel: false });
            }
        });

        await authWindow.loadURL(authUrl.toString());

        authWindow.on('closed', () => {
            reject(new Error('Authentication was canceled'));
        });
    });
});
