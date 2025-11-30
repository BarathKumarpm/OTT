// pages/dashboard/addWorker.jsx
import { useState, useEffect } from 'react';
import { 
  UserPlus, 
  X, 
  AlertCircle, 
  CheckCircle, 
  Users, 
  Trash2, 
  Search, 
  RefreshCw,
  ChevronDown,
  Loader
} from 'lucide-react';
import API from '@/lib/api'; // Adjust path if needed: '../../lib/api'

export default function AddWorker() {
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    employeeId: '',
    department: 'Shipyard',
    role: 'worker',
    baseHoursPerDay: 8
  });
  
  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Workers list state
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('All');
  const [filterRole, setFilterRole] = useState('All');
  const [showWorkersList, setShowWorkersList] = useState(true);
  
  // Delete confirmation state
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [deleting, setDeleting] = useState(false);

  // Options
  const departments = [
    'Shipyard',
    'General',
    'Production',
    'Maintenance',
    'Quality Control',
    'Logistics',
    'Administration',
    'Engineering'
  ];

  const roles = [
    { value: 'worker', label: 'Worker' },
    { value: 'supervisor', label: 'Supervisor' },
    { value: 'manager', label: 'Manager' },
    { value: 'technician', label: 'Technician' }
  ];

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
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'baseHoursPerDay' ? Number(value) : value
    }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      setError('Worker name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await API.post('/workers', formData);

      setSuccess(`Worker "${response.data.worker.name}" created successfully!`);
      
      // Reset form
      setFormData({
        name: '',
        employeeId: '',
        department: 'Shipyard',
        role: 'worker',
        baseHoursPerDay: 8
      });

      // Refresh workers list
      fetchWorkers();

      setTimeout(() => setSuccess(''), 3000);

    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create worker. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (workerId) => {
    setDeleting(true);
    try {
      await API.delete(`/workers/${workerId}`);
      
      const worker = workers.find(w => w._id === workerId);
      setSuccess(`Worker "${worker?.name}" deleted successfully!`);
      
      // Remove from local state
      setWorkers(prev => prev.filter(w => w._id !== workerId));
      setDeleteConfirm(null);
      
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete worker');
    } finally {
      setDeleting(false);
    }
  };

  const handleReset = () => {
    setFormData({
      name: '',
      employeeId: '',
      department: 'Shipyard',
      role: 'worker',
      baseHoursPerDay: 8
    });
    setError('');
    setSuccess('');
  };

  // Filter workers
  const filteredWorkers = workers.filter(worker => {
    const matchesSearch = 
      worker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (worker.employeeId && worker.employeeId.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesDepartment = filterDepartment === 'All' || worker.department === filterDepartment;
    const matchesRole = filterRole === 'All' || worker.role === filterRole;
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:mt-0 mt-10">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 md:p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-800 rounded-xl flex items-center justify-center shrink-0">
                <UserPlus className="w-5 h-5 md:w-6 md:h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl md:text-2xl font-bold text-gray-900">Worker Management</h1>
                <p className="text-xs md:text-sm text-gray-500">Add new workers and manage existing ones</p>
              </div>
            </div>
            <button
              onClick={() => setShowWorkersList(!showWorkersList)}
              className="flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition text-sm font-medium"
            >
              <Users className="w-4 h-4" />
              <span>{showWorkersList ? 'Hide' : 'Show'} Workers</span>
              <ChevronDown className={`w-4 h-4 transition-transform ${showWorkersList ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 flex items-start gap-3">
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6 flex items-start gap-3">
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

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Add Worker Form */}
          <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-indigo-600" />
              Add New Worker
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Worker Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Worker Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Enter full name"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              {/* Employee ID */}
              <div>
                <label htmlFor="employeeId" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Employee ID <span className="text-gray-400 text-xs font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  id="employeeId"
                  name="employeeId"
                  value={formData.employeeId}
                  onChange={handleChange}
                  placeholder="e.g., EMP001"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                />
              </div>

              {/* Department & Role - Responsive Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="department" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Department
                  </label>
                  <div className="relative">
                    <select
                      id="department"
                      name="department"
                      value={formData.department}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-sm appearance-none cursor-pointer"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Role
                  </label>
                  <div className="relative">
                    <select
                      id="role"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition bg-white text-sm appearance-none cursor-pointer"
                    >
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Base Hours Per Day */}
              <div>
                <label htmlFor="baseHoursPerDay" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Base Hours Per Day
                </label>
                <input
                  type="number"
                  id="baseHoursPerDay"
                  name="baseHoursPerDay"
                  value={formData.baseHoursPerDay}
                  onChange={handleChange}
                  min="1"
                  max="24"
                  step="0.5"
                  className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition text-sm"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Hours before overtime starts (default: 8 hours)
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 bg-indigo-800 text-white px-4 py-3 rounded-lg font-medium hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-200 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <>
                      <Loader className="w-4 h-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      Add Worker
                    </>
                  )}
                </button>
                
                <button
                  type="button"
                  onClick={handleReset}
                  disabled={loading}
                  className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50 transition disabled:opacity-50 text-sm"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>

          {/* Workers List */}
          {showWorkersList && (
            <div className="bg-white rounded-xl shadow-sm p-4 md:p-6">
              {/* List Header */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Users className="w-5 h-5 text-indigo-600" />
                  All Workers 
                  <span className="text-sm font-normal text-gray-500">
                    ({filteredWorkers.length})
                  </span>
                </h2>
                <button
                  onClick={fetchWorkers}
                  disabled={loadingWorkers}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 rounded-lg transition disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${loadingWorkers ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>

              {/* Search */}
              <div className="space-y-3 mb-4">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none text-sm"
                  />
                </div>

                {/* Filters - Responsive */}
                <div className="flex flex-col sm:flex-row gap-2">
                  <div className="relative flex-1">
                    <select
                      value={filterDepartment}
                      onChange={(e) => setFilterDepartment(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm appearance-none cursor-pointer"
                    >
                      <option value="All">All Departments</option>
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>

                  <div className="relative flex-1">
                    <select
                      value={filterRole}
                      onChange={(e) => setFilterRole(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none bg-white text-sm appearance-none cursor-pointer"
                    >
                      <option value="All">All Roles</option>
                      {roles.map(role => (
                        <option key={role.value} value={role.value}>{role.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                  </div>
                </div>
              </div>

              {/* Workers List */}
              <div className="space-y-2 max-h-[400px] md:max-h-[500px] overflow-y-auto">
                {loadingWorkers ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Loader className="w-8 h-8 text-indigo-600 animate-spin mb-2" />
                    <p className="text-sm text-gray-500">Loading workers...</p>
                  </div>
                ) : filteredWorkers.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12">
                    <Users className="w-12 h-12 text-gray-300 mb-2" />
                    <p className="text-gray-500 font-medium">No workers found</p>
                    <p className="text-sm text-gray-400">
                      {workers.length === 0 
                        ? 'Add your first worker above' 
                        : 'Try adjusting your filters'
                      }
                    </p>
                  </div>
                ) : (
                  filteredWorkers.map((worker) => (
                    <div
                      key={worker._id}
                      className="flex items-start sm:items-center justify-between p-3 md:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition gap-3"
                    >
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {worker.name}
                        </h3>
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {worker.employeeId && (
                            <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                              {worker.employeeId}
                            </span>
                          )}
                          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                            {worker.department}
                          </span>
                          <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded capitalize">
                            {worker.role}
                          </span>
                          <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded">
                            {worker.baseHoursPerDay}h/day
                          </span>
                        </div>
                      </div>
                      
                      <button
                        onClick={() => setDeleteConfirm(worker)}
                        className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition shrink-0"
                        title="Delete worker"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Info Card */}
        <div className="bg-blue-50 rounded-lg p-4 mt-6">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Worker Management Info</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• Base hours per day determines when overtime starts (default: 8 hours)</li>
            <li>• Employee ID is optional but recommended for tracking</li>
            <li>• Deleting a worker will not delete their overtime records</li>
            <li>• Use filters to quickly find workers by department or role</li>
          </ul>
        </div>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                  <AlertCircle className="w-5 h-5 text-red-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900">Delete Worker</h3>
              </div>
              
              <p className="text-gray-600 mb-2">
                Are you sure you want to delete <span className="font-semibold">{deleteConfirm.name}</span>?
              </p>
              <p className="text-sm text-gray-500 mb-6">
                This action cannot be undone. Overtime records for this worker will be preserved.
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
                  onClick={() => handleDelete(deleteConfirm._id)}
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
                      Delete Worker
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
