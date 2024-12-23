let inventory = JSON.parse(localStorage.getItem('inventory')) || {};
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let fabrica_management = JSON.parse(localStorage.getItem('fabrica_management')) || { money: 100000000, warehouseKg: 0, expenses:{}, revenues: {} };
let cart = []; // shop cart list
const revenueCalculations = new RevenueCalculations();
const factoryDisplay = new FactoryInfo(fabrica_management);
// for generating auto unique IDs
function generateOrderId() {
    return 'ORD-' + Date.now();
}


// for populating product gallery for each categorie
function populateProductGallery() {
    const productGallery = document.getElementById('productGallery');
    productGallery.innerHTML = '';  
    Object.entries(inventory).forEach(([categoryId, category]) => {
        let imageSrc = `images/${categoryId}.jpg`;     
        if (category.name.startsWith('Premium')) {
            imageSrc = 'images/7.jpg';  
            if (category.stockLevel <= 0 ) {
                delete inventory[categoryId];
                localStorage.setItem('inventory', JSON.stringify(inventory)); 
                return; 
            }
        }
        const productCard = document.createElement('div');
        productCard.classList.add('product-card');
        productCard.innerHTML = `
            <img src="${imageSrc}" alt="${category.name}" onclick="selectProduct('${categoryId}')" />
            <h4>${category.name}</h4>
            <p>Weight: ${category.weight} kg</p>
            <p>Price: $${category.price.toFixed(2)}</p>
            <p>Stock: ${category.stockLevel > 0 ? category.stockLevel : 'Out of Stock'}</p>
        `;
        productGallery.appendChild(productCard);
    });
}

let selectedProduct = null; //for controlling selected product
function selectProduct(categoryId) {
    selectedProduct = inventory[categoryId];
    alert(`Selected Product: ${selectedProduct.name}`);
}

//event listener for creating speacil orders
document.getElementById('createSpecialOrder').addEventListener('click', () => {
    const specialOrderInputDiv = document.getElementById('specialOrderInputDiv');
    specialOrderInputDiv.style.display = 'block';

    document.getElementById('specialOrderWeight').addEventListener('input', () => {
        const customWeight = parseFloat(document.getElementById('specialOrderWeight').value);
        if (!isNaN(customWeight) && customWeight > 0) {

            selectedProduct = {
                name: `Premium (${customWeight} kg)`,  
                weight: customWeight,
                price: customWeight * 100, 
            };
        }
    });
});

const quantityInput = document.getElementById('quantityInput'); 
const totalCostDisplay = document.getElementById('totalCostDisplay'); 
quantityInput.addEventListener('input', () => {
    const quantity = parseInt(quantityInput.value);
    if (selectedProduct && !isNaN(quantity) && quantity > 0) {
        const totalCost = quantity * selectedProduct.price;
        totalCostDisplay.textContent = `Total Cost: $${totalCost.toFixed(2)}`;
    } else {
        totalCostDisplay.textContent = "Total Cost: $0.00";
    }
});

let savedCustomerDetails = null;

// this event listener for controlling order details form
document.getElementById('orderDetailsForm').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!savedCustomerDetails) {
        const customerName = document.getElementById('customerName').value.trim();
        const customerContact = document.getElementById('customerContact').value.trim();
        const shippingInfo = document.getElementById('shippingInfo').value.trim();
        if (!customerName || !customerContact || !shippingInfo) {
            alert("Please fill all fields before submitting the first order!");
            return;
        }
        savedCustomerDetails = { customerName, customerContact, shippingInfo };
        document.getElementById('customerName').value = customerName;
        document.getElementById('customerContact').value = customerContact;
        document.getElementById('shippingInfo').value = shippingInfo;
        document.getElementById('customerName').disabled = true;
        document.getElementById('customerContact').disabled = true;
        document.getElementById('shippingInfo').disabled = true;
    }
    const quantity = parseInt(quantityInput.value);
    if (!selectedProduct || !quantity || isNaN(quantity) || quantity <= 0) {
        alert("Please select a product and enter a valid quantity!");
        return;
    }
    const totalCost = quantity * selectedProduct.price;
    const newOrder = {
        orderId: generateOrderId(),
        customerName: savedCustomerDetails.customerName,
        customerContact: savedCustomerDetails.customerContact,
        shippingInfo: savedCustomerDetails.shippingInfo,
        product: selectedProduct.name,
        quantity,
        totalCost,
        status: 'Pending',
        placedDate: new Date().toISOString()
    };
    cart.push(newOrder); 
    displayCart(); 
    alert("Order added to cart!");
    document.getElementById('orderDetailsForm').reset();
    totalCostDisplay.textContent = "Total Cost: $0.00";
});

//for displaying shopping cart
function displayCart() {
    const cartTableBody = document.querySelector('#cartTable tbody');
    cartTableBody.innerHTML = '';
    if (cart.length === 0) {
        cartTableBody.innerHTML = '<tr><td colspan="6">No orders in cart</td></tr>';
        return;
    }
    cart.forEach((order, index) => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.customerName}</td>
            <td>${order.product}</td>
            <td>${order.quantity}</td>
            <td>$${order.totalCost.toFixed(2)}</td>
            <td>${order.shippingInfo}</td>
            <td><button onclick="removeFromCart(${index})">Remove</button></td>
        `;
        cartTableBody.appendChild(row);
    });
}
//this event listener for submitting shopping cart
document.getElementById('submitCart').addEventListener('click', () => {
    if (cart.length === 0) {
        alert("Your cart is empty!");
        return;
    }
    const orderId = generateOrderId();
    const placedDate = new Date().toISOString(); 
    cart.forEach(order => {
        order.orderId = orderId; 
        order.placedDate = placedDate; 
        orders.push(order);
    });
    localStorage.setItem('orders', JSON.stringify(orders));
    cart = []; 
    displayCart();
    updateOrdersTable();
    alert(`All orders with ID: ${orderId} have been placed successfully!`);
});
//for removing any order from shopping cart
function removeFromCart(index) {
    cart.splice(index, 1);
    displayCart();
}
//for common filter appliers 
function applyFilters() {
    const customerNameFilter = document.getElementById('searchCustomer').value.trim();
    const productCategoryFilter = document.getElementById('searchProduct').value.trim();
    const locationFilter = document.getElementById('searchLocation').value.trim();
    const statusFilter = document.getElementById('searchStatus').value;
    const filters = {
        customer: customerNameFilter,
        product: productCategoryFilter,
        status: statusFilter,
        location:locationFilter,
    };
    updateOrdersTable(filters);  
}
//for updating orders table with filtering
function updateOrdersTable(filters = {}) {
    const ordersTableBody = document.querySelector('#ordersTable tbody');
    ordersTableBody.innerHTML = '';  

    const filteredOrders = orders.filter(order => {
        let matches = true;
        if (filters.customer && !order.customerName.toLowerCase().includes(filters.customer.toLowerCase())) {
            matches = false;
        }
        if (filters.product && !order.product.toLowerCase().includes(filters.product.toLowerCase())) {
            matches = false;
        }
        if (filters.location && !order.shippingInfo.toLowerCase().includes(filters.location.toLowerCase())) {
            matches = false;
        }
        if (filters.status && order.status !== filters.status) {
            matches = false;
        }
        return matches;
    });
    filteredOrders.forEach(order => {
        let productName = order.product;
        if (productName.startsWith('Premium')) {
            const weight = ((order.totalCost /100) ) / order.quantity;  
            productName = `Premium (${weight} kg)`;  
        }
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${order.orderId}</td>
            <td>${order.customerName}</td>
            <td>${order.customerContact}</td>
            <td>${order.shippingInfo}</td>
            <td>${productName}</td> 
            <td>${order.quantity}</td>
            <td>$${order.totalCost.toFixed(2)}</td>
            <td>${order.status}</td>
            <td>${order.placedDate ? new Date(order.placedDate).toLocaleString() : ''}</td>
            <td>${order.processedDate ? new Date(order.processedDate).toLocaleString() : ''}</td>
            <td>${order.shippedDate ? new Date(order.shippedDate).toLocaleString() : ''}</td>
            <td>${order.deliveredDate ? new Date(order.deliveredDate).toLocaleString() : ''}</td>
            <td>
                <button onclick="updateOrderStatus('${order.orderId}', 'Processed')">Process</button>
                <button onclick="updateOrderStatus('${order.orderId}', 'Shipped')">Ship</button>
                <button onclick="updateOrderStatus('${order.orderId}', 'Delivered')">Deliver</button>
            </td>
        `;
        ordersTableBody.appendChild(row);
    });
}

//for updating order status operations
function updateOrderStatus(orderId, newStatus) {
    const matchingOrders = orders.filter(o => o.orderId === orderId); 
    if (matchingOrders.length === 0) {
        alert('Order not found!');
        return;
    }
    const currentDate = new Date().toISOString();
    let stockInsufficient = false;
    let inventoryUpdates = []; 
    if (newStatus === 'Shipped') {
        matchingOrders.forEach(order => {
            const product = Object.values(inventory).find(p => p.name === order.product);
            if (!product) {
                alert(`Product "${order.product}" not found in inventory!`);
                stockInsufficient = true;
                return;
            }

            if (product.stockLevel < order.quantity) {
                alert(`Not enough stock for product "${order.product}"!`);
                stockInsufficient = true;
                return;
            }
            inventoryUpdates.push({ product, quantity: order.quantity });
        });

        if (stockInsufficient) {
            return; 
        }
        inventoryUpdates.forEach(update => {
            const product = update.product;
            const quantity = update.quantity;
            product.stockLevel -= quantity;
        });
    }
    matchingOrders.forEach(order => {
        if (order.status === 'Delivered') {
            alert(`Order ${orderId} has already been delivered and cannot be updated further.`);
            return;
        }

        if (newStatus === 'Shipped' && order.status !== 'Processed') {
            alert(`You must process the order ${orderId} before shipping!`);
            return;
        }

        if (newStatus === 'Delivered' && order.status !== 'Shipped') {
            alert(`You must ship the order ${orderId} before delivery!`);
            return;
        }
        order.status = newStatus;
        if (newStatus === 'Processed') {
            order.processedDate = currentDate;
        } else if (newStatus === 'Shipped') {
            order.shippedDate = currentDate;
        } else if (newStatus === 'Delivered') {
            order.deliveredDate = currentDate;
            fabrica_management.money += order.totalCost;

            const category = order.product.startsWith('Premium')
                ? `Premium (${parseFloat(order.product.match(/\((\d+(\.\d+)?)\s?kg\)/)?.[1] || '0')} kg)`
                : order.product.split(' ')[0];

            if (!fabrica_management.revenues[category]) {
                fabrica_management.revenues[category] = { soldQuantity: 0, totalRevenue: 0, sales: [] };
            }
            fabrica_management.revenues[category].soldQuantity += order.quantity;
            fabrica_management.revenues[category].totalRevenue += order.totalCost;
            fabrica_management.revenues[category].sales.push({
                orderId: order.orderId,
                productName: order.product,
                soldQuantity: order.quantity,
                revenue: order.totalCost,
                saleDate: order.deliveredDate
            });
            revenueCalculations.updateRevenueTable();
            revenueCalculations.updateSalesTrendsTable();
        }
    });
    localStorage.setItem('orders', JSON.stringify(orders));
    localStorage.setItem('inventory', JSON.stringify(inventory));
    localStorage.setItem('fabrica_management', JSON.stringify(fabrica_management));

    alert(`All orders with ID: ${orderId} have been updated to ${newStatus}!`);
    updateOrdersTable();
    factoryDisplay.updateFabricaInfo();
    populateProductGallery();
    updateRevenueTable();
    revenueCalculations.updateSalesTrendsTable();
}

//this event listener helps us to always recontrol our functions (is any changing)
document.addEventListener('DOMContentLoaded', () => {
    factoryDisplay.updateFabricaInfo();
    populateProductGallery();
    updateOrdersTable(); 
    revenueCalculations.updateRevenueTable();
    revenueCalculations.init();
    displayCart();
    revenueCalculations.updateSalesTrendsTable();
});