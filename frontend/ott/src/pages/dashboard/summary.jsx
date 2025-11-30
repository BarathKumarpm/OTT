// pages/dashboard/summary.jsx
import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  Users, 
  AlertTriangle, 
  ChevronLeft, 
  ChevronRight,
  Loader,
  CheckCircle,
  AlertCircle,
  Calendar,
  Download,
  RefreshCw
} from 'lucide-react';
import API from '../../lib/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const PAID_OT_LIMIT_HOURS = 72;

export default function Summary() {
  const [workers, setWorkers] = useState([]);
  const [summaries, setSummaries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  useEffect(() => {
    fetchData();
  }, [selectedMonth, selectedYear]);

  const fetchData = async () => {
    setLoading(true);
    setError('');
    
    try {
      const [workersRes, summariesRes] = await Promise.all([
        API.get('/workers'),
        API.get('/overtime/all', {
          params: { month: selectedMonth, year: selectedYear }
        })
      ]);

      setWorkers(workersRes.data.workers || []);
      setSummaries(summariesRes.data.summaries || []);
    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Failed to fetch summary data');
    } finally {
      setLoading(false);
    }
  };

  const workersWithSummary = useMemo(() => {
    return workers
      .map(worker => {
        const summary = summaries.find(
          s => s.workerId?._id === worker._id || s.workerId === worker._id
        );
        
        const totalOTMinutes = summary?.totalOvertimeMinutes || 0;
        const totalPaidMinutes = summary?.totalPaidMinutes || 0;
        const totalUnpaidMinutes = summary?.totalUnpaidMinutes || 0;
        
        const totalOTHours = totalOTMinutes / 60;
        const totalPaidHours = totalPaidMinutes / 60;
        const totalUnpaidHours = totalUnpaidMinutes / 60;
        const remainingPaidHours = Math.max(PAID_OT_LIMIT_HOURS - totalPaidHours, 0);
        
        let status = 'ok';
        if (totalPaidHours >= PAID_OT_LIMIT_HOURS) {
          status = 'limit';
        } else if (totalPaidHours >= PAID_OT_LIMIT_HOURS * 0.9) {
          status = 'warning';
        }

        return {
          ...worker,
          totalOTMinutes,
          totalPaidMinutes,
          totalUnpaidMinutes,
          totalOTHours,
          totalPaidHours,
          totalUnpaidHours,
          remainingPaidHours,
          status,
          progressPercent: Math.min((totalPaidHours / PAID_OT_LIMIT_HOURS) * 100, 100)
        };
      })
      .sort((a, b) => b.totalOTHours - a.totalOTHours);
  }, [workers, summaries]);

  const totals = useMemo(() => {
    const totalWorkers = workers.length;
    const totalOTHours = workersWithSummary.reduce((sum, w) => sum + w.totalOTHours, 0);
    const workersAtLimit = workersWithSummary.filter(w => w.status === 'limit').length;
    const workersNearLimit = workersWithSummary.filter(w => w.status === 'warning').length;
    
    return {
      totalWorkers,
      totalOTHours,
      workersAtLimit,
      workersNearLimit
    };
  }, [workers, workersWithSummary]);

  const goToPreviousMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const goToNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  const goToCurrentMonth = () => {
    setSelectedMonth(currentDate.getMonth() + 1);
    setSelectedYear(currentDate.getFullYear());
  };

  const isCurrentMonth =
    selectedMonth === currentDate.getMonth() + 1 &&
    selectedYear === currentDate.getFullYear();

  const exportToCSV = () => {
    const headers = [
      'Rank',
      'Name',
      'Employee ID',
      'Department',
      'Total OT (hrs)',
      'Paid OT (hrs)',
      'Unpaid OT (hrs)',
      'Remaining (hrs)',
      'Status'
    ];

    const rows = workersWithSummary.map((worker, index) => [
      index + 1,
      worker.name,
      worker.employeeId || 'N/A',
      worker.department || 'N/A',
      worker.totalOTHours.toFixed(1),
      worker.totalPaidHours.toFixed(1),
      worker.totalUnpaidHours.toFixed(1),
      worker.remainingPaidHours.toFixed(1),
      worker.status === 'limit'
        ? 'At Limit'
        : worker.status === 'warning'
        ? 'Near Limit'
        : 'OK'
    ]);

    const csvContent = [
      `Overtime Summary - ${MONTHS[selectedMonth - 1]} ${selectedYear}`,
      '',
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `overtime_summary_${selectedYear}_${selectedMonth}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const StatusBadge = ({ status }) => {
    if (status === 'limit') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertTriangle className="w-3 h-3" />
          Limit
        </span>
      );
    }
    if (status === 'warning') {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
          <AlertCircle className="w-3 h-3" />
          Near
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
        <CheckCircle className="w-3 h-3" />
        OK
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:mt-0 mt-10">
      <div className="max-w-6xl mx-auto space-y-6 lg:space-y-8">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div className="min-w-0">
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">
                  Worker OT Manager
                </h1>
                <p className="text-xs md:text-sm text-gray-500">
                  Track and manage overtime hours (72hr limit)
                </p>
              </div>
            </div>

            {/* Month/Year Selector */}
            <div className="flex flex-wrap items-center justify-end gap-2">
              <button
                onClick={goToPreviousMonth}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                title="Previous month"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              
              <div className="flex items-center gap-2 px-3 md:px-4 py-2 bg-gray-100 rounded-lg min-w-40 md:min-w-[200px] justify-center">
                <Calendar className="w-4 h-4 text-gray-500" />
                <span className="font-medium text-gray-800 text-sm md:text-base">
                  {MONTHS[selectedMonth - 1]} {selectedYear}
                </span>
              </div>

              <button
                onClick={goToNextMonth}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition"
                title="Next month"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>

              {!isCurrentMonth && (
                <button
                  onClick={goToCurrentMonth}
                  className="px-3 py-2 text-xs md:text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                >
                  Today
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 wrap-break-words">{error}</p>
            </div>
            <button 
              onClick={fetchData}
              className="text-red-600 hover:text-red-800 text-xs md:text-sm font-medium shrink-0"
            >
              Retry
            </button>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Total Workers */}
          <div className="bg-linear-to-br from-blue-500 to-blue-600 rounded-xl p-4 md:p-5 text-white shadow-md md:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-blue-100 text-xs md:text-sm font-medium">Total Workers</p>
                <p className="text-3xl md:text-4xl font-bold mt-1">
                  {loading ? '—' : totals.totalWorkers}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Users className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>

          {/* Total OT Hours */}
          <div className="bg-linear-to-br from-emerald-500 to-emerald-600 rounded-xl p-4 md:p-5 text-white shadow-md md:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-emerald-100 text-xs md:text-sm font-medium">Total OT Hours</p>
                <p className="text-3xl md:text-4xl font-bold mt-1">
                  {loading ? '—' : totals.totalOTHours.toFixed(1)}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <Clock className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>

          {/* At Limit */}
          <div className="bg-linear-to-br from-rose-500 to-rose-600 rounded-xl p-4 md:p-5 text-white shadow-md md:shadow-lg">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-rose-100 text-xs md:text-sm font-medium">At Limit (72hrs)</p>
                <p className="text-3xl md:text-4xl font-bold mt-1">
                  {loading ? '—' : totals.workersAtLimit}
                </p>
              </div>
              <div className="p-2 bg-white/20 rounded-lg">
                <AlertTriangle className="w-5 h-5 md:w-6 md:h-6" />
              </div>
            </div>
          </div>
        </div>

        {/* Worker Overview */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                Worker Overview
              </h2>
              <p className="text-xs md:text-sm text-gray-500">
                Sorted by total OT hours
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchData}
                disabled={loading}
                className="inline-flex items-center gap-2 px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={exportToCSV}
                disabled={loading || workers.length === 0}
                className="inline-flex items-center gap-2 px-3 py-1.5 md:py-2 text-xs md:text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Content */}
          {loading ? (
            <div className="flex items-center justify-center py-16 md:py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-500">Loading summary...</p>
              </div>
            </div>
          ) : workers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4 text-center">
              <Users className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No workers found</p>
              <p className="text-xs md:text-sm text-gray-400">
                Add workers to start tracking overtime
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {workersWithSummary.map((worker, index) => (
                <div
                  key={worker._id}
                  className="px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    {/* Rank */}
                    <div className="flex items-center sm:block">
                      <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs md:text-sm font-semibold shrink-0">
                        {index + 1}
                      </div>
                    </div>

                    {/* Worker Info + Progress */}
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <h3 className="font-semibold text-gray-900 truncate">
                          {worker.name}
                        </h3>
                        {worker.employeeId && (
                          <span className="text-xs text-gray-400">
                            ({worker.employeeId})
                          </span>
                        )}
                      </div>

                      {/* Progress Bar */}
                      <div className="mt-2 flex flex-col md:flex-row md:items-center gap-2 md:gap-3">
                        <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-full md:max-w-xs">
                          <div
                            className={`h-full rounded-full transition-all duration-500 ${
                              worker.status === 'limit'
                                ? 'bg-red-500'
                                : worker.status === 'warning'
                                ? 'bg-amber-500'
                                : 'bg-emerald-500'
                            }`}
                            style={{ width: `${worker.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs text-gray-500 whitespace-nowrap">
                          {worker.remainingPaidHours.toFixed(1)} hours remaining
                        </span>
                      </div>
                    </div>

                    {/* OT Hours + Status */}
                    <div className="flex items-center justify-between sm:flex-col sm:items-end gap-2 shrink-0">
                      <div className="text-right">
                        <div className="flex items-baseline gap-1 justify-end">
                          <span className="text-lg md:text-xl font-bold text-gray-900">
                            {worker.totalOTHours.toFixed(1)}
                          </span>
                          <span className="text-xs md:text-sm text-gray-500">
                            hrs
                          </span>
                        </div>
                      </div>
                      <StatusBadge status={worker.status} />
                    </div>
                  </div>

                  {/* Extra details if unpaid hours */}
                  {worker.totalUnpaidHours > 0 && (
                    <div className="mt-2 sm:mt-3 pl-9 sm:pl-12 flex flex-wrap items-center gap-3 text-xs">
                      <span className="text-emerald-600">
                        Paid: {worker.totalPaidHours.toFixed(1)}h
                      </span>
                      <span className="text-red-600">
                        Unpaid: {worker.totalUnpaidHours.toFixed(1)}h
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {/* Summary Footer */}
          {!loading && workers.length > 0 && (
            <div className="px-4 md:px-6 py-3 md:py-4 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 text-xs md:text-sm">
                <div className="flex flex-wrap items-center gap-4 md:gap-6">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-emerald-500" />
                    <span className="text-gray-600">
                      OK: {workersWithSummary.filter(w => w.status === 'ok').length}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-amber-500" />
                    <span className="text-gray-600">
                      Near Limit: {totals.workersNearLimit}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-red-500" />
                    <span className="text-gray-600">
                      At Limit: {totals.workersAtLimit}
                    </span>
                  </div>
                </div>
                <p className="text-gray-500">
                  Total:&nbsp;
                  <span className="font-semibold text-gray-900">
                    {totals.totalOTHours.toFixed(1)}
                  </span>{' '}
                  overtime hours
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Year Summary Quick View */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
            {selectedYear} Monthly Overview
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-12 gap-2">
            {MONTHS.map((month, idx) => {
              const monthNum = idx + 1;
              const isSelected = monthNum === selectedMonth;
              const isPast =
                selectedYear < currentDate.getFullYear() ||
                (selectedYear === currentDate.getFullYear() &&
                  monthNum <= currentDate.getMonth() + 1);

              return (
                <button
                  key={month}
                  onClick={() => setSelectedMonth(monthNum)}
                  disabled={!isPast && selectedYear === currentDate.getFullYear()}
                  className={`p-2 rounded-lg text-[11px] md:text-xs font-medium transition ${
                    isSelected
                      ? 'bg-indigo-600 text-white'
                      : isPast || selectedYear < currentDate.getFullYear()
                      ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      : 'bg-gray-50 text-gray-300 cursor-not-allowed'
                  }`}
                >
                  {month.slice(0, 3)}
                </button>
              );
            })}
          </div>

          {/* Year Navigation */}
          <div className="flex items-center justify-center gap-4 mt-4">
            <button
              onClick={() => setSelectedYear(prev => prev - 1)}
              className="p-1 text-gray-500 hover:text-gray-700 transition"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <span className="font-semibold text-gray-800 text-sm md:text-base">
              {selectedYear}
            </span>
            <button
              onClick={() => setSelectedYear(prev => prev + 1)}
              disabled={selectedYear >= currentDate.getFullYear()}
              className="p-1 text-gray-500 hover:text-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">
            Overtime Limits
          </h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>
              • Maximum paid overtime is <strong>72 hours</strong> per month per worker
            </li>
            <li>
              • Workers at <strong>90%+</strong> capacity (64.8+ hours) are marked as &quot;Near Limit&quot;
            </li>
            <li>
              • Hours beyond 72 are tracked as <strong>unpaid overtime</strong>
            </li>
            <li>• Click on any month to view historical data</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
