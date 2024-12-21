let farmers = JSON.parse(localStorage.getItem('farmers')) || {};  //local storage JSON defining for farmers
let fabrica_management = JSON.parse(localStorage.getItem('fabrica_management')) || { money: 100000000, warehouseKg: 0, expenses:{}, revenues: {} }; //local storage JSON defining for fabrica management
const factoryDisplay = new FactoryInfo(fabrica_management);
const expenseCalculations= new ExpenseCalculations();
//this event listener helps us to always recontrol our functions (is any changing)
document.addEventListener('DOMContentLoaded', () => {    
    populateDropdown(document.getElementById('farmerSelect'), farmers);
    updateFarmerTable();
    factoryDisplay.displayFactoryInfo();
});

function generateFarmerId() {
    return 'FARMER-' + Date.now();
}

function generatePurchaseId(){
    return 'PURCHASE-' + Date.now();
}

// for populating our dropdown menüs
function populateDropdown(selectElement, data) {
    selectElement.innerHTML = '<option value="" disabled selected>Select Farmer</option>';
    Object.entries(data).forEach(([id, farmer]) => {
        const option = document.createElement('option');
        option.textContent = farmer.farmerName;
        option.value = id;
        selectElement.appendChild(option);
    });
}

// for inner html this for farmer table
function updateFarmerTable(filters = {}) {
    const tableBody = document.querySelector('#farmerTable tbody');
    tableBody.innerHTML = '';

    const filteredFarmers = Object.entries(farmers).filter(([_, farmer]) => {
        return (!filters.farmerName || farmer.farmerName.toLowerCase().includes(filters.farmerName.toLowerCase())) &&
               (!filters.location || farmer.location.toLowerCase().includes(filters.location.toLowerCase()));
    });

    if (filteredFarmers.length > 0) {
        filteredFarmers.forEach(([id, farmer]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${id}</td>
                <td>${farmer.farmerName}</td>
                <td>${farmer.contact}</td>
                <td>${farmer.location}</td>
                <td>
                    <button onclick="editFarmer('${id}')">Edit</button>
                    <button onclick="deleteFarmer('${id}')">Delete</button>
                    <button onclick="viewPurchases('${id}')">Purchases</button>
                </td>
            `;
            tableBody.appendChild(row);
        });
    } else {
        tableBody.innerHTML = '<tr><td colspan="5">No farmers found</td></tr>';
    }
}

// for farmer filters
function applyFarmerFilters() {
    const farmerNameFilter = document.getElementById('searchFarmerName').value.trim();
    const locationFilter = document.getElementById('searchLocation').value.trim();

    const filters = {
        farmerName: farmerNameFilter || null,
        location: locationFilter || null,
    };

    updateFarmerTable(filters);  
}

// event listeners for searching
document.getElementById('searchFarmerName').addEventListener('input', applyFarmerFilters);
document.getElementById('searchLocation').addEventListener('input', applyFarmerFilters);

// for adding or updating farmers
document.getElementById('addFarmerButton').addEventListener('click', () => {
    const farmerName = document.getElementById('farmerName').value.trim();
    const contact = document.getElementById('farmerContact').value.trim();
    const location = document.getElementById('farmerLocation').value.trim();

    if (!farmerName || !contact || !location) {
        alert("All fields are required!");
        return;
    }

    const editingFarmerId = document.getElementById('addFarmerButton').dataset.editingFarmerId;

    if (editingFarmerId) {
        farmers[editingFarmerId] = {...farmers[editingFarmerId], farmerName, contact, location };
        alert("Farmer updated successfully!");
        delete document.getElementById('addFarmerButton').dataset.editingFarmerId; 
    } else {
        
        const farmerId = generateFarmerId();
        farmers[farmerId] = { farmerId, farmerName, contact, location, purchases: [] };
        alert("Farmer added successfully!");
    }

    localStorage.setItem('farmers', JSON.stringify(farmers));
    updateFarmerTable();
    populateDropdown(document.getElementById('farmerSelect'), farmers);
    document.getElementById('farmerForm').reset();
    document.getElementById('addFarmerButton').textContent = 'Add Farmer'; 
});

// for editing farmer informations, helper
function editFarmer(farmerId) {
    const farmer = farmers[farmerId];
    if (!farmer) {
        alert("Farmer not found!");
        return;
    }
 
    document.getElementById('farmerName').value = farmer.farmerName;
    document.getElementById('farmerContact').value = farmer.contact;
    document.getElementById('farmerLocation').value = farmer.location;    
    document.getElementById('addFarmerButton').textContent = 'Update Farmer';
    document.getElementById('addFarmerButton').dataset.editingFarmerId = farmerId; 
    populateDropdown(document.getElementById('farmerSelect'), farmers);
}

// for deleting farmer from list
function deleteFarmer(farmerId) {
    if (confirm(`Are you sure you want to delete ${farmers[farmerId].farmerName}?`)) {
        delete farmers[farmerId];
        localStorage.setItem('farmers', JSON.stringify(farmers));
        updateFarmerTable();
        populateDropdown(document.getElementById('farmerSelect'), farmers);
    }
}

// for buying products from farmer
document.getElementById('addPurchaseButton').addEventListener('click', () => {
    const farmerId = document.getElementById('farmerSelect').value.trim();
    const purchaseDate = document.getElementById('purchaseDate').value.trim();
    const quantity = parseFloat(document.getElementById('quantity').value.trim());
    const pricePerKg = parseFloat(document.getElementById('pricePerKg').value.trim());
    const purchaseId = generatePurchaseId();
    if (!farmerId || !purchaseDate || !quantity || !pricePerKg) {
        alert("All fields are required!");
        return;
    }


    const totalCost = quantity * pricePerKg;

    // money enough or not controlling
    if (fabrica_management.money < totalCost) {
        alert("Not enough money to complete this purchase!");
        return;
    }

    fabrica_management.money -= totalCost;

    fabrica_management.warehouseKg += quantity;

    farmers[farmerId].purchases.push({
        purchaseId,
        purchaseDate,
        quantity,
        pricePerKg,
        totalCost
    });

    localStorage.setItem('farmers', JSON.stringify(farmers));
    localStorage.setItem('fabrica_management', JSON.stringify(fabrica_management));

    alert("Purchase successful!");
    viewPurchases(farmerId);
    updateFarmerTable(); 
    factoryDisplay.displayFactoryInfo(); 
});

// when we clicked the view button, view table open with inherited table
function viewPurchases(farmerId) {
    const farmer = farmers[farmerId];
    const purchaseDetailsTable = document.querySelector('#purchaseDetailsTable tbody');
    const purchaseDetailsSection = document.getElementById('purchaseDetailsSection');
    
    document.getElementById('farmerName').textContent = farmer.farmerName;
    purchaseDetailsTable.innerHTML = farmer.purchases.length > 0 
        ? farmer.purchases.map(purchase => `
            <tr>
                <td>${purchase.purchaseId}</td>
                <td>${purchase.purchaseDate}</td>
                <td>${purchase.quantity}</td>
                <td>$${purchase.pricePerKg}</td>
                <td>$${purchase.totalCost}</td>
            </tr>
        `).join('')
        : '<tr><td colspan="5">No purchases available</td></tr>';
    purchaseDetailsSection.style.display = 'block';
}

// for calculating total quantity for saled products
function calculateTotalQuantity() {
    let totalQuantity = 0;
    Object.values(farmers).forEach(farmer => {
        farmer.purchases.forEach(purchase => {
            totalQuantity += purchase.quantity; 
        });
    });
    return totalQuantity;
}