class RevenueCalculations {
    constructor() {
        this.fabricaManagement = JSON.parse(localStorage.getItem('fabrica_management')) || {
            money: 100000000,
            warehouseKg: 0,
            expenses: {},
            revenues: {},
        };
    }
    //this area for calling eventListeners
    init(){
    document.getElementById('searchCategory').addEventListener('input', (event) => {
        const categoryFilter = event.target.value.trim();
        this.updateRevenueTable(categoryFilter);
    });
    document.getElementById('searchCategory').addEventListener('input', (event) => {
        const categoryFilter = event.target.value.trim();
        this.updateRevenueTable(categoryFilter);
    });
    document.getElementById('revenueTimePeriod').addEventListener('change', () => {
        const categoryFilter = document.getElementById('searchCategory').value.trim();
        this.updateRevenueTable(categoryFilter); 
    });
    // event listener for season
    document.getElementById('seasonFilter').addEventListener('change', this.updateSalesTrendsTable);
}
    // for updating revenue table
    updateRevenueTable(categoryFilter = '') {
        const revenueTableBody = document.querySelector('#revenueTable tbody');
        revenueTableBody.innerHTML = '';  
    
        const timePeriod = document.getElementById('revenueTimePeriod').value;  
        let grandTotalRevenue = 0; 
    
        if (Object.keys(fabrica_management.revenues).length === 0) {
            const row = document.createElement('tr');
            row.innerHTML = `<td colspan="4">No revenue data available</td>`;
            revenueTableBody.appendChild(row);
            return;
        }
    
        const now = new Date();
    
        Object.entries(fabrica_management.revenues).forEach(([category, revenueData]) => {
            if (categoryFilter && !category.toLowerCase().includes(categoryFilter.toLowerCase())) {
                return;
            }
    
            if (revenueData && revenueData.sales) {
                const filteredSales = revenueData.sales.filter(sale => {
                    const saleDate = new Date(sale.saleDate);  
                    let isWithinTimePeriod = false;
    
                    if (timePeriod === 'daily' && saleDate.toDateString() === now.toDateString()) {
                        isWithinTimePeriod = true;
                    } else if (timePeriod === 'monthly' && saleDate.getMonth() === now.getMonth() && saleDate.getFullYear() === now.getFullYear()) {
                        isWithinTimePeriod = true;
                    } else if (timePeriod === 'yearly' && saleDate.getFullYear() === now.getFullYear()) {
                        isWithinTimePeriod = true;
                    }
    
                    return isWithinTimePeriod;
                });
                const totalSoldQuantity = filteredSales.reduce((acc, sale) => acc + sale.soldQuantity, 0);
                const totalRevenue = filteredSales.reduce((acc, sale) => acc + sale.revenue, 0);
    
                if (totalSoldQuantity > 0) {
                    const row = document.createElement('tr');
                    row.innerHTML = `
                        <td>${category}</td>
                        <td>${totalSoldQuantity}</td>
                        <td>$${totalRevenue.toFixed(2)}</td> 
                    `;
                    revenueTableBody.appendChild(row);
                    grandTotalRevenue += totalRevenue;
                }
            }
        });
    
        const totalRow = document.createElement('tr');
        totalRow.innerHTML = `
            <td colspan="2"><strong>Total</strong></td>
            <td><strong>$${grandTotalRevenue.toFixed(2)}</strong></td>
        `;
        revenueTableBody.appendChild(totalRow);
    }

    //for determining sales trending
    updateSalesTrendsTable() {
    const salesTrendsTableBody = document.querySelector('#salesTrendsTable tbody');
    const seasonFilter = document.getElementById('seasonFilter').value;
    salesTrendsTableBody.innerHTML = '';

    const now = new Date();
    const oneMonthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());

    const seasonalFactors = {
        spring: 1.2,  
        summer: 1.5,   
        autumn: 1.2,   
        winter: 0.9,   
        default: 1 
    };

    const trends = {};
    function getSeason(date) {
        const month = date.getMonth();
        if (month >= 2 && month <= 4) return 'spring';
        if (month >= 5 && month <= 7) return 'summer';
        if (month >= 8 && month <= 10) return 'autumn';
        return 'winter';
    }
    orders.forEach(order => {
        if (order.status === 'Delivered') {
            const saleDate = new Date(order.deliveredDate);
            const productName = order.product;
            const orderSeason = getSeason(saleDate);

            if (seasonFilter !== 'default' && orderSeason !== seasonFilter) {
                return;
            }
            if (!trends[productName]) {
                trends[productName] = {
                    totalSales: 0,
                    lastMonthSales: 0,
                    dailySales: [],
                    stockLevel: 0
                };
            }
            trends[productName].totalSales += order.quantity;

            if (saleDate >= oneMonthAgo) {
                trends[productName].lastMonthSales += order.quantity;
            }

            const saleDateString = saleDate.toDateString();
            const existingDailySale = trends[productName].dailySales.find(d => d.date === saleDateString);
            if (existingDailySale) {
                existingDailySale.quantity += order.quantity;
            } else {
                trends[productName].dailySales.push({
                    date: saleDateString,
                    quantity: order.quantity
                });
            }
        }
    });
    Object.entries(inventory).forEach(([categoryId, product]) => {
        const productName = product.name;
        if (trends[productName]) {
            trends[productName].stockLevel = product.stockLevel;
        }
    });

    Object.entries(trends).forEach(([productName, data]) => {
        const totalDailySales = data.dailySales.reduce((sum, daily) => sum + daily.quantity, 0);
        const averageDailySales = data.dailySales.length > 0 
            ? totalDailySales / data.dailySales.length 
            : 0;

        const selectedSeasonFactor = seasonalFactors[seasonFilter] || seasonalFactors.default;
        const predictedDemand = data.lastMonthSales * selectedSeasonFactor;
        const suggestedStockAdjustment = Math.round(predictedDemand - data.stockLevel);

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${productName}</td>
            <td>${averageDailySales.toFixed(2)}</td>
            <td>${data.lastMonthSales}</td>
            <td>${data.stockLevel}</td>
            <td>${Math.round(predictedDemand)}</td>
            <td>${suggestedStockAdjustment > 0 ? `+${suggestedStockAdjustment}` : suggestedStockAdjustment}</td>
        `;
        salesTrendsTableBody.appendChild(row);
    });
}


}