class ExpenseCalculations {
    constructor() {
        this.farmers = JSON.parse(localStorage.getItem('farmers')) || {};
        this.fabricaManagement = JSON.parse(localStorage.getItem('fabrica_management')) || {
            money: 100000000,
            warehouseKg: 0,
            expenses: {},
            revenues: {},
        };
    }
    //this function for calculating total expenses for specific time areas
    calculateTotalExpenses(timePeriod = 'daily') {
        let totalCost = 0;
        const now = new Date();

        Object.entries(this.farmers).forEach(([farmerId, farmer]) => {
            if (!this.fabricaManagement.expenses[farmerId]) {
                this.fabricaManagement.expenses[farmerId] = {
                    total: 0,
                    purchases: []
                };
            }

            let farmerTotal = 0;
            farmer.purchases.forEach(purchase => {
                const purchaseDate = new Date(purchase.purchaseDate);
                let isWithinTimePeriod = false;

                if (timePeriod === 'daily' && purchaseDate.toDateString() === now.toDateString()) {
                    isWithinTimePeriod = true;
                } else if (timePeriod === 'yearly' && now.getFullYear() === purchaseDate.getFullYear()) {
                    isWithinTimePeriod = true;
                } else if (timePeriod === 'monthly' && now.getMonth() === purchaseDate.getMonth()) {
                    isWithinTimePeriod = true;
                }

                if (isWithinTimePeriod) {
                    farmerTotal += purchase.totalCost;
                }
            });

            this.fabricaManagement.expenses[farmerId].total = farmerTotal;
            totalCost += farmerTotal;
        });

        localStorage.setItem('fabrica_management', JSON.stringify(this.fabricaManagement));
        return totalCost;
    }
    //this function for displaying the expenses 
    displayExpenses() {
        const timePeriod = document.getElementById('expenseTimePeriod').value;
        const totalExpenses = this.calculateTotalExpenses(timePeriod);
        const expenseText = `Total expenses (${timePeriod}): $${totalExpenses.toFixed(2)}`;
        document.getElementById('totalExpenses').textContent = expenseText;

        let expenseDetails = '<h3>Expenses Breakdown by Farmer:</h3><table><thead><tr><th>Farmer</th><th>Total Expenses</th><th>Details</th></tr></thead><tbody>';
        Object.entries(this.fabricaManagement.expenses).forEach(([farmerId, farmerExpense]) => {
            if (farmerExpense.total > 0) {
                const farmer = this.farmers[farmerId];
                if (!farmer) return;

                expenseDetails += `
                    <tr>
                        <td>${farmer.farmerName}</td>
                        <td>$${farmerExpense.total.toFixed(2)}</td>
                        <td>
                            <button onclick="expenseCalculations.viewFarmerExpenses('${farmerId}')">View Details</button>
                        </td>
                    </tr>
                `;
            }
        });

        expenseDetails += '</tbody></table>';
        document.getElementById('expenseDetails').innerHTML = expenseDetails;
    }
    //this function for seeing farmer expenses for specific time periods and also selected farmer details
    viewFarmerExpenses(farmerId) {
        const farmer = this.farmers[farmerId];
        if (!farmer) {
            console.error(`Farmer with ID ${farmerId} not found`);
            return;
        }

        const purchaseDetailsTable = document.querySelector('#purchaseDetailsTable tbody');
        const purchaseDetailsSection = document.getElementById('purchaseDetailsSection');

        purchaseDetailsTable.innerHTML = '';

        const timePeriod = document.getElementById('expenseTimePeriod').value;
        const now = new Date();

        const filteredPurchases = farmer.purchases.filter(purchase => {
            const purchaseDate = new Date(purchase.purchaseDate);
            let isWithinTimePeriod = false;

            if (timePeriod === 'daily' && purchaseDate.toDateString() === now.toDateString()) {
                isWithinTimePeriod = true;
            } else if (timePeriod === 'yearly' && now.getFullYear() === purchaseDate.getFullYear()) {
                isWithinTimePeriod = true;
            } else if (timePeriod === 'monthly' && now.getFullYear() === purchaseDate.getFullYear() && now.getMonth() === purchaseDate.getMonth()) {
                isWithinTimePeriod = true;
            }

            return isWithinTimePeriod;
        });

        if (filteredPurchases.length > 0) {
            filteredPurchases.forEach(purchase => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${purchase.purchaseId}</td>
                    <td>${purchase.purchaseDate}</td>
                    <td>${purchase.quantity}</td>
                    <td>$${purchase.pricePerKg}</td>
                    <td>$${purchase.totalCost}</td>
                `;
                purchaseDetailsTable.appendChild(row);
            });
        } else {
            purchaseDetailsTable.innerHTML = '<tr><td colspan="5">No purchases available for this time period</td></tr>';
        }

        document.getElementById('farmerName').textContent = farmer.farmerName;
        purchaseDetailsSection.style.display = 'block';
    }
    //for closing purchaseDetailsSection
    closePurchaseDetails() {
        document.getElementById('purchaseDetailsSection').style.display = 'none';
    }
}