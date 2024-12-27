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
        tableBody.innerHTML = '<tr><td colspan="5">No hay vehiculos registrados</td></tr>';
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
    const date = new Date(year, month - 1, day); // Usar Date.UTC para evitar problemas de zona horaria
    const options = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return date.toLocaleDateString('es-ES', options);
}
// -----------------------------    FIN    ----------------------------- //

// -----------------------------    INICIO    ----------------------------- //
// funcion para marcar fechas
function isDateWithin30Days(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const diffTime = date.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays < 40 || diffDays <= 0;
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
// -----------------------------    INICIO    ----------------------------- //
// funcionalidades para la tabla de conductores

// Variables para el formulario de conductores
const showConductorFormButton = document.getElementById('show-add-form-conductor');
const conductorFormOverlay = document.getElementById('overlay-form-conductor');
const conductorForm = document.getElementById('conductor-form');
const closeConductorFormButton = document.getElementById('close-form-conductor');
const conductorTableBody = document.querySelector('#conductorTable tbody');


// Mostrar el formulario de conductores
showConductorFormButton.addEventListener('click', () => {
    conductorFormOverlay.style.display = 'flex';
});

// Cerrar el formulario de conductores
closeConductorFormButton.addEventListener('click', () => {
    conductorFormOverlay.style.display = 'none';
});

// Agregar un nuevo conductor a la tabla
conductorForm.addEventListener('submit', (e) => {
    e.preventDefault();

    // Obtener los valores del formulario
    const name = document.getElementById('name').value;
    const lastname = document.getElementById('lastname').value;
    const VLicencia = document.getElementById('VLicencia').value;
    const clase = document.getElementById('clase').value;
    const VCarnet = document.getElementById('VCarnet').value;

    ipcRenderer.send('add-driver', { name, lastname, VLicencia, clase, VCarnet });
    conductorFormOverlay.style.display = 'none';
    e.target.reset();
});

ipcRenderer.on('add-driver-response', (event, response) => {
    if (response.success) {
        alert('Conductor agregado correctamente');
    } else {
        alert('Error al agregar el conductor');
    }
});

ipcRenderer.on('update-drivers', () => {
    fetchDrivers();
});
    
async function fetchDrivers() {
        try {
            const rows = await ipcRenderer.invoke('fetch-drivers');
            conductorTableBody.innerHTML = ''; // Limpiar el contenido de la tabla

            if (rows.length === 0){
                const messageRow = document.createElement('tr');
                messageRow.innerHTML = `<td colspan="5";">No hay conductores registrados</td>`;
                conductorTableBody.appendChild(messageRow);
            } else {
                rows.forEach(driver => {
                    const row = document.createElement('tr');
                    const VLincenciaFormatted = formatDate(driver.VLicencia);
                    const VCarnetFormatted = formatDate(driver.VCarnet);
                    const VLicenciaClass = isDateWithin30Days(driver.VLicencia) ? 'highlight' : '';
                    const VCarnetClass = isDateWithin30Days(driver.VCarnet) ? 'highlight' : '';
                    row.innerHTML = `
                        <td>${driver.name}</td>
                        <td>${driver.lastname}</td>
                        <td class="${VLicenciaClass}">${VLincenciaFormatted}</td>
                        <td>${driver.clase}</td>
                        <td class="${VCarnetClass}">${VCarnetFormatted}</td>
                        <td>
                            <button class="edit-button" data-id="${driver.id}"><i class="fas fa-edit"></i></button>
                            <button class="delete-button" data-id="${driver.id}"><i class="fas fa-trash"></i></button>
                        </td>
                    `;
                    conductorTableBody.appendChild(row);
                });
                document.querySelectorAll('.edit-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        const driver = rows.find(driver => driver.id == id);
                        showEditForm(driver);
                    });
                });
                document.querySelectorAll('.delete-button').forEach(button => {
                    button.addEventListener('click', (e) => {
                        const id = e.target.closest('button').dataset.id;
                        const driver = rows.find(driver => driver.id == id);
                        if(confirm(`¿Estás seguro de que deseas eliminar a ${driver.name} ${driver.lastname}?`)){
                            ipcRenderer.send('delete-driver', { id });
                        }
                    });
                });
            }
        } catch (err) {
            console.error('Error fetching drivers', err.message);
        }
    }
    function showEditForm(driver) {
        const editForm = document.getElementById('edit-form-conductores');
        const editHeader = document.getElementById('edit-header-conductores');
        editHeader.textContent = `Editar Fechas para ${driver.name} ${driver.lastname}`;
        document.getElementById('edit-id').value = driver.id;
        document.getElementById('edit-VLicencia').value = driver.VLicencia;
        document.getElementById('edit-VCarnet').value = driver.VCarnet;
        editForm.style.display = 'block';
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                editForm.style.display = 'none';
            }
        });
    }
    const editFormC = document.getElementById('edit-form-conductores');
    editFormC.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = document.getElementById('edit-id').value;
        const VLicencia = document.getElementById('edit-VLicencia').value;
        const VCarnet = document.getElementById('edit-VCarnet').value;
        ipcRenderer.send('update-driver-dates', { id, VLicencia, VCarnet });
        editFormC.style.display = 'none';
    });


    //mensaje de confirmacion de las fechas
    ipcRenderer.on('driver-update-success', () => {
        alert('Fechas del conductor actualizadas correctamente');
    });

    ipcRenderer.on('delete-driver-response', (event, response) => {
        if (response.success) {
            alert('Conductor eliminado correctamente');
        } else {
            alert('Error al eliminar el conductor');
        } 
    });
    // Llamar a fetchDrivers al cargar la página para poblar la tabla inicialmente
    fetchDrivers();

//--------------------------------    FIN    --------------------------------//

