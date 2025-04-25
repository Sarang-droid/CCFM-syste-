const mongoose = require('mongoose');

const MetricSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    
    // Raw Inputs (17 fields)
    inputs: {
        // Revenue & Receivables
        totalRevenue: { type: Number, required: true },
        subscriptionRevenue: { type: Number },
        accountsReceivable: { type: Number, required: true },
        totalCreditSales: { type: Number, required: true },
        
        // Payables & Inventory
        accountsPayable: { type: Number, required: true },
        inventoryValue: { type: Number },
        cogs: { type: Number, required: true },
        
        // Cash Flows
        cashInflows: { type: Number, required: true },
        cashOutflows: { type: Number, required: true },
        operatingExpenses: { type: Number },
        
        // Reserves & Debt
        totalReserve: { type: Number },
        usedReserve: { type: Number },
        totalDebt: { type: Number },
        
        // Customer Metrics
        totalUsersStart: { type: Number, required: true },
        totalUsersEnd: { type: Number },
        churnedUsers: { type: Number },
        newUsersAcquired: { type: Number },
        totalAcquisitionCost: { type: Number }
    },
    
    // Calculated Metrics (20 fields)
    metrics: {
        // Core Metrics
        ARPU: { type: Number },                   // Average Revenue Per User
        DSO: { type: Number },                    // Days Sales Outstanding
        DPO: { type: Number },                    // Days Payable Outstanding
        DIO: { type: Number },                    // Days Inventory Outstanding
        CCC: { type: Number },                    // Cash Conversion Cycle
        NCF: { type: Number },                    // Net Cash Flow
        burnRate: { type: Number },               // Burn Rate
        runway: { type: Number },                 // Runway (days)
        
        // Financial Health
        quickRatio: { type: Number },
        grossMargin: { type: Number },
        operatingExpenseRatio: { type: Number },
        debtToEquityRatio: { type: Number },
        
        // Customer Metrics
        churnRate: { type: Number },
        customerRetentionRate: { type: Number },
        LTV: { type: Number },                    // Lifetime Value
        CAC: { type: Number },                    // Customer Acquisition Cost
        LTVCACRatio: { type: Number },            // LTV/CAC Ratio
        
        // Revenue Analysis
        subscriptionRevenueMix: { type: Number },
        oneTimeRevenueMix: { type: Number },
        
        // Reserves
        reserveUtilization: { type: Number },
        
        // Net Worth
        netWorth: { type: Number }
    },
    
    createdAt: {
        type: Date,
        default: Date.now
    }
});

// Index for faster user-specific queries
MetricSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Metric', MetricSchema);