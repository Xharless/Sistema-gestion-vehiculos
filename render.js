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


document.addEventListener('DOMContentLoaded', () => {
    const inputPlate = document.getElementById('inputPlate');
    const btnBuscar = document.getElementById('btnBuscar');
    const tableBody = document.querySelector('#vehicleTable tbody');

    btnBuscar.addEventListener('click', async () => {
        const plate = inputPlate.value.trim();
        console.log('Matrícula ingresada:', plate);
        if (!plate) {
            alert('Por favor, ingrese una matrícula válida.');
            return;
        }
        try {
            // Enviar consulta al proceso principal
            const datos = await ipcRenderer.invoke('buscar-patente', plate);
            console.log('Datos recibidos:', datos);
            if (datos) {
                // Crear una nueva fila con los datos recibidos
                const newRow = document.createElement('tr');
                newRow.innerHTML = `
                    <td>${datos.plate}</td>
                    <td>${datos.brand}</td>
                    <td>${datos.model}</td>
                    <td>${datos.dateC}</td>
                    <td>${datos.dateV}</td>
                `;
                // Agregar la nueva fila al cuerpo de la tabla
                tableBody.appendChild(newRow);
                // Limpiar el campo de entrada
                inputPlate.value = '';
            } else {
                alert('No se encontraron datos para esta matrícula.');
            }
        } catch (error) {
            console.error('Error al buscar la matrícula:', error);
            alert('Hubo un error al buscar la matrícula.');
        }
    });
});

