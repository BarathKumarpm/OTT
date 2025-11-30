// pages/dashboard/enterOT.jsx
import { useState, useEffect } from 'react';
import { 
  Clock, 
  Calendar, 
  ArrowRight, 
  ArrowLeft, 
  Coffee, 
  AlertCircle, 
  CheckCircle, 
  X, 
  Loader, 
  Briefcase,
  ChevronDown,
  User
} from 'lucide-react';
import API from '@/lib/api'; // Adjust path if needed: '../../lib/api'

export default function EnterOT() {
  // Workers state
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  
  // Form submission state
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form data
  const [formData, setFormData] = useState({
    workerId: '',
    date: new Date().toISOString().split('T')[0],
    otStart: '08:00',
    otEnd: '',
    deductLunch: true,
    notes: ''
  });

  // Fetch workers on mount
  useEffect(() => {
    fetchWorkers();
  }, []);

  const fetchWorkers = async () => {
    setLoadingWorkers(true);
    try {
      const response = await API.get('/workers');
      setWorkers(response.data.workers || []);
    } catch (err) {
      console.error('Error fetching workers:', err);
      setError(err.response?.data?.message || 'Failed to fetch workers');
    } finally {
      setLoadingWorkers(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    setError('');
    setSuccess('');
  };

  const validateForm = () => {
    if (!formData.workerId) {
      setError('Please select a worker');
      return false;
    }
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }
    if (!formData.otStart) {
      setError('Please enter time in (start time)');
      return false;
    }
    if (!formData.otEnd) {
      setError('Please enter time out (end time)');
      return false;
    }

    const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(formData.otStart)) {
      setError('Invalid start time format. Use HH:mm (e.g., 08:00)');
      return false;
    }
    if (!timeRegex.test(formData.otEnd)) {
      setError('Invalid end time format. Use HH:mm (e.g., 17:00)');
      return false;
    }

    return true;
  };

  // Get base hours from selected worker (default 8 hours = 480 minutes)
  const getBaseHoursMinutes = () => {
    const worker = workers.find(w => w._id === formData.workerId);
    return (worker?.baseHoursPerDay || 8) * 60;
  };

  const calculateDuration = () => {
    if (!formData.otStart || !formData.otEnd) return null;

    const [startHour, startMin] = formData.otStart.split(':').map(Number);
    const [endHour, endMin] = formData.otEnd.split(':').map(Number);
    
    let startMinutes = startHour * 60 + startMin;
    let endMinutes = endHour * 60 + endMin;
    
    // If end time is less than start time, assume it's next day
    if (endMinutes <= startMinutes) {
      endMinutes += 24 * 60;
    }
    
    let totalWorkedMinutes = endMinutes - startMinutes;
    
    // Deduct lunch if enabled
    if (formData.deductLunch) {
      totalWorkedMinutes = Math.max(totalWorkedMinutes - 60, 0);
    }
    
    // Get base hours from selected worker
    const baseHoursMinutes = getBaseHoursMinutes();
    
    // Calculate actual overtime (hours worked beyond base hours)
    const overtimeMinutes = Math.max(totalWorkedMinutes - baseHoursMinutes, 0);
    
    const totalHours = Math.floor(totalWorkedMinutes / 60);
    const totalMins = totalWorkedMinutes % 60;
    
    const otHours = Math.floor(overtimeMinutes / 60);
    const otMins = overtimeMinutes % 60;
    
    return { 
      totalWorked: totalWorkedMinutes,
      totalHours,
      totalMins,
      overtimeMinutes,
      otHours, 
      otMins,
      baseHours: baseHoursMinutes / 60
    };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const duration = calculateDuration();
    if (duration && duration.overtimeMinutes <= 0) {
      setError(`No overtime to record. Worker needs to work more than ${duration.baseHours} base hours.`);
      return;
    }

    setSubmitting(true);
    setError('');
    setSuccess('');

    try {
      const payload = {
        workerId: formData.workerId,
        date: formData.date,
        otStart: formData.otStart,
        otEnd: formData.otEnd,
        deductLunch: formData.deductLunch,
        notes: formData.notes.trim()
      };

      const response = await API.post('/worklogs', payload);
      const data = response.data;

      const worker = workers.find(w => w._id === formData.workerId);
      const workerName = worker ? worker.name : 'Worker';
      
      const paidHours = (data.paidMinutes / 60).toFixed(2);
      const unpaidHours = (data.unpaidMinutes / 60).toFixed(2);
      const remainingHours = (data.remainingPaidMinutesAfter / 60).toFixed(2);

      setSuccess(
        `Overtime entry recorded for ${workerName}! ` +
        `OT Paid: ${paidHours}h, OT Unpaid: ${unpaidHours}h. ` +
        `Remaining paid OT this month: ${remainingHours}h`
      );

      // Reset form but keep worker and date
      setFormData(prev => ({
        ...prev,
        otStart: '08:00',
        otEnd: '',
        notes: ''
      }));

      setTimeout(() => setSuccess(''), 5000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit time entry. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      workerId: '',
      date: new Date().toISOString().split('T')[0],
      otStart: '08:00',
      otEnd: '',
      deductLunch: true,
      notes: ''
    });
    setError('');
    setSuccess('');
  };

  const duration = calculateDuration();
  const selectedWorker = workers.find(w => w._id === formData.workerId);

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:mt-0 mt-10">
      <div className="max-w-3xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-800 rounded-xl flex items-center justify-center shrink-0">
              <Clock className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl md:text-2xl font-bold text-gray-900">Record Time Entry</h1>
              <p className="text-xs md:text-sm text-gray-500 truncate">
                Singapore Shipyard - OT after {selectedWorker?.baseHoursPerDay || 8}hrs (1hr lunch deducted)
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 md:p-4 mb-6 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-red-800">Error</p>
              <p className="text-sm text-red-700 wrap-break-words">{error}</p>
            </div>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Success Alert */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 md:p-4 mb-6 flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-green-800">Success</p>
              <p className="text-sm text-green-700 wrap-break-words">{success}</p>
            </div>
            <button onClick={() => setSuccess('')} className="text-green-400 hover:text-green-600 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Main Form */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
          <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
            
            {/* Select Worker */}
            <div>
              <label htmlFor="workerId" className="block text-sm font-medium text-gray-700 mb-1.5">
                Select Worker
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
                    id="workerId"
                    name="workerId"
                    value={formData.workerId}
                    onChange={handleChange}
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-gray-700 text-sm appearance-none cursor-pointer"
                  >
                    <option value="">Choose a worker</option>
                    {workers.map(worker => (
                      <option key={worker._id} value={worker._id}>
                        {worker.name} {worker.employeeId ? `(${worker.employeeId})` : ''} - {worker.department}
                      </option>
                    ))}
                  </select>
                  <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                </div>
              )}
              {selectedWorker && (
                <div className="flex flex-wrap gap-2 mt-2">
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                    {selectedWorker.department}
                  </span>
                  <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded capitalize">
                    {selectedWorker.role}
                  </span>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                    Base: {selectedWorker.baseHoursPerDay}h/day
                  </span>
                </div>
              )}
            </div>

            {/* Date */}
            <div>
              <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1.5">
                Date
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleChange}
                  max={new Date().toISOString().split('T')[0]}
                  className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>
            </div>

            {/* Time In and Time Out - Responsive Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Time In */}
              <div>
                <label htmlFor="otStart" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <ArrowRight className="w-4 h-4 text-emerald-600" />
                  Time In
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    id="otStart"
                    name="otStart"
                    value={formData.otStart}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>

              {/* Time Out */}
              <div>
                <label htmlFor="otEnd" className="text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                  <ArrowLeft className="w-4 h-4 text-red-600" />
                  Time Out
                </label>
                <div className="relative">
                  <Clock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  <input
                    type="time"
                    id="otEnd"
                    name="otEnd"
                    value={formData.otEnd}
                    onChange={handleChange}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-rose-500 focus:border-transparent outline-none transition text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Duration Preview - Responsive Breakdown */}
            {duration && duration.totalWorked > 0 && (
              <div className="space-y-3">
                {/* Total Worked Hours */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Briefcase className="w-4 h-4 text-gray-600 shrink-0" />
                      <span className="text-sm font-medium text-gray-700 truncate">
                        Total Worked:
                      </span>
                    </div>
                    <span className="text-base md:text-lg font-semibold text-gray-700 shrink-0">
                      {duration.totalHours}h {duration.totalMins}m
                    </span>
                  </div>
                  {formData.deductLunch && (
                    <p className="text-xs text-gray-500 mt-1">
                      (1 hour lunch break deducted)
                    </p>
                  )}
                </div>

                {/* Base Hours */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 md:p-4">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-sm font-medium text-blue-900">
                      Base Hours (Non-OT):
                    </span>
                    <span className="text-base md:text-lg font-semibold text-blue-700 shrink-0">
                      {duration.baseHours}h 0m
                    </span>
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    Regular working hours - not counted as overtime
                  </p>
                </div>

                {/* Actual Overtime */}
                <div className={`rounded-lg p-3 md:p-4 ${
                  duration.overtimeMinutes > 0 
                    ? 'bg-emerald-50 border border-emerald-200' 
                    : 'bg-amber-50 border border-amber-200'
                }`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className={`text-sm font-medium ${
                      duration.overtimeMinutes > 0 ? 'text-emerald-900' : 'text-amber-900'
                    }`}>
                      Actual Overtime:
                    </span>
                    <span className={`text-lg md:text-xl font-bold shrink-0 ${
                      duration.overtimeMinutes > 0 ? 'text-emerald-700' : 'text-amber-700'
                    }`}>
                      {duration.otHours}h {duration.otMins}m
                    </span>
                  </div>
                  {duration.overtimeMinutes > 0 ? (
                    <p className="text-xs text-emerald-600 mt-1">
                      Hours beyond {duration.baseHours}h base - this will be recorded as OT
                    </p>
                  ) : (
                    <p className="text-xs text-amber-600 mt-1">
                      No overtime - worker did not exceed {duration.baseHours}h base hours
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Deduct Lunch Toggle - Responsive */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 md:p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center gap-3">
                <Coffee className="w-5 h-5 text-amber-600 shrink-0" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Deduct 1hr Lunch Break</p>
                  <p className="text-xs text-gray-500">Automatically subtract 1 hour for lunch</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                <input
                  type="checkbox"
                  name="deductLunch"
                  checked={formData.deductLunch}
                  onChange={handleChange}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:start-0.5 after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
              </label>
            </div>

            {/* Notes */}
            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1.5">
                Notes <span className="text-gray-400 text-xs font-normal">(Optional)</span>
              </label>
              <textarea
                id="notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows="3"
                placeholder="Add any additional notes about this overtime entry..."
                className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition resize-none text-sm"
              />
            </div>

            {/* Action Buttons - Responsive */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                type="submit"
                disabled={submitting || loadingWorkers || (duration && duration.overtimeMinutes <= 0)}
                className="flex-1 bg-indigo-800 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
              >
                {submitting ? (
                  <>
                    <Loader className="w-4 h-4 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Clock className="w-4 h-4" />
                    Submit Overtime Entry
                  </>
                )}
              </button>
              
              <button
                type="button"
                onClick={handleReset}
                disabled={submitting}
                className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 focus:ring-4 focus:ring-gray-200 transition disabled:opacity-50 disabled:cursor-not-allowed text-sm"
              >
                Reset
              </button>
            </div>
          </form>
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Important Information</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Only hours worked beyond base hours ({selectedWorker?.baseHoursPerDay || 8}h) count as overtime</li>
            <li>• Maximum paid overtime is 72 hours per month per worker</li>
            <li>• Overtime beyond 72 hours will be tracked as unpaid</li>
            <li>• If end time is before start time, it will be counted as next day</li>
            <li>• Lunch break (1 hour) is automatically deducted by default</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
