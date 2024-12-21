let farmers = JSON.parse(localStorage.getItem('farmers')) || {}; 
let fabrica_management = JSON.parse(localStorage.getItem('fabrica_management')) || {    
    money: 100000000,          
    warehouseKg: 0,
    expenses: {}, revenues: {}
};
const factoryDisplay = new FactoryInfo(fabrica_management);
document.addEventListener('DOMContentLoaded', function () {
    updateInventoryTable();
    factoryDisplay.displayFactoryInfo();
    checkRestockAlerts();
});
// for predefining and creating JSON for inventory
let inventory = JSON.parse(localStorage.getItem('inventory')) || {
    1: { name: 'Small (100g)', weight: 0.1, price: 10, stockLevel: 0, restockThreshold: 10 },
    2: { name: 'Medium (250g)', weight: 0.25, price: 23, stockLevel: 0, restockThreshold: 20 },
    3: { name: 'Large (500g)', weight: 0.5, price: 44, stockLevel: 0, restockThreshold: 15 },
    4: { name: 'Extra Large (1kg)', weight: 1, price: 85, stockLevel: 0, restockThreshold: 5 },
    5: { name: 'Family Pack (2kg)', weight: 2, price: 150, stockLevel: 0, restockThreshold: 10 },
    6: { name: 'Bulk Pack (5kg)', weight: 5, price: 380, stockLevel: 0, restockThreshold: 5 },
    7: { name: 'Premium (Custom)', weight: 'custom', price: 0, stockLevel: 0, restockThreshold: 0 } 
};
//for updating category details 
function updateCategoryDetails(categoryId) {
    const price = parseFloat(document.getElementById(`price-${categoryId}`).value);
    const restockThreshold = parseInt(document.getElementById(`restockThreshold-${categoryId}`).value);
    if (isNaN(price) || price < 0) {
        alert("Please enter a valid price.");
        return;
    }
    if (isNaN(restockThreshold) || restockThreshold < 0) {
        alert("Please enter a valid restock threshold.");
        return;
    }
    inventory[categoryId].price = price;
    inventory[categoryId].restockThreshold = restockThreshold;
    localStorage.setItem('inventory', JSON.stringify(inventory));

    updateInventoryTable();
    checkRestockAlerts();

    alert(`Category updated. ${inventory[categoryId].name} now has a price of $${price} and restock threshold of ${restockThreshold}.`);
}
//this table created for which category stock is lower than restock threshold
function checkRestockAlerts() {
    const restockAlertsTable = document.getElementById('restockAlertsTable').querySelector('tbody');
    restockAlertsTable.innerHTML = '';  

    Object.entries(inventory).forEach(([categoryId, category]) => {  //when I delete categoryId, restockthreshold table is deleting
        if (category.stockLevel < category.restockThreshold) {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${category.name}</td>
                <td>${category.stockLevel}</td>
                <td>${category.restockThreshold}</td>
            `;
            restockAlertsTable.appendChild(row);
        }
    });
    const restockAlertsSection = document.getElementById('restockAlertsSection');
    if (restockAlertsTable.innerHTML) {
        restockAlertsSection.style.display = 'block';
    } else {
        restockAlertsSection.style.display = 'none';
    }
}

// if premium is selected, we have to enter custom weight input (blocking, end opening)
document.getElementById('categorySelect').addEventListener('change', function() {
    const categoryId = parseInt(this.value);
    if (categoryId === 7) { // 7 for premium category
        document.getElementById('customWeightDiv').style.display = 'block';
    } else {
        document.getElementById('customWeightDiv').style.display = 'none';
    }
});

//for packaging products  (controls for user enters)
document.getElementById('packageBlueberriesButton').addEventListener('click', function() {
    const categoryId = parseInt(document.getElementById('categorySelect').value);
    const quantity = parseInt(document.getElementById('quantity').value);
    const customWeight = parseFloat(document.getElementById('customWeight').value);

    if (isNaN(quantity) || quantity <= 0) {
        alert("Please enter a valid quantity.");
        return;
    }

    if (categoryId === 7 && (isNaN(customWeight) || customWeight <= 0)) {
        alert("Please enter a valid custom weight.");
        return;
    }

    if (categoryId === 7) { // 7 is for premium category
        const premiumId = addOrUpdatePremiumVariation(customWeight, quantity); // for adding or updating premium category info.
        packageProduct(premiumId, quantity); 
    } else {
        packageProduct(categoryId, quantity); 
    }
});

//for updating stocks looks at with packaging things
function packageProduct(categoryId, quantity) {
    const category = inventory[categoryId];
    let weightPerUnit;

    if (categoryId === 7) { 
        weightPerUnit = category.weight === 'custom' ? parseFloat(document.getElementById('customWeight').value) : category.weight;
    } else {
        weightPerUnit = category.weight;
    }

    if (isNaN(weightPerUnit) || weightPerUnit <= 0) {
        alert("Invalid weight for this category.");
        return;
    }

    const totalWeight = weightPerUnit * quantity;

    if (fabrica_management.warehouseKg < totalWeight) {
        alert("Not enough stock in the warehouse to package this quantity.");
        return;
    }

    const futureStockLevel = category.stockLevel + quantity;
    if (futureStockLevel < category.restockThreshold) {
        const proceed = confirm(
            `Warning: Packaging ${quantity} units will leave the stock of ${category.name} below its restock threshold of ${category.restockThreshold}. Are you sure you want to proceed?`
        );
        if (!proceed) {
            return;
        }
    }

    fabrica_management.warehouseKg -= totalWeight;   

    if (categoryId === 7) {
        const premiumId = addOrUpdatePremiumVariation(customWeight, quantity); 
        inventory[premiumId].stockLevel += quantity; 
    } else {
        inventory[categoryId].stockLevel += quantity;  
    }

    localStorage.setItem('fabrica_management', JSON.stringify(fabrica_management));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    updateInventoryTable();
    checkRestockAlerts();
    alert(`${quantity} units of ${category.name} successfully packaged!`);
}


// for adding or updating premium versions
function addOrUpdatePremiumVariation(customWeight, quantity) {
    const premiumId = `premium-${customWeight}kg`;
    if (inventory[premiumId]) {
        alert(`Premium (${customWeight} kg) already exists. Updating stock after packaging.`);
    } else {
        inventory[premiumId] = {
            name: `Premium (${customWeight} kg)`,
            weight: customWeight,
            price: customWeight * 100,  
            stockLevel: 0,  
            restockThreshold: 1  
        };
        alert(`Added new Premium (${customWeight} kg)!`);
    }

    localStorage.setItem('inventory', JSON.stringify(inventory));
    checkRestockAlerts();
    return premiumId;
}
// for updating inventory table
function updateInventoryTable() {
    const tbody = document.querySelector('#inventoryTable tbody');
    tbody.innerHTML = '';

    Object.entries(inventory).forEach(([categoryId, category]) => {
        if (category.name === 'Premium (Custom)') {
            return;  
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${category.name}</td>
            <td><input type="number" id="weight-${categoryId}" value="${category.weight}" disabled></td>
            <td><input type="number" id="price-${categoryId}" value="${category.price}" min="0"></td>
            <td><input type="number" id="stock-${categoryId}" value="${category.stockLevel}" disabled></td>
            <td><input type="number" id="restockThreshold-${categoryId}" value="${category.restockThreshold}" min="0"></td>
            <td><button onclick="updateCategoryDetails('${categoryId}')">Update</button></td>
        `;
        tbody.appendChild(row);
    });

    factoryDisplay.displayFactoryInfo();
}