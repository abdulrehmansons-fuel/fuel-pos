export interface SalesItem {
    orderId: string;
    date: string;
    fuelType: string;
    quantity: number;
    totalPrice: number;
    purchasePrice: number;
    totalProfit: number;
    pump: string;
    status: string;
    pumpId: string;
}

export interface EmployerItem {
    employerName: string;
    pump: string;
    role: string;
    email: string;
    dateJoined: string;
    status: string;
    pumpId: string;
    salary: number;
    totalProfit?: number;
}

export interface PumpItem {
    pumpId: string;
    location: string;
    fuelType: string;
    status: string;
    lastMaintenance: string;
    totalDispensed: number;
    totalProfit?: number;
}

export interface ExpenseItem {
    expenseId: string;
    date: string;
    category: string;
    amount: number;
    description: string;
    location: string;
    pumpId: string;
}

export interface StockItem {
    fuelType: string;
    quantity: number;
    price: number;
    purchasePrice: number;
    location: string;
    lastUpdated: string;
    pumpId: string;
}

export interface ReportData {
    sales: SalesItem[];
    employers: EmployerItem[];
    pumps: PumpItem[];
    expenses: ExpenseItem[];
    stocks: StockItem[];
}
