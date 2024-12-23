const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();



let mainWindow;
let db;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        icon: path.join(__dirname, 'IMG', 'expediente.png')
    });
    
    mainWindow.loadFile('index.html');

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    db = new sqlite3.Database(path.join(__dirname, 'database.sqlite'), (err) => {
        if (err) {
            console.error('Error opening database', err.message);
        } else {
            console.log('Connected to the database.');
        }
    });
});



ipcMain.on('add-vehicle', (event, vehicle) => {
    const { plate, brand, model, dateC, dateV } = vehicle;
    db.run(`INSERT INTO vehicles (plate, brand, model, dateC, dateV) VALUES (?, ?, ?, ?, ?)`, [plate, brand, model, dateC, dateV], function (err) {
        if (err) {
            console.error('Error inserting vehicle', err.message);
            event.reply('add-vehicle-response', { success: false });
        } else {
            event.reply('add-vehicle-response', { success: true });
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

ipcMain.on('search-vehicle', (event, { plate }) => {
    db.get(`SELECT * FROM vehicles WHERE plate = ?`, [plate], (err, row) => {
        if (err) {
            console.error('Error searching vehicle', err.message);
            event.reply('search-vehicle-response', { success: false });
        } else {
            event.reply('search-vehicle-response', { success: true, vehicle: row });
        }
    });
});

ipcMain.on('edit-vehicle', (event, vehicle) => {
    const { plate, dateC, dateV } = vehicle;
    db.run(`UPDATE vehicles SET dateC = ?, dateV = ? WHERE plate = ?`, [dateC, dateV, plate], function (err) {
        if (err) {
            console.error('Error updating vehicle', err.message);
            event.reply('edit-vehicle-response', { success: false });
        } else {
            event.reply('edit-vehicle-response', { success: true });
        }
    });
});

ipcMain.on('delete-vehicle', (event, { plate }) => {
    db.run(`DELETE FROM vehicles WHERE plate = ?`, [plate], function (err) {
        if (err) {
            console.error('Error deleting vehicle', err.message);
            event.reply('delete-vehicle-response', { success: false });
        } else {
            event.reply('delete-vehicle-response', { success: true });
        }
    });
});


ipcMain.handle('buscar-patente', async (event, plate) => {
    console.log('Consulta recibida para la matrícula:', plate); 
    return new Promise((resolve, reject) => {
        const query = `SELECT * FROM vehicles WHERE plate = ?`;
        db.get(query, [plate], (err, row) => {
            if (err) {
                console.error('Error al realizar la consulta:', err.message);
                reject(err);
            } else {
                resolve(row || null); // Devuelve el registro encontrado o null si no hay resultados
            }
        });
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});