// pages/dashboard/history.jsx
import { useState, useEffect, useMemo } from 'react';
import {
  Clock,
  History as HistoryIcon,
  Calendar,
  User,
  Loader,
  AlertCircle,
  Trash2,
  ChevronDown,
  Briefcase,
  TrendingUp,
  FileText,
  RefreshCw,
  X
} from 'lucide-react';
import API from '@/lib/api';

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function History() {
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [selectedWorkerId, setSelectedWorkerId] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [allWorkLogs, setAllWorkLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [monthlySummary, setMonthlySummary] = useState(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [error, setError] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchWorkers();
  }, []);

  // Fetch logs when worker changes
  useEffect(() => {
    if (selectedWorkerId) {
      fetchAllWorkLogs();
    } else {
      setAllWorkLogs([]);
      setMonthlySummary(null);
    }
  }, [selectedWorkerId]);

  // Update monthly summary when date changes
  useEffect(() => {
    if (selectedWorkerId) {
      fetchMonthlySummary();
    }
  }, [selectedWorkerId, selectedDate]);

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const response = await API.get('/workers');
      setWorkers(response.data.workers || []);
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError('Failed to load workers');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const fetchAllWorkLogs = async () => {
    if (!selectedWorkerId) return;

    setLoadingLogs(true);
    setError('');

    try {
      // Try to fetch all logs without date restriction
      // This might need adjustment based on your API
      const response = await API.get(`/worklogs/${selectedWorkerId}`, {
        params: {
          // Don't pass month/year to get ALL logs
          // Or pass a large range if API requires it
        }
      });
      
      const logs = response.data.logs || [];
      
      // Sort by date descending (newest first)
      logs.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      setAllWorkLogs(logs);
      
      console.log('Fetched logs:', logs); // Debug
    } catch (err) {
      console.error('Error fetching work logs:', err);
      setError(err.response?.data?.message || 'Failed to load work logs');
      setAllWorkLogs([]);
    } finally {
      setLoadingLogs(false);
    }
  };

  const fetchMonthlySummary = async () => {
    if (!selectedWorkerId) return;

    setLoadingSummary(true);

    try {
      const date = selectedDate ? new Date(selectedDate) : new Date();
      const month = date.getMonth() + 1;
      const year = date.getFullYear();

      const response = await API.get(`/overtime/${selectedWorkerId}/${month}/${year}`);
      setMonthlySummary({
        ...response.data,
        monthName: MONTHS[month - 1],
        year
      });
    } catch (err) {
      console.error('Error fetching monthly summary:', err);
      setMonthlySummary(null);
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDeleteLog = async (logId) => {
    setDeleting(true);
    try {
      await API.delete(`/worklogs/${logId}`);
      setAllWorkLogs(prev => prev.filter(log => log._id !== logId));
      fetchMonthlySummary();
      setDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting log:', err);
      setError(err.response?.data?.message || 'Failed to delete entry');
    } finally {
      setDeleting(false);
    }
  };

  const handleWorkerChange = (e) => {
    setSelectedWorkerId(e.target.value);
    setAllWorkLogs([]);
    setMonthlySummary(null);
    setError('');
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    setError('');
  };

  const clearFilters = () => {
    setSelectedDate('');
  };

  const selectedWorker = useMemo(() => {
    return workers.find(w => w._id === selectedWorkerId);
  }, [workers, selectedWorkerId]);

  // Filter logs by selected date
  const filteredWorkLogs = useMemo(() => {
    if (!selectedDate) {
      return allWorkLogs;
    }

    const filtered = allWorkLogs.filter(log => {
      try {
        // Normalize both dates to YYYY-MM-DD format for comparison
        const logDate = new Date(log.date);
        
        // Get date in local timezone
        const logYear = logDate.getFullYear();
        const logMonth = String(logDate.getMonth() + 1).padStart(2, '0');
        const logDay = String(logDate.getDate()).padStart(2, '0');
        const logDateString = `${logYear}-${logMonth}-${logDay}`;
        
        console.log('Comparing:', logDateString, 'with', selectedDate); // Debug
        
        return logDateString === selectedDate;
      } catch (error) {
        console.error('Error parsing date:', log.date, error);
        return false;
      }
    });

    console.log('Filtered logs:', filtered); // Debug
    return filtered;
  }, [allWorkLogs, selectedDate]);

  // Calculate totals for filtered logs
  const displayTotals = useMemo(() => {
    const totalWorkedMinutes = filteredWorkLogs.reduce(
      (sum, log) => sum + (log.totalWorkedMinutes || 0),
      0
    );
    const totalOTMinutes = filteredWorkLogs.reduce(
      (sum, log) => sum + (log.durationMinutes || 0),
      0
    );
    const totalPaidMinutes = filteredWorkLogs.reduce(
      (sum, log) => sum + (log.paidMinutes || 0),
      0
    );
    const totalUnpaidMinutes = filteredWorkLogs.reduce(
      (sum, log) => sum + (log.unpaidMinutes || 0),
      0
    );

    console.log('Display totals:', {
      totalWorkedMinutes,
      totalOTMinutes,
      totalPaidMinutes,
      totalUnpaidMinutes,
      logsCount: filteredWorkLogs.length
    }); // Debug

    return {
      totalWorkedHours: (totalWorkedMinutes / 60).toFixed(1),
      totalOTHours: (totalOTMinutes / 60).toFixed(1),
      totalPaidHours: (totalPaidMinutes / 60).toFixed(1),
      totalUnpaidHours: (totalUnpaidMinutes / 60).toFixed(1),
      entries: filteredWorkLogs.length
    };
  }, [filteredWorkLogs]);

  const formatTime = (timeStr) => {
    if (!timeStr) return '—';
    if (timeStr.includes('T')) {
      return new Date(timeStr).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      });
    }
    return timeStr;
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return dateStr;
    }
  };

  const formatDuration = (minutes) => {
    if (!minutes || minutes === 0) return '0h 0m';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}h ${mins}m`;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:mt-0 mt-10">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="bg-indigo-800 rounded-xl p-4 md:p-6 mb-6 text-white">
          <div className="flex items-center gap-3 md:gap-4">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-white/10 rounded-xl flex items-center justify-center shrink-0">
              <HistoryIcon className="w-5 h-5 md:w-6 md:h-6" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold">Time Entry History</h1>
              <p className="text-gray-300 text-xs md:text-sm">View all recorded time entries</p>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-700 wrap-break-words">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Worker Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Worker
              </label>
              {loadingWorkers ? (
                <div className="w-full px-3 py-2.5 border border-gray-300 rounded-lg flex items-center gap-2 text-gray-500 text-sm">
                  <Loader className="w-4 h-4 animate-spin" />
                  Loading workers...
                </div>
              ) : (
                <div className="relative">
                  <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <select
                    value={selectedWorkerId}
                    onChange={handleWorkerChange}
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-700 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Select a worker</option>
                    {workers.map(worker => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name} {worker.employeeId ? `(${worker.employeeId})` : ''} - {worker.department}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
            </div>

            {/* Date Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Filter by Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
              {selectedDate && (
                <button
                  onClick={clearFilters}
                  className="mt-2 text-xs md:text-sm text-indigo-600 hover:text-indigo-800"
                >
                  Clear date filter (show all)
                </button>
              )}
            </div>
          </div>

          {/* Selected Worker Info */}
          {selectedWorker && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="w-4 h-4" />
                  {selectedWorker.name}
                </span>
                <span className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  {selectedWorker.department}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Base: {selectedWorker.baseHoursPerDay || 8}h/day
                </span>
              </div>
            </div>
          )}

          {/* Debug Info - Remove in production */}
          {selectedWorkerId && (
            <div className="mt-3 p-2 bg-gray-100 rounded text-xs text-gray-600">
              <strong>Debug:</strong> Total logs: {allWorkLogs.length} | Filtered: {filteredWorkLogs.length} | Selected date: {selectedDate || 'None'}
            </div>
          )}
        </div>

        {/* Stats Cards */}
        {selectedWorkerId && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div className="bg-white border-2 border-blue-100 rounded-xl p-4 md:p-5">
              <p className="text-blue-600 text-xs md:text-sm font-medium mb-1">Total Hours</p>
              <p className="text-3xl md:text-4xl font-bold text-blue-700">
                {loadingLogs ? '—' : displayTotals.totalWorkedHours}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                {selectedDate 
                  ? `On ${formatDate(selectedDate)}` 
                  : `All entries (${filteredWorkLogs.length})`
                }
              </p>
            </div>

            <div className="bg-amber-50 border-2 border-amber-100 rounded-xl p-4 md:p-5">
              <p className="text-amber-600 text-xs md:text-sm font-medium mb-1">Total OT</p>
              <p className="text-3xl md:text-4xl font-bold text-amber-700">
                {loadingLogs ? '—' : displayTotals.totalOTHours}
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Paid: {displayTotals.totalPaidHours}h | Unpaid: {displayTotals.totalUnpaidHours}h
              </p>
            </div>
          </div>
        )}

        {/* Work Logs */}
        <div className="bg-white rounded-xl shadow-sm overflow-hidden mb-6">
          <div className="px-4 md:px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h2 className="text-base md:text-lg font-semibold text-gray-900">
                {selectedDate ? `Entries for ${formatDate(selectedDate)}` : 'All Entries'}
              </h2>
              {selectedWorkerId && (
                <p className="text-xs text-gray-500 mt-1">
                  Showing {filteredWorkLogs.length} {filteredWorkLogs.length === 1 ? 'entry' : 'entries'}
                </p>
              )}
            </div>
            {selectedWorkerId && (
              <button
                onClick={fetchAllWorkLogs}
                disabled={loadingLogs}
                className="inline-flex items-center gap-2 px-3 py-1.5 md:py-2 text-xs md:text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition disabled:opacity-50"
              >
                <RefreshCw className={`w-4 h-4 ${loadingLogs ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            )}
          </div>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-16 md:py-20">
              <div className="flex flex-col items-center gap-3">
                <Loader className="w-8 h-8 text-indigo-600 animate-spin" />
                <p className="text-sm text-gray-500">Loading entries...</p>
              </div>
            </div>
          ) : !selectedWorkerId ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4 text-center">
              <User className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">Select a worker</p>
              <p className="text-xs md:text-sm text-gray-400">Choose a worker to view their time entries</p>
            </div>
          ) : filteredWorkLogs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 md:py-20 px-4 text-center">
              <Clock className="w-10 h-10 md:w-12 md:h-12 text-gray-300 mb-3" />
              <p className="text-gray-500 font-medium">No entries found</p>
              <p className="text-xs md:text-sm text-gray-400">
                {selectedDate 
                  ? `No overtime recorded on ${formatDate(selectedDate)}`
                  : allWorkLogs.length > 0 
                    ? 'Filter returned no results'
                    : 'No overtime entries for this worker'
                }
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {filteredWorkLogs.map((log) => (
                <div key={log._id} className="px-4 md:px-6 py-3 md:py-4 hover:bg-gray-50 transition">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-sm font-medium text-gray-900">
                          {formatDate(log.date)}
                        </span>
                        <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded whitespace-nowrap">
                          {formatTime(log.otStart)} → {formatTime(log.otEnd)}
                        </span>
                      </div>

                      <div className="flex flex-wrap items-center gap-3 md:gap-4 text-xs md:text-sm">
                        {log.totalWorkedMinutes > 0 && (
                          <span className="flex items-center gap-1 text-gray-600">
                            <Briefcase className="w-4 h-4" />
                            Worked: {formatDuration(log.totalWorkedMinutes)}
                          </span>
                        )}
                        <span className="flex items-center gap-1 text-emerald-600 font-medium">
                          <TrendingUp className="w-4 h-4" />
                          OT: {formatDuration(log.durationMinutes)}
                        </span>
                        {log.paidMinutes > 0 && (
                          <span className="text-blue-600">
                            Paid: {formatDuration(log.paidMinutes)}
                          </span>
                        )}
                        {log.unpaidMinutes > 0 && (
                          <span className="text-red-600">
                            Unpaid: {formatDuration(log.unpaidMinutes)}
                          </span>
                        )}
                      </div>

                      {log.notes && (
                        <div className="mt-2 flex items-start gap-2 text-xs md:text-sm text-gray-500">
                          <FileText className="w-4 h-4 shrink-0 mt-0.5" />
                          <span className="wrap-break-words">{log.notes}</span>
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => setDeleteConfirm(log._id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0 self-start"
                      title="Delete entry"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Monthly Summary */}
        {selectedWorkerId && monthlySummary && (
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
            <h3 className="text-base md:text-lg font-semibold text-gray-900 mb-4">
              Monthly Summary - {monthlySummary.monthName} {monthlySummary.year}
            </h3>
            
            {loadingSummary ? (
              <div className="flex items-center gap-2 text-gray-500 text-sm">
                <Loader className="w-4 h-4 animate-spin" />
                Loading summary...
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
                  <div className="p-3 md:p-4 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-500 mb-1">Total OT</p>
                    <p className="text-lg md:text-xl font-bold text-gray-900">
                      {((monthlySummary.totalOvertimeMinutes || 0) / 60).toFixed(1)}h
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-emerald-50 rounded-lg">
                    <p className="text-xs text-emerald-600 mb-1">Paid OT</p>
                    <p className="text-lg md:text-xl font-bold text-emerald-700">
                      {((monthlySummary.totalPaidMinutes || 0) / 60).toFixed(1)}h
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-red-50 rounded-lg">
                    <p className="text-xs text-red-600 mb-1">Unpaid OT</p>
                    <p className="text-lg md:text-xl font-bold text-red-700">
                      {((monthlySummary.totalUnpaidMinutes || 0) / 60).toFixed(1)}h
                    </p>
                  </div>
                  <div className="p-3 md:p-4 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-600 mb-1">Remaining Paid</p>
                    <p className="text-lg md:text-xl font-bold text-blue-700">
                      {((monthlySummary.remainingPaidMinutes || 0) / 60).toFixed(1)}h
                    </p>
                  </div>
                </div>

                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs md:text-sm mb-2">
                    <span className="text-gray-600">Monthly Paid OT Limit Progress</span>
                    <span className="font-medium text-gray-900">
                      {((monthlySummary.totalPaidMinutes || 0) / 60).toFixed(1)} / 72h
                    </span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        (monthlySummary.totalPaidMinutes || 0) >= 72 * 60
                          ? 'bg-red-500'
                          : (monthlySummary.totalPaidMinutes || 0) >= 72 * 60 * 0.9
                            ? 'bg-amber-500'
                            : 'bg-emerald-500'
                      }`}
                      style={{
                        width: `${Math.min(((monthlySummary.totalPaidMinutes || 0) / (72 * 60)) * 100, 100)}%`
                      }}
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Delete Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Entry</h3>
              </div>
              
              <p className="text-gray-600 mb-6 text-sm">
                Are you sure you want to delete this time entry? This action cannot be undone and will update the monthly overtime totals.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <button
                  onClick={() => setDeleteConfirm(null)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition disabled:opacity-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleDeleteLog(deleteConfirm)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
                >
                  {deleting ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4" />
                      Delete
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Info Card */}
        <div className="bg-blue-50 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-900 mb-2">History Information</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Select a worker to view all their overtime entries</li>
            <li>• Use date filter to view entries for a specific day</li>
            <li>• Stats cards show totals for currently filtered view</li>
            <li>• Monthly summary shows totals for the selected month</li>
            <li>• Deleting an entry will automatically update monthly totals</li>
            <li>• Maximum paid overtime is 72 hours per month</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
