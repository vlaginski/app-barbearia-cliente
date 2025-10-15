export default function HomePage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          🎉 Projeto Funcionando!
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Seu projeto está rodando perfeitamente no ambiente de desenvolvimento.
        </p>
        <div className="bg-white p-6 rounded-lg shadow-md max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Status do Sistema
          </h2>
          <div className="space-y-2 text-left">
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Next.js:</span>
              <span className="text-green-600 font-medium">✅ Ativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">Tailwind CSS:</span>
              <span className="text-green-600 font-medium">✅ Ativo</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-600">TypeScript:</span>
              <span className="text-green-600 font-medium">✅ Ativo</span>
            </div>
          </div>
        </div>
        <p className="text-sm text-gray-500 mt-6">
          Se você está vendo esta página, significa que o servidor está funcionando corretamente.
        </p>
      </div>
    </div>
  )
}