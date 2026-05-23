export default function SettingsPage() {
  return (
    <div>
      <h1 className="text-4xl font-bold text-primary mb-10">Paramètres du compte</h1>
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-2xl">
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email Parent</label>
            <input type="email" defaultValue="parent@email.com" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl outline-none" disabled />
          </div>
          <button className="px-6 py-3 bg-red-50 text-red-600 font-bold rounded-2xl hover:bg-red-100 transition mt-8">
            Déconnexion
          </button>
        </form>
      </div>
    </div>
  )
}
