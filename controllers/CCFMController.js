const Metric = require('../models/Metric');
const User = require('../models/user');

exports.analyzeMetrics = async (req, res) => {
    try {
        // Check if req.user exists
        if (!req.user || !req.user.userID) {
            console.log('User not authenticated:', req.user);
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Find user by userID to get their ObjectId
        const user = await User.findOne({ userID: req.user.userID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const userId = user._id;
        const inputs = req.body;

        // Enhanced Input Validation
        const requiredFields = [
            'totalRevenue', 'accountsReceivable', 'totalCreditSales',
            'accountsPayable', 'cogs', 'cashInflows', 'cashOutflows',
            'totalUsersStart'
        ];

        const validationErrors = [];
        for (const field of requiredFields) {
            if (inputs[field] === undefined || inputs[field] === null || inputs[field] === '') {
                validationErrors.push(`Missing required field: ${field}`);
            } else if (isNaN(inputs[field]) || inputs[field] < 0) {
                validationErrors.push(`Invalid value for ${field}: must be a positive number`);
            }
        }

        if (validationErrors.length > 0) {
            return res.status(400).json({
                error: 'Validation failed',
                details: validationErrors
            });
        }

        // Enhanced Metric Calculations with Error Handling
        const metrics = {
            // Core Cash Flow Metrics
            ARPU: calculateARPU(inputs.totalRevenue, inputs.totalUsersStart),
            DSO: calculateDSO(inputs.accountsReceivable, inputs.totalCreditSales),
            DPO: calculateDPO(inputs.accountsPayable, inputs.cogs),
            DIO: calculateDIO(inputs.inventoryValue, inputs.cogs),
            CCC: calculateCCC(inputs.accountsReceivable, inputs.totalCreditSales,
                            inputs.inventoryValue, inputs.cogs, inputs.accountsPayable),
            NCF: calculateNCF(inputs.cashInflows, inputs.cashOutflows),
            burnRate: calculateBurnRate(inputs.cashOutflows),
            runway: calculateRunway(inputs.totalReserve, inputs.cashOutflows),

            // Financial Health Metrics
            quickRatio: calculateQuickRatio(inputs.cashInflows, inputs.accountsReceivable, inputs.accountsPayable),
            grossMargin: calculateGrossMargin(inputs.totalRevenue, inputs.cogs),
            operatingExpenseRatio: calculateOperatingExpenseRatio(inputs.operatingExpenses, inputs.totalRevenue),
            debtToEquityRatio: calculateDebtToEquityRatio(inputs.totalDebt, inputs.totalRevenue,
                                                        inputs.accountsReceivable, inputs.accountsPayable),

            // Customer Metrics
            churnRate: calculateChurnRate(inputs.churnedUsers, inputs.totalUsersStart),
            customerRetentionRate: calculateCustomerRetentionRate(inputs.totalUsersEnd,
                                                                inputs.newUsersAcquired, inputs.totalUsersStart),
            LTV: calculateLTV(inputs.totalRevenue, inputs.totalUsersStart),
            CAC: calculateCAC(inputs.totalAcquisitionCost, inputs.newUsersAcquired),
            LTVCACRatio: calculateLTVCACRatio(inputs.totalRevenue, inputs.totalUsersStart,
                                            inputs.totalAcquisitionCost, inputs.newUsersAcquired),

            // Revenue Analysis
            subscriptionRevenueMix: calculateSubscriptionRevenueMix(inputs.subscriptionRevenue, inputs.totalRevenue),
            oneTimeRevenueMix: calculateOneTimeRevenueMix(inputs.subscriptionRevenue, inputs.totalRevenue),

            // Reserves & Net Worth
            reserveUtilization: calculateReserveUtilization(inputs.usedReserve, inputs.totalReserve),
            netWorth: calculateNetWorth(inputs.cashInflows, inputs.accountsReceivable,
                                        inputs.inventoryValue, inputs.accountsPayable)
        };

        // Enhanced Alerts with Thresholds
        const alerts = {
            cashFlowWarning: metrics.NCF < 2000,
            cccWarning: metrics.CCC > 10,
            runwayWarning: metrics.runway < 30,
            ltvCacWarning: metrics.LTVCACRatio < 3,
            churnWarning: metrics.churnRate > 10,
            marginWarning: metrics.grossMargin < 30,
            debtWarning: metrics.debtToEquityRatio > 2,
            reserveWarning: metrics.reserveUtilization > 50
        };

        // Save to Database with Error Handling
        try {
            const metricDoc = new Metric({
                userId,
                inputs,
                metrics,
                alerts
            });

            await metricDoc.save();
        } catch (dbError) {
            console.error('Database Error:', dbError);
            return res.status(500).json({
                error: 'Failed to save metrics',
                details: dbError.message
            });
        }

        // Return Results with Enhanced Response
        res.status(200).json({
            metrics,
            alerts,
            recommendations: generateRecommendations(metrics, alerts)
        });

    } catch (err) {
        console.error('CCFM Analysis Error:', err);
        res.status(500).json({
            error: 'Server error during analysis',
            details: err.message
        });
    }
};

// Fetch historical metrics
exports.getHistory = async (req, res) => {
    try {
        // Check if req.user exists
        if (!req.user || !req.user.userID) {
            console.log('User not authenticated for history:', req.user);
            return res.status(401).json({ error: 'User not authenticated' });
        }

        // Find user by userID to get their ObjectId
        const user = await User.findOne({ userID: req.user.userID });
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        const metrics = await Metric.find({ userId: user._id })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean(); // Convert to plain JavaScript object for cleaner response

        // Format response for frontend compatibility
        const formattedMetrics = metrics.map(metric => ({
            createdAt: metric.createdAt,
            metrics: {
                NCF: metric.metrics.NCF || 0,
                CCC: metric.metrics.CCC || 0,
                LTVCACRatio: metric.metrics.LTVCACRatio || 0
            }
        }));

        res.status(200).json(formattedMetrics);
    } catch (err) {
        console.error('CCFM History Error:', err);
        res.status(500).json({
            error: 'Failed to fetch history',
            details: err.message
        });
    }
};

// Helper Functions for Metric Calculations
function calculateARPU(totalRevenue, totalUsers) {
    return totalUsers > 0 ? totalRevenue / totalUsers : 0;
}

function calculateDSO(accountsReceivable, totalCreditSales) {
    return totalCreditSales > 0 ? (accountsReceivable * 30) / totalCreditSales : 0;
}

function calculateDPO(accountsPayable, cogs) {
    return cogs > 0 ? (accountsPayable * 30) / cogs : 0;
}

function calculateDIO(inventoryValue, cogs) {
    return cogs > 0 ? (inventoryValue * 30) / cogs : 0;
}

function calculateCCC(accountsReceivable, totalCreditSales, inventoryValue, cogs, accountsPayable) {
    const dso = calculateDSO(accountsReceivable, totalCreditSales);
    const dio = calculateDIO(inventoryValue, cogs);
    const dpo = calculateDPO(accountsPayable, cogs);
    return dso + dio - dpo;
}

function calculateNCF(cashInflows, cashOutflows) {
    return cashInflows - cashOutflows;
}

function calculateBurnRate(cashOutflows) {
    return cashOutflows;
}

function calculateRunway(totalReserve, cashOutflows) {
    return cashOutflows > 0 ? totalReserve / cashOutflows : 0;
}

function calculateQuickRatio(cashInflows, accountsReceivable, accountsPayable) {
    return accountsPayable > 0 ? (cashInflows + accountsReceivable) / accountsPayable : 0;
}

function calculateGrossMargin(totalRevenue, cogs) {
    return totalRevenue > 0 ? ((totalRevenue - cogs) / totalRevenue) * 100 : 0;
}

function calculateOperatingExpenseRatio(operatingExpenses, totalRevenue) {
    return totalRevenue > 0 ? (operatingExpenses / totalRevenue) * 100 : 0;
}

function calculateDebtToEquityRatio(totalDebt, totalRevenue, accountsReceivable, accountsPayable) {
    const equity = totalRevenue + accountsReceivable - accountsPayable;
    return equity > 0 ? totalDebt / equity : 0;
}

function calculateChurnRate(churnedUsers, totalUsersStart) {
    return totalUsersStart > 0 ? (churnedUsers / totalUsersStart) * 100 : 0;
}

function calculateCustomerRetentionRate(totalUsersEnd, newUsersAcquired, totalUsersStart) {
    if (totalUsersStart === 0) return 0;
    const retainedUsers = totalUsersEnd - newUsersAcquired;
    return (retainedUsers / totalUsersStart) * 100;
}

function calculateLTV(totalRevenue, totalUsersStart) {
    return totalUsersStart > 0 ? (totalRevenue / totalUsersStart) * 3 : 0; // Assuming 3-year lifespan
}

function calculateCAC(totalAcquisitionCost, newUsersAcquired) {
    return newUsersAcquired > 0 ? totalAcquisitionCost / newUsersAcquired : 0;
}

function calculateLTVCACRatio(totalRevenue, totalUsersStart, totalAcquisitionCost, newUsersAcquired) {
    const ltv = calculateLTV(totalRevenue, totalUsersStart);
    const cac = calculateCAC(totalAcquisitionCost, newUsersAcquired);
    return cac > 0 ? ltv / cac : 0;
}

function calculateSubscriptionRevenueMix(subscriptionRevenue, totalRevenue) {
    return totalRevenue > 0 ? (subscriptionRevenue / totalRevenue) * 100 : 0;
}

function calculateOneTimeRevenueMix(subscriptionRevenue, totalRevenue) {
    return totalRevenue > 0 ? 100 - calculateSubscriptionRevenueMix(subscriptionRevenue, totalRevenue) : 100;
}

function calculateReserveUtilization(usedReserve, totalReserve) {
    return totalReserve > 0 ? (usedReserve / totalReserve) * 100 : 0;
}

function calculateNetWorth(cashInflows, accountsReceivable, inventoryValue, accountsPayable) {
    return (cashInflows + accountsReceivable + (inventoryValue || 0)) - accountsPayable;
}

function generateRecommendations(metrics, alerts) {
    const recommendations = [];

    if (alerts.cashFlowWarning) {
        recommendations.push({
            category: 'Cash Flow',
            message: 'Consider reducing expenses or increasing revenue to improve cash flow',
            priority: 'high'
        });
    }

    if (alerts.cccWarning) {
        recommendations.push({
            category: 'Cash Conversion Cycle',
            message: 'Optimize inventory management and payment terms to reduce CCC',
            priority: 'medium'
        });
    }

    if (alerts.runwayWarning) {
        recommendations.push({
            category: 'Runway',
            message: 'Consider raising additional capital to extend runway',
            priority: 'high'
        });
    }

    if (alerts.ltvCacWarning) {
        recommendations.push({
            category: 'Customer Acquisition',
            message: 'Review customer acquisition strategies to improve LTV/CAC ratio',
            priority: 'medium'
        });
    }

    if (alerts.churnWarning) {
        recommendations.push({
            category: 'Customer Retention',
            message: 'Implement customer retention strategies to reduce churn',
            priority: 'high'
        });
    }

    if (alerts.marginWarning) {
        recommendations.push({
            category: 'Profitability',
            message: 'Review pricing strategy and cost structure to improve margins',
            priority: 'medium'
        });
    }

    if (alerts.debtWarning) {
        recommendations.push({
            category: 'Financial Health',
            message: 'Consider debt restructuring or equity financing to improve debt-to-equity ratio',
            priority: 'high'
        });
    }

    if (alerts.reserveWarning) {
        recommendations.push({
            category: 'Reserves',
            message: 'Monitor reserve utilization and consider building additional reserves',
            priority: 'medium'
        });
    }

    return recommendations;
}