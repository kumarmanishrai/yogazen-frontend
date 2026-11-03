import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminNavbar from '../components/AdminNavbar';
import AdminFooter from '../components/AdminFooter';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';
import { apiAdminGetFinancials } from '../services/api';

const FINANCIAL_YEARS = [
  { id: '2026-2027', label: 'FY 2026-27 (Current)' },
  { id: '2025-2026', label: 'FY 2025-26' },
  { id: '2024-2025', label: 'FY 2024-25' },
  { id: '2023-2024', label: 'FY 2023-24' }
];

const AdminFinancials = () => {
  const navigate = useNavigate();
  const { isLoggedIn, isAdmin, hasPermission, isLoading: isAuthLoading } = useAuth();
  const { showNotification } = useNotification();

  // Filter Mode: 'fy' | 'custom'
  const [filterMode, setFilterMode] = useState('fy');
  const [selectedFY, setSelectedFY] = useState('2026-2027');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [orderType, setOrderType] = useState('all');

  const [financialData, setFinancialData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // Permission Guard
  useEffect(() => {
    if (!isAuthLoading) {
      if (!isLoggedIn || !isAdmin) {
        navigate('/admin/login', { replace: true });
      } else if (!hasPermission('financials')) {
        showNotification('Access denied. Financials permission required.', 'error');
        navigate('/admin', { replace: true });
      }
    }
  }, [isLoggedIn, isAdmin, hasPermission, isAuthLoading, navigate, showNotification]);

  const fetchTransactions = useCallback(async () => {
    try {
      setIsLoading(true);
      const params = { orderType };
      if (filterMode === 'fy') {
        params.financialYear = selectedFY;
      } else {
        if (startDate) params.startDate = startDate;
        if (endDate) params.endDate = endDate;
      }

      const res = await apiAdminGetFinancials(params);
      if (res?.success) {
        setFinancialData(res);
      }
    } catch (err) {
      showNotification(err.message || 'Failed to retrieve financial transactions', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [filterMode, selectedFY, startDate, endDate, orderType, showNotification]);

  useEffect(() => {
    if (hasPermission('financials')) {
      fetchTransactions();
    }
  }, [hasPermission, fetchTransactions]);

  // Generate Official PDF / Print E-Ledger
  const handleDownloadPDF = () => {
    if (!financialData || !financialData.transactions || financialData.transactions.length === 0) {
      showNotification('No transactions found in this period to export.', 'warning');
      return;
    }

    const { summary, transactions } = financialData;
    const periodLabel = filterMode === 'fy'
      ? `Financial Year ${selectedFY} (April 1 to March 31)`
      : `Custom Period: ${startDate || 'Earliest'} to ${endDate || 'Latest'}`;

    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      showNotification('Please allow popups to download statement PDF', 'error');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>YogaZen Official Financial Ledger - ${filterMode === 'fy' ? selectedFY : 'Statement'}</title>
          <style>
            @page { size: A4 portrait; margin: 15mm; }
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; color: #1c1917; font-size: 11px; margin: 0; padding: 10px; }
            .header-table { width: 100%; border-bottom: 2px solid #ea580c; padding-bottom: 12px; margin-bottom: 16px; }
            .brand-title { font-size: 22px; font-weight: 900; color: #ea580c; }
            .brand-sub { font-size: 10px; color: #78716c; text-transform: uppercase; font-weight: 700; letter-spacing: 1px; }
            .company-info { text-align: right; font-size: 10px; color: #44403c; line-height: 1.4; }
            .period-banner { background-color: #fff7ed; border: 1px solid #fed7aa; padding: 10px 14px; border-radius: 8px; margin-bottom: 16px; }
            .period-title { font-size: 13px; font-weight: 800; color: #9a3412; }
            .summary-grid { display: flex; gap: 12px; margin-bottom: 20px; }
            .summary-box { flex: 1; background: #fafaf9; border: 1px solid #e7e5e4; border-radius: 8px; padding: 10px; }
            .summary-label { font-size: 9px; text-transform: uppercase; color: #78716c; font-weight: 700; }
            .summary-value { font-size: 16px; font-weight: 900; color: #1c1917; margin-top: 4px; }
            .tx-table { width: 100%; border-collapse: collapse; font-size: 10px; }
            .tx-table th { background: #f5f5f4; color: #44403c; font-weight: 800; text-transform: uppercase; padding: 8px 6px; border: 1px solid #e7e5e4; text-align: left; }
            .tx-table td { padding: 6px; border: 1px solid #e7e5e4; vertical-align: top; }
            .tx-table tr:nth-child(even) { background-color: #fafaf9; }
            .status-badge { font-weight: 700; font-size: 9px; text-transform: uppercase; padding: 2px 4px; border-radius: 4px; }
            .status-Delivered { color: #166534; }
            .status-Processing { color: #854d0e; }
            .status-Cancelled { color: #991b1b; }
            .footer { margin-top: 24px; border-top: 1px solid #e7e5e4; padding-top: 10px; font-size: 9px; color: #78716c; text-align: center; }
            .total-row td { background: #fff7ed; font-weight: 900; font-size: 11px; }
          </style>
        </head>
        <body>
          <table class="header-table">
            <tr>
              <td>
                <div class="brand-title">🧘 YogaZen Mindful Living</div>
                <div class="brand-sub">Official Corporate Financial Statement & Tax Register</div>
              </td>
              <td class="company-info">
                <strong>YogaZen Retail & Online Learning Pvt Ltd</strong><br/>
                CIN: U74999UP2026PTC123456<br/>
                GSTIN: 09AAACY1234F1Z5 • PAN: AAACY1234F<br/>
                Sector 62, Prayagraj / Noida, UP 201309
              </td>
            </tr>
          </table>

          <div class="period-banner">
            <div class="period-title">${periodLabel}</div>
            <div style="font-size: 10px; color: #78716c; margin-top: 2px;">
              Generated on: ${new Date().toLocaleString('en-IN')} by Administrator • Official System Record
            </div>
          </div>

          <div class="summary-grid">
            <div class="summary-box">
              <div class="summary-label">Gross Platform Volume</div>
              <div class="summary-value">₹${(summary.grossRevenue || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">Estimated GST (18%)</div>
              <div class="summary-value" style="color: #ea580c;">₹${(summary.taxEstimate || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">Net Platform Earnings</div>
              <div class="summary-value" style="color: #16a34a;">₹${(summary.netRevenue || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">Refunds & Cancelled</div>
              <div class="summary-value" style="color: #dc2626;">₹${(summary.refundedAmount || 0).toLocaleString('en-IN')}</div>
            </div>
            <div class="summary-box">
              <div class="summary-label">Total Transactions</div>
              <div class="summary-value">${summary.totalTransactions || 0}</div>
            </div>
          </div>

          <table class="tx-table">
            <thead>
              <tr>
                <th style="width: 12%;">Invoice ID</th>
                <th style="width: 12%;">Date</th>
                <th style="width: 20%;">Customer</th>
                <th style="width: 15%;">Type</th>
                <th style="width: 25%;">Item Description</th>
                <th style="width: 8%;">Status</th>
                <th style="width: 8%; text-align: right;">Amount</th>
              </tr>
            </thead>
            <tbody>
              ${transactions.map((tx) => `
                <tr>
                  <td style="font-family: monospace; font-weight: bold;">${tx.invoiceId}</td>
                  <td>${new Date(tx.date).toLocaleDateString('en-IN')}</td>
                  <td>
                    <strong>${tx.customerName}</strong><br/>
                    <span style="color: #78716c; font-size: 9px;">${tx.customerEmail}</span>
                  </td>
                  <td>${tx.type}</td>
                  <td>${tx.itemTitle}</td>
                  <td><span class="status-badge status-${tx.status}">${tx.status}</span></td>
                  <td style="text-align: right; font-weight: bold;">₹${tx.totalAmount}</td>
                </tr>
              `).join('')}
              <tr class="total-row">
                <td colspan="6" style="text-align: right; padding-right: 12px;">Total Volume Tally:</td>
                <td style="text-align: right; color: #ea580c;">₹${(summary.grossRevenue || 0).toLocaleString('en-IN')}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            This is an authentic computer-generated accounting ledger authenticated by the Chief Superadmin. Valid for tax audit and corporate filing under Indian IT Act 2000.
          </div>

          <script>
            window.onload = function() {
              window.print();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const summary = financialData?.summary || {
    grossRevenue: 0,
    netRevenue: 0,
    courseRevenue: 0,
    productRevenue: 0,
    refundedAmount: 0,
    taxEstimate: 0,
    totalTransactions: 0
  };

  const transactions = financialData?.transactions || [];

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-stone-950 flex flex-col items-center justify-center font-nunito text-white">
        <div className="w-12 h-12 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mb-4"></div>
        <p className="text-xs font-semibold text-stone-400">Verifying administrator credentials...</p>
      </div>
    );
  }

  if (!isLoggedIn || !isAdmin || !hasPermission('financials')) {
    return null;
  }

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-stone-100 font-nunito flex flex-col justify-between transition-colors duration-200">
      <div>
        <AdminNavbar activePage="financials" />

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
          {/* Header Banner */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-stone-900 border border-stone-800 p-6 sm:p-8 rounded-3xl shadow-xl">
            <div className="space-y-1 max-w-2xl">
              <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-300 border border-emerald-800">
                Financial Audit & GST Ledger
              </span>
              <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
                Financial Transactions & E-Ledger
              </h1>
              <p className="text-xs text-stone-400">
                Track corporate revenue, GST tax withholdings, filter across Indian Financial Years (April 1 - March 31), and export official PDF ledgers.
              </p>
            </div>

            <button
              type="button"
              onClick={handleDownloadPDF}
              className="px-5 py-3 rounded-2xl bg-gradient-to-r from-saffron-600 to-amber-500 hover:from-saffron-500 hover:to-amber-400 text-white text-xs font-black transition shadow-lg shadow-saffron-500/20 flex items-center gap-2 self-start md:self-auto"
            >
              <span>📥</span>
              <span>Download Official Statement PDF</span>
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {[
              { label: 'Portal Earning (Gross)', val: `₹${(summary.grossRevenue || 0).toLocaleString('en-IN')}`, color: 'text-emerald-400' },
              { label: 'Product Revenue (100%)', val: `₹${(summary.productRevenue || 0).toLocaleString('en-IN')}`, color: 'text-blue-300' },
              { label: 'Course Commission (20%)', val: `₹${(summary.courseRevenue || 0).toLocaleString('en-IN')}`, color: 'text-saffron-400' },
              { label: 'Trainer Payouts (80%)', val: `₹${(summary.trainerPayouts || 0).toLocaleString('en-IN')}`, color: 'text-purple-300' },
              { label: 'Course Sales Volume', val: `₹${(summary.totalCourseSales || 0).toLocaleString('en-IN')}`, color: 'text-white' },
              { label: 'Net After GST (18%)', val: `₹${(summary.netRevenue || 0).toLocaleString('en-IN')}`, color: 'text-cyan-400' }
            ].map((kpi, idx) => (
              <div key={idx} className="bg-stone-900 border border-stone-800 p-4 rounded-2xl space-y-1">
                <span className="text-[10px] uppercase font-bold text-stone-400 block truncate">{kpi.label}</span>
                <span className={`text-base sm:text-lg font-black block ${kpi.color}`}>{kpi.val}</span>
              </div>
            ))}
          </div>

          {/* Period Filter Selection Controls */}
          <div className="bg-stone-900 border border-stone-800 p-5 rounded-3xl space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-stone-800">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setFilterMode('fy')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    filterMode === 'fy' ? 'bg-saffron-500 text-white' : 'bg-stone-950 text-stone-400 hover:text-white'
                  }`}
                >
                  📅 Indian Financial Year (FY)
                </button>
                <button
                  type="button"
                  onClick={() => setFilterMode('custom')}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition ${
                    filterMode === 'custom' ? 'bg-saffron-500 text-white' : 'bg-stone-950 text-stone-400 hover:text-white'
                  }`}
                >
                  ⏳ Custom Date Period
                </button>
              </div>

              {/* Order Type Selector */}
              <div className="flex items-center gap-2 text-xs">
                <span className="text-stone-400 font-bold">Category:</span>
                <select
                  value={orderType}
                  onChange={(e) => setOrderType(e.target.value)}
                  className="px-3 py-1.5 bg-stone-950 border border-stone-800 rounded-xl text-xs text-stone-300 font-bold focus:outline-none focus:border-saffron-500"
                >
                  <option value="all">All Transactions</option>
                  <option value="course">Yoga Courses Only</option>
                  <option value="product">Equipment Orders Only</option>
                </select>
              </div>
            </div>

            {/* Financial Year Selector Pills */}
            {filterMode === 'fy' ? (
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-stone-400 font-bold mr-2">Select Year:</span>
                {FINANCIAL_YEARS.map((fy) => (
                  <button
                    key={fy.id}
                    type="button"
                    onClick={() => setSelectedFY(fy.id)}
                    className={`px-4 py-2 rounded-xl font-bold transition cursor-pointer ${
                      selectedFY === fy.id
                        ? 'bg-saffron-500 text-white shadow-md'
                        : 'bg-stone-100 dark:bg-stone-950 text-stone-700 dark:text-stone-300 hover:text-stone-900 dark:hover:text-white border border-stone-200 dark:border-stone-800'
                    }`}
                  >
                    {fy.label}
                  </button>
                ))}
              </div>
            ) : (
              /* Custom Date Range Pickers */
              <div className="flex flex-wrap items-center gap-4 text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-bold">From:</span>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-saffron-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-stone-400 font-bold">To:</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="px-3 py-2 bg-stone-950 border border-stone-800 rounded-xl text-xs text-white focus:outline-none focus:border-saffron-500"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setStartDate('');
                    setEndDate('');
                  }}
                  className="px-3 py-2 rounded-xl bg-stone-800 text-stone-400 hover:text-white font-bold"
                >
                  Reset Period
                </button>
              </div>
            )}
          </div>

          {/* Transactions Register Table */}
          <div className="bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden shadow-xl">
            <div className="p-6 border-b border-stone-800 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-white">Itemized Financial Register</h3>
                <p className="text-xs text-stone-400">Total transaction records in this period: {transactions.length}</p>
              </div>
            </div>

            {isLoading ? (
              <div className="p-12 text-center text-xs text-stone-400">
                <div className="w-8 h-8 border-4 border-saffron-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
                Compiling financial transactions...
              </div>
            ) : transactions.length === 0 ? (
              <div className="p-12 text-center text-stone-400 text-xs">
                No transactions recorded for the selected period.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-stone-950/70 border-b border-stone-800 text-stone-400 uppercase tracking-wider font-bold text-[10px]">
                    <tr>
                      <th className="py-3.5 px-6">Invoice ID</th>
                      <th className="py-3.5 px-6">Date</th>
                      <th className="py-3.5 px-6">Customer</th>
                      <th className="py-3.5 px-6">Type & Item</th>
                      <th className="py-3.5 px-6">Status</th>
                      <th className="py-3.5 px-6 text-right">Gross Price</th>
                      <th className="py-3.5 px-6 text-right text-saffron-300">Portal Share</th>
                      <th className="py-3.5 px-6 text-right text-purple-300">Trainer (80%)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-800">
                    {transactions.map((tx, idx) => (
                      <tr key={idx} className="hover:bg-stone-800/40 transition">
                        <td className="py-4 px-6 font-mono font-bold text-saffron-300">
                          {tx.invoiceId}
                        </td>
                        <td className="py-4 px-6 text-stone-400 text-[11px]">
                          {new Date(tx.date).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>
                        <td className="py-4 px-6">
                          <span className="font-bold text-white block">{tx.customerName}</span>
                          <span className="text-stone-400 font-mono text-[10px]">{tx.customerEmail}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span className="text-[10px] font-bold text-stone-400 block uppercase">{tx.type}</span>
                          <span className="text-stone-200 font-medium truncate max-w-[180px] block">{tx.itemTitle}</span>
                        </td>
                        <td className="py-4 px-6">
                          <span
                            className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full ${
                              tx.status === 'Delivered' || tx.status === 'Active'
                                ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                                : tx.status === 'Cancelled'
                                ? 'bg-red-950 text-red-300 border border-red-800'
                                : 'bg-amber-950 text-amber-300 border border-amber-800'
                            }`}
                          >
                            {tx.status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-right font-black text-white text-sm">
                          ₹{tx.totalAmount}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-emerald-400 text-xs">
                          ₹{tx.platformShare ?? (tx.type === 'Yoga Course' ? Math.round(tx.totalAmount * 0.20) : tx.totalAmount)}
                        </td>
                        <td className="py-4 px-6 text-right font-bold text-purple-300 text-xs">
                          {tx.type === 'Yoga Course' ? `₹${tx.trainerShare ?? Math.round(tx.totalAmount * 0.80)}` : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </main>
      </div>

      <AdminFooter />
    </div>
  );
};

export default AdminFinancials;
