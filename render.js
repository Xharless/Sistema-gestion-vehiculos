const { ipcRenderer } = require("electron");

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});

// dateC pertenece a la fecha de vencimmiento de la tarjeta de circulación
// dateV pertenece a la fecha de vencimiento de la revision tecnica
document.getElementById('vehicle-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const plate = document.getElementById('plate').value;
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const dateC = document.getElementById('dateC').value;
    const dateV = document.getElementById('dateV').value;
    ipcRenderer.send('add-vehicle', { plate, brand, model, dateC, dateV });
});
ipcRenderer.on('add-vehicle-response', (event, response) => {
    if (response.success) {
        alert('Vehículo agregado correctamente con ID: ' + response.id);
    } else {
        alert('Error al agregar el vehículo');
    }
});

// para ver las matriculas agregadas
document.getElementById('get-vehicles').addEventListener('click', () => {
    ipcRenderer.send('get-vehicles');
});

ipcRenderer.on('get-vehicles-response', (event, response) => {
    if (response.success) {
        const vehicleList = document.getElementById('vehicle-list');
        vehicleList.innerHTML = '';
        response.vehicles.forEach(vehicle => {
            const listItem = document.createElement('li');
            listItem.textContent = `Placa: ${vehicle.plate}, Marca: ${vehicle.brand}, Modelo: ${vehicle.model}, FechaC: ${vehicle.dateC}, FechaV: ${vehicle.dateV}`;
            vehicleList.appendChild(listItem);
        });
    } else {
        alert('Error al obtener los vehículos');
    }
});