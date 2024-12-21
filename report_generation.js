let farmers = JSON.parse(localStorage.getItem('farmers')) || {};
let fabrica_management = JSON.parse(localStorage.getItem('fabrica_management')) || {
    money: 100000000,          
    warehouseKg: 0, 
    expenses: {},
    revenues: {},  
};
let orders = JSON.parse(localStorage.getItem('orders')) || [];
let inventory = JSON.parse(localStorage.getItem('inventory')) || {};
const factoryDisplay = new FactoryInfo(fabrica_management);
const expenseCalculations = new ExpenseCalculations();
const revenueCalculations = new RevenueCalculations();
document.addEventListener('DOMContentLoaded', () => {
    factoryDisplay.displayFactoryInfo();
    expenseCalculations.displayExpenses();
    revenueCalculations.updateRevenueTable();
    displayYearlyDataTable();
    revenueCalculations.init();
    revenueCalculations.updateSalesTrendsTable();
});


//this function for calculating tax for specific time period
function calculateTaxForTimePeriod(timePeriod = 'monthly') {
    const now = new Date();
    let startDate = new Date(now);  

    if (timePeriod === 'daily') {
        startDate.setHours(0, 0, 0, 0);  
    } else if (timePeriod === 'monthly') {
        startDate.setDate(1); 
        startDate.setHours(0, 0, 0, 0); 
    } else if (timePeriod === 'yearly') {
        startDate.setMonth(0);
        startDate.setDate(1); 
        startDate.setHours(0, 0, 0, 0);  
    }

    let totalRevenue = 0;
    Object.entries(fabrica_management.revenues).forEach(([category, revenueData]) => {
        if (revenueData && revenueData.sales) {
            const filteredSales = revenueData.sales.filter(sale => {
                const saleDate = new Date(sale.saleDate);
                return saleDate >= startDate && saleDate <= now;
            });

            totalRevenue += filteredSales.reduce((acc, sale) => acc + sale.revenue, 0);
        }
    });

    let totalExpenses = 0;
    Object.entries(fabrica_management.expenses).forEach(([farmerId, farmerExpense]) => {
        if (farmerExpense.total > 0) {
            const farmer = farmers[farmerId];
            farmerExpense.total = 0;
            farmer.purchases.forEach(purchase => {
                const purchaseDate = new Date(purchase.purchaseDate);
                if (purchaseDate >= startDate && purchaseDate <= now) {
                    totalExpenses += purchase.totalCost;
                }
            });
        }
    });
    const taxRate = 0.18;
    const taxAmount = (totalRevenue - totalExpenses) * taxRate;
    return taxAmount > 0 ? taxAmount : 0; 
}
//this function for seeing monthly expenses, revenues, profits, taxes, net profitd
function displayYearlyDataTable() {
    const now = new Date();
    const yearlyData = [];

    for (let i = 0; i < 12; i++) {
        const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
        yearlyData.push({
            month: month.toLocaleString('default', { month: 'long', year: 'numeric' }),
            revenue: 0,
            expenses: 0,
            profit: 0,
            tax: 0,
            netprofit: 0
        });
    }

    yearlyData.forEach((data, index) => {
        const monthStart = new Date(now.getFullYear(), now.getMonth() - index, 1);
        const monthEnd = new Date(now.getFullYear(), now.getMonth() - index + 1, 0);

        Object.entries(fabrica_management.revenues).forEach(([category, revenueData]) => {
            if (revenueData.sales) {
                const filteredSales = revenueData.sales.filter(sale => {
                    const saleDate = new Date(sale.saleDate);
                    return saleDate >= monthStart && saleDate <= monthEnd;
                });
                data.revenue += filteredSales.reduce((acc, sale) => acc + sale.revenue, 0);
            }
        });
        Object.entries(fabrica_management.expenses).forEach(([farmerId, farmerExpense]) => {
            const farmer = farmers[farmerId];
            if (farmer && farmer.purchases) {
                const filteredPurchases = farmer.purchases.filter(purchase => {
                    const purchaseDate = new Date(purchase.purchaseDate);
                    return purchaseDate >= monthStart && purchaseDate <= monthEnd;
                });
                data.expenses += filteredPurchases.reduce((acc, purchase) => acc + purchase.totalCost, 0);
            }
        });

        data.profit = data.revenue - data.expenses;
        const taxRate = 0.18;
        data.tax = (data.profit > 0) ? data.profit * taxRate : 0;
        data.netprofit = data.profit - data.tax;
    });

    let tableHTML = `<table>
        <thead>
            <tr>
                <th>Month</th>
                <th>Revenue ($)</th>
                <th>Expenses ($)</th>
                <th>Profit ($)</th>
                <th>Tax ($)</th>
                <th>Net Profit ($)</th>
            </tr>
        </thead>
        <tbody>`;

    yearlyData.reverse().forEach(data => {
        tableHTML += `
            <tr>
                <td>${data.month}</td>
                <td>$${data.revenue.toFixed(2)}</td>
                <td>$${data.expenses.toFixed(2)}</td>
                <td>$${data.profit.toFixed(2)} </td>
                <td>$${data.tax.toFixed(2)} </td>
                <td>$${data.netprofit.toFixed(2)} </td>
            </tr>`;
    });

    tableHTML += `</tbody></table>`;
    document.getElementById('yearlyDataTable').innerHTML = tableHTML;
}

displayYearlyDataTable();