import Link from 'next/link'

export default function AdminPage() {
  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Admin Space
        </h1>
        <p className="text-gray-600">
          Administrative functions and user management
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid md:grid-cols-2 gap-6">
          <Link
            href="/spaces/admin/user-preferences"
            className="border border-gray-200 rounded-lg p-4 hover:border-green-500 hover:shadow-md transition-all cursor-pointer"
          >
            <h2 className="text-xl font-semibold mb-4">User Preferences</h2>
            <p className="text-gray-600">Customize your application settings and preferences</p>
          </Link>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">User Management</h2>
            <p className="text-gray-600">Manage users, roles, and permissions</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">System Logs</h2>
            <p className="text-gray-600">View and monitor system activity</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Audit Trail</h2>
            <p className="text-gray-600">Track changes and access history</p>
          </div>
          
          <div className="border border-gray-200 rounded-lg p-4">
            <h2 className="text-xl font-semibold mb-4">Backup & Restore</h2>
            <p className="text-gray-600">Data backup and recovery options</p>
          </div>
        </div>
      </div>
    </div>
  )
}

