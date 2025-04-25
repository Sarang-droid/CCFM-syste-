document.addEventListener('DOMContentLoaded', () => {
  const analyzeBtn = document.getElementById('analyzeBtn');
  const resultsSection = document.getElementById('resultsSection');
  const metricCardsContainer = document.getElementById('metricCards');
  const loadingSpinner = document.getElementById('loadingSpinner');
  const errorMessage = document.getElementById('errorMessage');

  // Auth token (from login)
  const token = localStorage.getItem('token');
  console.log('Token from localStorage:', token);
  if (!token) {
      console.log('No token found, redirecting to login');
      window.location.href = 'login.html';
      return;
  }

  // Initialize charts
  let cashFlowChart = null;
  let cccChart = null;
  let ltvCacChart = null;
  let burnRateRunwayChart = null;
  let financialHealthChart = null;
  let historicalTrendChart = null;

  initializeCharts();
  fetchHistoricalData(); // Fetch historical data on page load

  // Add input validation
  const inputFields = document.querySelectorAll('input[type="number"]');
  inputFields.forEach(field => {
      field.addEventListener('input', validateInput);
  });

  function validateInput(e) {
      const value = parseFloat(e.target.value);
      if (isNaN(value) || value < 0) {
          e.target.classList.add('invalid');
          e.target.setCustomValidity('Please enter a valid positive number');
      } else {
          e.target.classList.remove('invalid');
          e.target.setCustomValidity('');
      }
  }

  analyzeBtn.addEventListener('click', async () => {
      try {
          // Show loading state
          loadingSpinner.style.display = 'block';
          errorMessage.style.display = 'none';
          analyzeBtn.disabled = true;

          // Collect and validate all |inputs
          const inputs = collectAndValidateInputs();
          if (!inputs) return;

          // Send to backend
          const response = await fetch('/api/ccfm/analyze', {
              method: 'POST',
              headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}`
              },
              body: JSON.stringify(inputs)
          });

          if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || errorData.message || 'Analysis failed');
          }

          const { metrics, alerts, recommendations } = await response.json();

          // Display results
          renderMetrics(metrics, alerts);
          updateCharts(metrics);
          renderRecommendations(recommendations);
          resultsSection.style.display = 'block';

          // Refresh historical data after new analysis
          fetchHistoricalData();

      } catch (err) {
          console.error('Analysis Error:', err);
          errorMessage.textContent = `Error: ${err.message}`;
          errorMessage.style.display = 'block';
      } finally {
          // Hide loading state
          loadingSpinner.style.display = 'none';
          analyzeBtn.disabled = false;
      }
  });

  function collectAndValidateInputs() {
      const inputs = {
          totalRevenue: parseFloat(document.getElementById('totalRevenue').value),
          subscriptionRevenue: parseFloat(document.getElementById('subscriptionRevenue').value) || 0,
          accountsReceivable: parseFloat(document.getElementById('accountsReceivable').value),
          totalCreditSales: parseFloat(document.getElementById('totalCreditSales').value),
          accountsPayable: parseFloat(document.getElementById('accountsPayable').value),
          inventoryValue: parseFloat(document.getElementById('inventoryValue').value) || 0,
          cogs: parseFloat(document.getElementById('cogs').value),
          cashInflows: parseFloat(document.getElementById('cashInflows').value),
          cashOutflows: parseFloat(document.getElementById('cashOutflows').value),
          operatingExpenses: parseFloat(document.getElementById('operatingExpenses').value) || 0,
          totalReserve: parseFloat(document.getElementById('totalReserve').value) || 0,
          usedReserve: parseFloat(document.getElementById('usedReserve').value) || 0,
          totalDebt: parseFloat(document.getElementById('totalDebt').value) || 0,
          totalUsersStart: parseFloat(document.getElementById('totalUsersStart').value),
          totalUsersEnd: parseFloat(document.getElementById('totalUsersEnd').value) || 0,
          churnedUsers: parseFloat(document.getElementById('churnedUsers').value) || 0,
          newUsersAcquired: parseFloat(document.getElementById('newUsersAcquired').value) || 0,
          totalAcquisitionCost: parseFloat(document.getElementById('totalAcquisitionCost').value) || 0
      };

      // Validate required fields
      const requiredFields = [
          'totalRevenue', 'accountsReceivable', 'totalCreditSales',
          'accountsPayable', 'cogs', 'cashInflows', 'cashOutflows',
          'totalUsersStart'
      ];

      for (const field of requiredFields) {
          if (isNaN(inputs[field]) || inputs[field] <= 0) {
              const inputElement = document.getElementById(field);
              inputElement.classList.add('invalid');
              inputElement.setCustomValidity('This field is required and must be positive');
              return null;
          }
      }

      return inputs;
  }

  function initializeCharts() {
      // Cash Flow Chart
      cashFlowChart = new ApexCharts(
          document.querySelector("#cashFlowChart"),
          {
              series: [{
                  name: 'Inflows',
                  data: [{ x: 'Daily Cash Flow', y: 0 }]
              }, {
                  name: 'Outflows',
                  data: [{ x: 'Daily Cash Flow', y: 0 }]
              }],
              chart: {
                  type: 'bar',
                  height: 350,
                  animations: { enabled: true },
                  toolbar: {
                      show: true,
                      tools: {
                          download: true,
                          selection: true,
                          zoom: true,
                          zoomin: true,
                          zoomout: true,
                          pan: true,
                          reset: true
                      }
                  }
              },
              colors: ['#1abc9c', '#e74c3c'],
              xaxis: { type: 'category' },
              yaxis: {
                  title: { text: 'Amount ($)' }
              },
             遵: ['#1abc9c', '#e74c3c'],
              title: {
                  text: 'Cash Flow Analysis',
                  align: 'center',
                  style: {
                      fontSize: '16px',
                      fontWeight: 'bold'
                  }
              },
              tooltip: {
                  y: {
                      formatter: function(value) {
                          return '$' + value.toLocaleString();
                      }
                  }
              }
          }
      );
      cashFlowChart.render();

      // CCC Components Chart
      cccChart = new ApexCharts(
          document.querySelector("#cccChart"),
          {
              series: [0, 0, 0],
              chart: {
                  type: 'radialBar',
                  height: 350,
                  animations: { enabled: true }
              },
              labels: ['DSO', 'DIO', 'DPO'],
              colors: ['#3498db', '#2ecc71', '#f39c12'],
              title: {
                  text: 'Cash Conversion Cycle Breakdown',
                  align: 'center',
                  style: {
                      fontSize: '16px',
                      fontWeight: 'bold'
                  }
              },
              plotOptions: {
                  radialBar: {
                      dataLabels: {
                          name: { fontSize: '14px' },
                          value: {
                              fontSize: '16px',
                              formatter: function(val) {
                                  return val.toFixed(1) + ' days';
                              }
                          }
                      }
                  }
              }
          }
      );
      cccChart.render();

      // LTV/CAC Ratio Chart
      ltvCacChart = new ApexCharts(
          document.querySelector("#ltvCacChart"),
          {
              series: [{
                  name: 'Ratio',
                  data: [{ x: 'LTV/CAC', y: 0 }]
              }],
              chart: {
                  type: 'bar',
                  height: 300,
                  animations: { enabled: true }
              },
              colors: ['#2ecc71'],
              xaxis: { type: 'category' },
              yaxis: {
                  title: { text: 'Ratio' }
              },
              title: {
                  text: 'Customer Efficiency',
                  align: 'center',
                  style: {
                      fontSize: '16px',
                      fontWeight: 'bold'
                  }
              },
              annotations: {
                  yaxis: [{
                      y: 3,
                      borderColor: '#f39c12',
                      label: {
                          text: 'Healthy Threshold',
                          style: {
                              color: '#fff',
                              background: '#f39c12'
                          }
                      }
                  }]
              }
          }
      );
      ltvCacChart.render();

      // Burn Rate and Runway Chart
      burnRateRunwayChart = new ApexCharts(
          document.querySelector("#burnRateRunwayChart"),
          {
              series: [{
                  name: 'Burn Rate ($/day)',
                  data: [{ x: 'Metrics', y: 0 }]
              }, {
                  name: 'Runway (days)',
                  data: [{ x: 'Metrics', y: 0 }]
              }],
              chart: {
                  type: 'bar',
                  height: 350,
                  animations: { enabled: true },
                  toolbar: { show: true }
              },
              colors: ['#e74c3c', '#3498db'],
              xaxis: { type: 'category' },
              yaxis: [
                  {
                      seriesName: 'Burn Rate ($/day)',
                      title: { text: 'Burn Rate ($)' },
                      axisTicks: { show: true },
                      axisBorder: { show: true }
                  },
                  {
                      seriesName: 'Runway (days)',
                      opposite: true,
                      title: { text: 'Runway (days)' },
                      axisTicks: { show: true },
                      axisBorder: { show: true }
                  }
              ],
              title: {
                  text: 'Burn Rate and Runway Analysis',
                  align: 'center',
                  style: {
                      fontSize: '16px',
                      fontWeight: 'bold'
                  }
              },
              tooltip: {
                  y: [
                      {
                          formatter: function(value) {
                              return '$' + value.toLocaleString();
                          }
                      },
                      {
                          formatter: function(value) {
                              return value.toFixed(1) + ' days';
                          }
                      }
                  ]
              }
          }
      );
      burnRateRunwayChart.render();

      // Financial Health Chart
      financialHealthChart = new ApexCharts(
          document.querySelector("#financialHealthChart"),
          {
              series: [0, 0, 0, 0],
              chart: {
                  type: 'radialBar',
                  height: 350,
                  animations: { enabled: true }
              },
              labels: ['Quick Ratio', 'Gross Margin (%)', 'OpEx Ratio (%)', 'D/E Ratio'],
              colors: ['#1abc9c', '#2ecc71', '#f39c12', '#e74c3c'],
              title: {
                  text: 'Financial Health Metrics',
                  align: 'center',
                  style: {
                      fontSize: '16px',
                      fontWeight: 'bold'
                  }
              },
              plotOptions: {
                  radialBar: {
                      dataLabels: {
                          name: { fontSize: '14px' },
                          value: {
                              fontSize: '16px',
                              formatter: function(val, opts) {
                                  const label = opts.w.globals.labels[opts.seriesIndex];
                                  if (label.includes('Ratio')) return val.toFixed(2);
                                  return val.toFixed(1) + '%';
                              }
                          }
                      }
                  }
              }
          }
      );
      financialHealthChart.render();

      // Historical Trend Chart
      historicalTrendChart = new ApexCharts(
          document.querySelector("#historicalTrendChart"),
          {
              series: [
                  { name: 'Net Cash Flow ($)', data: [] },
                  { name: 'CCC (days)', data: [] },
                  { name: 'LTV/CAC Ratio', data: [] }
              ],
              chart: {
                  type: 'line',
                  height: 350,
                  zoom: { enabled: true },
                  toolbar: { show: true }
              },
              colors: ['#1abc9c', '#3498db', '#2ecc71'],
              xaxis: {
                  type: 'datetime',
                  title: { text: 'Date' }
              },
              yaxis: [
                  {
                      seriesName: 'Net Cash Flow ($)',
                      title: { text: 'NCF ($)' },
                      axisTicks: { show: true },
                      axisBorder: { show: true }
                  },
                  {
                      seriesName: 'CCC (days)',
                      opposite: true,
                      title: { text: 'CCC (days)' },
                      axisTicks: { show: true },
                      axisBorder: { show: true }
                  },
                  {
                      seriesName: 'LTV/CAC Ratio',
                      show: false // Share CCC axis for simplicity
                  }
              ],
              title: {
                  text: 'Historical Trends',
                  align: 'center',
                  style: {
                      fontSize: '16px',
                      fontWeight: 'bold'
                  }
              },
              tooltip: {
                  x: { format: 'dd MMM yyyy' }
              }
          }
      );
      historicalTrendChart.render();
  }

  async function fetchHistoricalData() {
      try {
          const response = await fetch('/api/ccfm/history', {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (!response.ok) throw new Error('Failed to fetch historical data');
          const history = await response.json();
          const ncfData = history.map(metric => ({
              x: new Date(metric.createdAt),
              y: metric.metrics.NCF || 0
          }));
          const cccData = history.map(metric => ({
              x: new Date(metric.createdAt),
              y: metric.metrics.CCC || 0
          }));
          const ltvCacData = history.map(metric => ({
              x: new Date(metric.createdAt),
              y: metric.metrics.LTVCACRatio || 0
          }));
          historicalTrendChart.updateSeries([
              { name: 'Net Cash Flow ($)', data: ncfData },
              { name: 'CCC (days)', data: cccData },
              { name: 'LTV/CAC Ratio', data: ltvCacData }
          ]);
      } catch (err) {
          console.error('Historical Data Error:', err);
      }
  }

  function updateCharts(metrics) {
      // Update Cash Flow Chart
      cashFlowChart.updateOptions({
          series: [{
              name: 'Inflows',
              data: [{ x: 'Daily Cash Flow', y: metrics.cashInflows || 0 }]
          }, {
              name: 'Outflows',
              data: [{ x: 'Daily Cash Flow', y: metrics.cashOutflows || 0 }]
          }]
      });

      // Update CCC Chart
      cccChart.updateOptions({
          series: [
              metrics.DSO || 0,
              metrics.DIO || 0,
              metrics.DPO || 0
          ]
      });

      // Update LTV/CAC Chart
      ltvCacChart.updateOptions({
          series: [{
              name: 'Ratio',
              data: [{ x: 'LTV/CAC', y: metrics.LTVCACRatio || 0 }]
          }],
          colors: [(metrics.LTVCACRatio || 0) < 3 ? '#e74c3c' : '#2ecc71']
      });

      // Update Burn Rate and Runway Chart
      burnRateRunwayChart.updateOptions({
          series: [{
              name: 'Burn Rate ($/day)',
              data: [{ x: 'Metrics', y: metrics.burnRate || 0 }]
          }, {
              name: 'Runway (days)',
              data: [{ x: 'Metrics', y: metrics.runway || 0 }]
          }]
      });

      // Update Financial Health Chart
      financialHealthChart.updateOptions({
          series: [
              metrics.quickRatio || 0,
              metrics.grossMargin || 0,
              metrics.operatingExpenseRatio || 0,
              metrics.debtToEquityRatio || 0
          ]
      });
  }

  function renderMetrics(metrics, alerts) {
      metricCardsContainer.innerHTML = '';

      const metricData = [
          // Core Cash Flow Metrics
          { name: 'Average Revenue Per User (ARPU)', value: `$${metrics.ARPU.toFixed(2)}`, alert: alerts.ltvCacWarning },
          { name: 'Days Sales Outstanding (DSO)', value: `${metrics.DSO.toFixed(1)} days`, alert: metrics.DSO > 15 },
          { name: 'Days Payable Outstanding (DPO)', value: `${metrics.DPO.toFixed(1)} days`, alert: metrics.DPO < 5 },
          { name: 'Days Inventory Outstanding (DIO)', value: `${metrics.DIO.toFixed(1)} days`, alert: metrics.DIO > 10 },
          { name: 'Cash Conversion Cycle (CCC)', value: `${metrics.CCC.toFixed(1)} days`, alert: alerts.cccWarning },
          { name: 'Net Cash Flow (NCF)', value: `$${metrics.NCF.toFixed(2)}`, alert: alerts.cashFlowWarning },
          { name: 'Burn Rate', value: `$${metrics.burnRate.toFixed(2)}/day`, alert: metrics.burnRate > 5000 },
          { name: 'Runway', value: `${metrics.runway.toFixed(1)} days`, alert: alerts.runwayWarning },

          // Financial Health Metrics
          { name: 'Quick Ratio', value: metrics.quickRatio.toFixed(2), alert: metrics.quickRatio < 1 },
          { name: 'Gross Margin', value: `${metrics.grossMargin.toFixed(2)}%`, alert: alerts.marginWarning },
          { name: 'Operating Expense Ratio', value: `${metrics.operatingExpenseRatio.toFixed(2)}%`, alert: metrics.operatingExpenseRatio > 70 },
          { name: 'Debt-to-Equity Ratio', value: metrics.debtToEquityRatio.toFixed(2), alert: alerts.debtWarning },

          // Customer Metrics
          { name: 'Churn Rate', value: `${metrics.churnRate.toFixed(2)}%`, alert: alerts.churnWarning },
          { name: 'Customer Retention Rate', value: `${metrics.customerRetentionRate.toFixed(2)}%`, alert: metrics.customerRetentionRate < 80 },
          { name: 'Lifetime Value (LTV)', value: `$${metrics.LTV.toFixed(2)}`, alert: metrics.LTV < 100 },
          { name: 'Customer Acquisition Cost (CAC)', value: `$${metrics.CAC.toFixed(2)}`, alert: metrics.CAC > 150 },
          { name: 'LTV/CAC Ratio', value: metrics.LTVCACRatio.toFixed(2), alert: alerts.ltvCacWarning },

          // Revenue Analysis
          { name: 'Subscription Revenue Mix', value: `${metrics.subscriptionRevenueMix.toFixed(2)}%`, alert: metrics.subscriptionRevenueMix < 60 },
          { name: 'One-Time Revenue Mix', value: `${metrics.oneTimeRevenueMix.toFixed(2)}%`, alert: metrics.oneTimeRevenueMix > 40 },

          // Reserves & Net Worth
          { name: 'Reserve Utilization', value: `${metrics.reserveUtilization.toFixed(2)}%`, alert: alerts.reserveWarning },
          { name: 'Net Worth', value: `$${metrics.netWorth.toFixed(2)}`, alert: metrics.netWorth < 0 }
      ];

      metricData.forEach(metric => {
          const card = document.createElement('div');
          card.className = `metric-card ${metric.alert ? 'alert-red' : ''}`;
          card.innerHTML = `
              <h3>${metric.name}</h3>
              <div class="value">${metric.value}</div>
              ${metric.alert ? '<p class="alert-message">⚠️ Requires attention</p>' : ''}
          `;
          metricCardsContainer.appendChild(card);
      });
  }

  function renderRecommendations(recommendations) {
      const recommendationsContainer = document.getElementById('recommendationsContainer');
      if (!recommendationsContainer) return;

      recommendationsContainer.innerHTML = '';

      if (recommendations.length === 0) {
          recommendationsContainer.innerHTML = '<p class="no-recommendations">No recommendations at this time.</p>';
          return;
      }

      recommendations.forEach(rec => {
          const recommendation = document.createElement('div');
          recommendation.className = `recommendation ${rec.priority}`;
          recommendation.innerHTML = `
              <h3>${rec.category}</h3>
              <p>${rec.message}</p>
              <span class="priority">${rec.priority} priority</span>
          `;
          recommendationsContainer.appendChild(recommendation);
      });
  }
});