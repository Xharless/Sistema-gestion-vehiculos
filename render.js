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

document.getElementById('show-add-form').addEventListener('click', () => {
    const form = document.getElementById('vehicle-form');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
});

document.getElementById('show-search-form').addEventListener('click', () => {
    const searchSection = document.getElementById('search-section');
    searchSection.style.display = searchSection.style.display === 'none' ? 'block' : 'none';
    ipcRenderer.send('get-vehicles');
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
        alert('Vehículo agregado correctamente');
    } else {
        alert('Error al agregar el vehículo');
    }
});

ipcRenderer.on('get-vehicles-response', (event, response) => {
    if (response.success) {
        const searchResults = document.getElementById('search-results');
        searchResults.innerHTML = '';
        response.vehicles.forEach(vehicle => {
            const listItem = document.createElement('li');
            listItem.innerHTML = `
                Placa: ${vehicle.plate}, Marca: ${vehicle.brand}, Modelo: ${vehicle.model}, FechaC: ${vehicle.dateC}, FechaV: ${vehicle.dateV}
                <button class="edit-button"><i class="fas fa-edit"></i></button>
                <button class="delete-button"><i class="fas fa-trash"></i></button>
            `;
            searchResults.appendChild(listItem);

            listItem.querySelector('.edit-button').addEventListener('click', () => {
                const editForm = document.getElementById('edit-form');
                const editHeader = document.getElementById('edit-header');
                if (editForm.style.display === 'none' || editForm.style.display === '') {
                    document.getElementById('edit-plate').value = vehicle.plate;
                    document.getElementById('edit-dateC').value = vehicle.dateC;
                    document.getElementById('edit-dateV').value = vehicle.dateV;
                    editHeader.style.display = 'block';
                    editForm.style.display = 'block';
                } else {
                    editHeader.style.display = 'none';
                    editForm.style.display = 'none';
                }
            });

            listItem.querySelector('.delete-button').addEventListener('click', () => {
                if (confirm(`¿Estás seguro de que deseas eliminar el vehículo con placa ${vehicle.plate}?`)) {
                    ipcRenderer.send('delete-vehicle', { plate: vehicle.plate });
                }
            });
        });
    } else {
        alert('Error al obtener los vehículos');
    }
});

document.getElementById('search-vehicle').addEventListener('click', () => {
    ipcRenderer.send('get-vehicles');
});

document.getElementById('search-plate').addEventListener('input', () => {
    const plate = document.getElementById('search-plate').value.toLowerCase();
    const searchResults = document.getElementById('search-results');
    const items = searchResults.getElementsByTagName('li');
    for (let i = 0; i < items.length; i++) {
        const item = items[i];
        const text = item.textContent.toLowerCase();
        if (text.includes(plate)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
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

ipcRenderer.on('delete-vehicle-response', (event, response) => {
    if (response.success) {
        alert('Vehículo eliminado correctamente');
        ipcRenderer.send('get-vehicles'); // Refresh the list
    } else {
        alert('Error al eliminar el vehículo');
    }
});

// agregar filas
document.getElementById('add-row').addEventListener('click', function() {
    var table = document.getElementById('vehicle-table').getElementsByTagName('tbody')[0];
    var newRow = table.insertRow();

    for (var i = 0; i < 5; i++) {
        var newCell = newRow.insertCell(i);
        var input = document.createElement('input');
        if(i<3){
            input.type = 'text';
        } else {
            input.type = 'date';
        }
        
        newCell.appendChild(input);
    }
    
});