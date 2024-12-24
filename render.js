const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    const replaceText = (selector, text) => {
        const element = document.getElementById(selector);
        if (element) element.innerText = text;
    }
    for (const type of ['chrome', 'node', 'electron']) {
        replaceText(`${type}-version`, process.versions[type]);
    }
    cargarTablaDesdeBD()
});

document.getElementById('show-add-form').addEventListener('click', () => {
    const overlayForm = document.getElementById('overlay-form');
    overlayForm.style.display = 'flex'; // Muestra la superposición
});

document.getElementById('close-form').addEventListener('click', () => {
    const overlayForm = document.getElementById('overlay-form');
    overlayForm.style.display = 'none'; // Oculta la superposición
});



document.getElementById('vehicle-form').addEventListener('submit', (event) => {
    event.preventDefault();
    const plate = document.getElementById('plate').value;
    const brand = document.getElementById('brand').value;
    const model = document.getElementById('model').value;
    const dateC = document.getElementById('dateC').value;
    const dateV = document.getElementById('dateV').value;
    ipcRenderer.send('add-vehicle', { plate, brand, model, dateC, dateV });
    event.target.reset();
    document.getElementById('plate').focus(); 
});

ipcRenderer.on('add-vehicle-response', (event, response) => {
    if (response.success) {
        alert('Vehículo agregado correctamente');
    } else {
        alert('Error al agregar el vehículo');
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
    event.target.reset();
    document.getElementById('edit-plate').focus(); 
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
        ipcRenderer.send('get-vehicles'); 
    } else {
        alert('Error al eliminar el vehículo');
    }
});


function cargarTablaDesdeBD() {
    ipcRenderer.send('get-vehicles');
}
ipcRenderer.on('get-vehicles-response', (event, response) => {
    const tableBody = document.querySelector('#vehicleTable tbody');
    tableBody.innerHTML = ''; // Limpiar el contenido de la tabla
    if (response.success && response.vehicles.length > 0) {
        response.vehicles.forEach(vehicle => {
            const newRow = document.createElement('tr');
            const dateCFormatted = formatDate(vehicle.dateC);
            const dateVFormatted = formatDate(vehicle.dateV);
            const dateCClass = isDateWithin30Days(vehicle.dateC) ? 'highlight' : '';
            const dateVClass = isDateWithin30Days(vehicle.dateV) ? 'highlight' : '';
            newRow.innerHTML = `
                <td>${vehicle.plate}</td>
                <td>${vehicle.brand}</td>
                <td>${vehicle.model}</td>
                <td class="${dateCClass}">${dateCFormatted}</td>
                <td class="${dateVClass}">${dateVFormatted}</td>
                <td>
                    <button class="edit-button"><i class="fas fa-edit"></i></button> 
                    <button class="delete-button"><i class="fas fa-trash"></i></button>
                </td>
            `;
            tableBody.appendChild(newRow);
            newRow.querySelector('.edit-button').addEventListener('click', () => {
                // Puedes abrir el formulario de edición o modificar directamente la fila
                const editForm = document.getElementById('edit-form');
                document.getElementById('edit-plate').value = vehicle.plate;
                document.getElementById('edit-dateC').value = vehicle.dateC;
                document.getElementById('edit-dateV').value = vehicle.dateV;
                document.getElementById('edit-header').style.display = 'block';
                editForm.style.display = 'block';
            });
            newRow.querySelector('.delete-button').addEventListener('click', () => {
                if (confirm(`¿Estás seguro de que deseas eliminar el vehículo con placa ${vehicle.plate}?`)) {
                    ipcRenderer.send('delete-vehicle', { plate: vehicle.plate });
                }
            });
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="5">No hay datos disponibles</td></tr>';
    }
});
ipcRenderer.on('update-vehicles', () => {
    cargarTablaDesdeBD();
});

document.addEventListener('DOMContentLoaded', () => {
    cargarTablaDesdeBD();
});

//------------------------------    INICIO    ----------------------------------//
// RELOAD
document.getElementById('force-reload').addEventListener('click', () => {
    ipcRenderer.send('force-reload');
});

//------------------------------    FIN    ----------------------------------//


// -----------------------------    INICIO    ----------------------------- //
// funcionalidad para resetear el formato de fecha
function formatDate(dateString) {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    if (!day) {
        // Si solo hay año y mes, establece el día en 01
        return `${month}-${year}`;
    }
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', options);
}
// -----------------------------    FIN    ----------------------------- //

// -----------------------------    INICIO    ----------------------------- //
// funcion para marcar fechas
function isDateWithin30Days(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays >= 0;
}
// -----------------------------    FIN    ----------------------------- //
// -----------------------------    INICIO    ----------------------------- //
// escape para los botones de edicion de fechas
const editButtons = document.querySelectorAll('.edit-button');
const editForm = document.getElementById('edit-form');
const editHeader = document.getElementById('edit-header');
const closeButton = document.getElementById('close-form');
if (closeButton) {
    closeButton.addEventListener('click', () => {
        editForm.style.display = 'none';
        editHeader.style.display = 'none';
    });
}

editButtons.forEach(button => {
    button.addEventListener('click', () => {
        // Comprobar el estilo de visibilidad del formulario de edición
        const isFormVisible = window.getComputedStyle(editForm).display === 'block';

        if (isFormVisible) {
            // Si el formulario ya está visible, ocultarlo
            editForm.style.display = 'none';
            editHeader.style.display = 'none';
        } else {
            // Si el formulario está oculto, mostrarlo
            editForm.style.display = 'block';
            editHeader.style.display = 'block';
        }
    });
});

// Cerrar el formulario con la tecla "Esc"
document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
        editForm.style.display = 'none';
        editHeader.style.display = 'none';
    }
});
// -----------------------------    FIN    ----------------------------- //
