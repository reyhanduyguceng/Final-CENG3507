class FactoryInfo {
    constructor(factoryData) {
        this.factoryData = factoryData || { money: 0, warehouseKg: 0, expenses:{}, revenues: {} };
    }
    //just for displaying factory information on navbar
    displayFactoryInfo() {
        document.getElementById('factoryMoney').textContent = `Money: $${this.factoryData.money.toFixed(2)}`;
        document.getElementById('warehouseKg').textContent = `Warehouse: ${this.factoryData.warehouseKg.toFixed(2)} kg`;
    }
    //displaying+ updating
    updateFabricaInfo() {
        //for displaying factory informations for the navbar 
        document.getElementById('factoryMoney').textContent = `Money: $${fabrica_management.money.toFixed(2)}`;
        document.getElementById('warehouseKg').textContent = `Warehouse: ${fabrica_management.warehouseKg.toFixed(2)} kg`;
    
        // for saving updated fabrica management information to localStorage
        localStorage.setItem('fabrica_management', JSON.stringify(fabrica_management));
    }
}