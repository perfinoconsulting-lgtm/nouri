export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="bg-white p-10 rounded-3xl shadow-xl max-w-md w-full border border-gray-100">
        <h1 className="text-3xl font-bold text-primary mb-8 text-center">Espace Parent</h1>
        <form className="space-y-6">
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Email</label>
            <input type="email" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="votre@email.com" />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-2 text-gray-700">Mot de passe</label>
            <input type="password" className="w-full p-4 bg-gray-50 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-accent outline-none transition" placeholder="••••••••" />
          </div>
          <button className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition shadow-md">Se connecter</button>
        </form>
      </div>
    </div>
  )
}
