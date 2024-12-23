const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
});

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

document.getElementById('search-vehicle').addEventListener('click', () => {
    const plate = document.getElementById('search-plate').value;
    ipcRenderer.send('search-vehicle', { plate });
});

ipcRenderer.on('search-vehicle-response', (event, response) => {
    const searchResults = document.getElementById('search-results');
    searchResults.innerHTML = '';
    if (response.success && response.vehicle) {
        const vehicle = response.vehicle;
        const listItem = document.createElement('li');
        listItem.innerHTML = `Placa: ${vehicle.plate}, Marca: ${vehicle.brand}, Modelo: ${vehicle.model}, FechaC: ${vehicle.dateC}, FechaV: ${vehicle.dateV} <button id="edit-button">✏️</button>`;
        searchResults.appendChild(listItem);

        // Mostrar el formulario de edición con los datos del vehículo
        document.getElementById('edit-plate').value = vehicle.plate;
        document.getElementById('edit-dateC').value = vehicle.dateC;
        document.getElementById('edit-dateV').value = vehicle.dateV;

        document.getElementById('edit-button').addEventListener('click', () => {
            document.getElementById('edit-header').style.display = 'block';
            document.getElementById('edit-form').style.display = 'block';
        });
    } else {
        searchResults.textContent = 'Vehículo no encontrado';
        document.getElementById('edit-header').style.display = 'none';
        document.getElementById('edit-form').style.display = 'none';
    }
});

document.getElementById('edit-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const plate = document.getElementById('edit-plate').value;
    const dateC = document.getElementById('edit-dateC').value;
    const dateV = document.getElementById('edit-dateV').value;
    ipcRenderer.send('edit-vehicle', { plate, dateC, dateV });
});

ipcRenderer.on('edit-vehicle-response', (event, response) => {
    if (response.success) {
        alert('Fechas del vehículo actualizadas correctamente');
    } else {
        alert('Error al actualizar las fechas del vehículo');
    }
});