export default function GHGEmissionPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          GHG Emission Space
        </h1>
        <p className="text-gray-600">
          Track and manage greenhouse gas emissions data
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-1">Total Emissions</h3>
            <p className="text-2xl font-bold text-blue-700">--</p>
            <p className="text-xs text-blue-600 mt-1">CO₂ equivalent</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <h3 className="text-sm font-medium text-green-900 mb-1">This Month</h3>
            <p className="text-2xl font-bold text-green-700">--</p>
            <p className="text-xs text-green-600 mt-1">CO₂ equivalent</p>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
            <h3 className="text-sm font-medium text-purple-900 mb-1">Target Reduction</h3>
            <p className="text-2xl font-bold text-purple-700">--</p>
            <p className="text-xs text-purple-600 mt-1">% reduction</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Emission Sources</h2>
            <p className="text-gray-600">Manage and track emission sources</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Reports & Analytics</h2>
            <p className="text-gray-600">Generate emissions reports and analysis</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Data Entry</h2>
            <p className="text-gray-600">Add and update emission records</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Compliance Tracking</h2>
            <p className="text-gray-600">Monitor regulatory compliance</p>
          </div>
        </div>
      </div>
    </div>
  )
}

