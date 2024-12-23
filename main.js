const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const db = require('./database');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false, // Asegúrate de que esto esté configurado en false
            webSecurity: false
        },
        icon: path.join(__dirname, 'IMG', 'expediente.png')
    });
    
    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

ipcMain.on('add-vehicle', (event, vehicle) => {
    const { plate, brand, model, dateC, dateV } = vehicle;
    db.run(`INSERT INTO vehicles (plate, brand, model, dateC, dateV) VALUES (?, ?, ?, ?, ?)`, [plate, brand, model, dateC, dateV], function (err) {
        if (err) {
            console.error('Error inserting vehicle', err.message);
            event.reply('add-vehicle-response', { success: false });
        } else {
            event.reply('add-vehicle-response', { success: true, id: this.lastID });
        }
    });
});

ipcMain.on('get-vehicles', (event) => {
    db.all(`SELECT * FROM vehicles`, [], (err, rows) => {
        if (err) {
            console.error('Error fetching vehicles', err.message);
            event.reply('get-vehicles-response', { success: false, vehicles: [] });
        } else {
            event.reply('get-vehicles-response', { success: true, vehicles: rows });
        }
    });
});

