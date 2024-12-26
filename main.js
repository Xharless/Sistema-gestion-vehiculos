const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();



let mainWindow;
let db;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
            webSecurity: false
        },
        icon: path.join(__dirname, 'IMG', 'expediente.ico')
    });

    mainWindow.loadFile('index.html');

    // Abrir la ventana en modo de pantalla completa
    mainWindow.maximize();

    mainWindow.on('closed', () => {
        mainWindow = null;
    });
}

app.on('ready', () => {
    createWindow();

    // Determinar la ruta de la base de datos
    const dbPath = path.join(app.getPath('userData'), 'database.sqlite');

    // Copiar la base de datos al directorio de datos del usuario si no existe
    const fs = require('fs');
    if (!fs.existsSync(dbPath)) {
        fs.copyFileSync(path.join(__dirname, 'database.sqlite'), dbPath);
    }

    // Abrir la base de datos
    db = new sqlite3.Database(dbPath, (err) => {
        if (err) {
            console.error('Error opening database', err.message);
        } else {
            console.log('Database opened successfully');
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
            mainWindow.webContents.send('update-vehicles');
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
            mainWindow.webContents.send('update-vehicles');
            
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
            mainWindow.webContents.send('update-vehicles');
            
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
            event.target.reset();
            document.getElementById('plate').focus();
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
ipcMain.on('force-reload', () => {
    if (mainWindow) {
        mainWindow.minimize();  // Minimiza la ventana temporalmente
        mainWindow.webContents.reloadIgnoringCache();

        // Después de recargar, restauramos la ventana
        mainWindow.webContents.once('did-finish-load', () => {
            mainWindow.restore();
            mainWindow.focus();  // Asegurarse de que la ventana recupere el foco
        });
    }
});

// ----------------------------------------------
// manejo para datos de conductores
ipcMain.handle('fetch-drivers', async () => {
    return new Promise((resolve, reject) => {
        db.all(`SELECT * FROM conductores`, [], (err, rows) => {
            if (err) {
                console.error('Error fetching drivers', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
});


// ----------------------------------------------
// agregar conductores
// Manejo de la inserción de un nuevo conductor
ipcMain.on('add-driver', (event, driver) => {
    const { name, lastname, VLicencia, clase, VCarnet } = driver;


    // Inserción en la base de datos
    const query = `INSERT INTO conductores (name, lastname, VLicencia, clase, VCarnet) VALUES (?, ?, ?, ?, ?)`;
    db.run(query, [name, lastname, VLicencia, clase, VCarnet], function(err) {
        if (err) {
            console.error('Error inserting driver', err.message);
            event.reply('add-driver-response', { success: false });
        } else {
            event.reply('add-driver-response', { success: true });
            mainWindow.webContents.send('update-drivers');
        }
    });
});

// ----------------------------------------------
// editar conductores
// Manejo de la actualización de fechas de un conductor
ipcMain.on('update-driver-dates', (event, data) => {
    const { id, VLicencia, VCarnet } = data;

    // Actualizar las fechas en la base de datos
    const query = `
        UPDATE conductores
        SET VLicencia = ?, VCarnet = ?
        WHERE id = ?
    `;
    db.run(query, [VLicencia, VCarnet, id], function(err) {
        if (err) {
            event.reply('driver-update-error', err.message);
        } else {
            event.reply('driver-update-success');
            // Actualizar la vista de conductores
            event.sender.send('update-drivers');
        }
    });
});
ipcMain.on('delete-driver', (event, { id }) => {
    db.run(`DELETE FROM conductores WHERE id = ?`, [id], function (err) {
        if (err) {
            console.error('Error deleting driver', err.message);
            event.reply('delete-driver-response', { success: false });
        } else {
            event.reply('delete-driver-response', { success: true });
            mainWindow.webContents.send('update-drivers');
        }
    });
});
// ----------------------------------------------   
app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});