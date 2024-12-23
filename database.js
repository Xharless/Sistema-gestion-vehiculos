const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'database.sqlite');
const db = new sqlite3.Database(dbPath, (err) => {  
    if(err){
        console.log('Error al abrir la base de datos', err.message);
    } else {
        console.log('Conexión exitosa a la base de datos');
        db.run(`CREATE TABLE IF NOT EXISTS vehicles (
            plate TEXT PRIMARY KEY,
            brand TEXT NOT NULL,
            model TEXT NOT NULL,
            dateC TEXT NOT NULL,
            dateV TEXT NOT NULL
        )`, (err) => {
            if(err){
                console.log('Error al crear la tabla', err.message);
            } else {
                console.log('Tabla creada correctamente');
            }
        });
    }
});

module.exports = db;