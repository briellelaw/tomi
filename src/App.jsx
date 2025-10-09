export default function App() {
  return (
    <div className="min-h-screen bg-background text-foreground py-16 flex justify-center">
      <div className="w-full max-w-md bg-white dark:bg-background-dark p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-extrabold mb-6 text-primary text-center">
          TOMI
        </h1>

        <div className="mb-6 space-y-3">
          <input
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Description"
          />
          <input
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
            placeholder="Amount"
            type="number"
          />
          <input
            className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-primary focus:outline-none"
            type="date"
          />
          <button
            className="w-full bg-primary text-white py-2 rounded font-medium hover:bg-primary/80 transition"
          >
            Add Transaction
          </button>
        </div>

        <h2 className="text-xl font-semibold mb-3">Transactions</h2>
        <ul>
          <li className="bg-accent dark:bg-gray-800 p-3 rounded-lg shadow-sm mb-2 flex justify-between items-center">
            <div>
              <div className="font-medium">Example item</div>
              <div className="text-sm text-gray-500">10/09/2025</div>
            </div>
            <div className="font-semibold text-green-600 dark:text-green-400">
              $100.00
            </div>
          </li>
        </ul>
      </div>
    </div>
  );
}
