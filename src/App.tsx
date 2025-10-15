import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type Transaction = {
  id: number;
  description: string;
  amount: number;
  date: string;
};

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "settings">("overview");

  // --- Transaction State ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

  const fetchTransactions = async () => {
    try {
      const list = await invoke<Transaction[]>("get_transactions");
      setTransactions(list);
    } catch (error) {
      console.error("Error fetching transactions:", error);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async () => {
    alert("Please fill out all fields.");
    if (!desc || !amount || !date) {
      alert("Please fill out all fields.");
      return;
    }

    try {
      console.log({ desc, amount: parseFloat(amount), date });
      await invoke("add_transaction", {
        description: desc,
        amount: parseFloat(amount),
        date,
      });

      // Clear inputs
      setDesc("");
      setAmount("");
      setDate("");

      // Refresh the list immediately
      await fetchTransactions();
    } catch (error) {
      alert("Failed to Add Transaction");
      console.error("Error adding transaction:", error);
    }
  };


  return (
    <div className="min-h-screen bg-background text-foreground py-16 flex justify-center">
      <div className="w-full max-w-6xl bg-white dark:bg-background-dark p-8 rounded-2xl shadow-lg">
        <h1 className="text-4xl font-extrabold mb-6 text-primary text-center">
          TOMI
        </h1>

        {/* --- Tabs Header --- */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {["overview", "transactions", "settings"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`flex-1 py-2 text-center font-medium capitalize transition ${
                activeTab === tab
                  ? "text-primary border-b-2 border-primary"
                  : "text-gray-500 hover:text-primary"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <div>
            <h2 className="text-xl font-semibold mb-3">Overview</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Welcome to TOMI.
            </p>
            <p className="text-gray-600 dark:text-gray-400">
              Use the <span className="text-primary font-medium">Transactions</span> tab to record your spending,
              and <span className="text-primary font-medium">Settings</span> to customize your experience.
            </p>
          </div>
        )}

        {activeTab === "transactions" && (
          <div>
            <div className="mb-6 space-y-3">
              <input
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Description"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
              />
              <input
                className="w-full p-2 border border-gray-300 rounded"
                placeholder="Amount"
                type="number"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
              <input
                className="w-full p-2 border border-gray-300 rounded"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
              <button
                className="w-full bg-[#7b9684] text-white py-2 rounded font-medium hover:bg-[#67856f] transition"
                onClick={addTransaction}
              >
                Add Transaction
              </button>
            </div>

            <h2 className="text-xl font-semibold mb-3">Transactions</h2>
            {transactions.length === 0 ? (
              <p className="text-gray-500 italic">No transactions yet.</p>
            ) : (
              <ul>
                {transactions.map((tx, index) => (
  <li
    key={tx.id ?? index}
    className="bg-gray-50 p-3 rounded-lg shadow-sm mb-2 flex justify-between items-center"
  >
    <div>
      <div className="font-medium">{tx.description}</div>
      <div className="text-sm text-gray-500">{tx.date}</div>
    </div>
    <div className="flex items-center gap-3">
      <span
        className={`font-semibold ${
          Number(tx.amount) < 0 ? "text-red-600" : "text-green-600"
        }`}
      >
        ${Number(tx.amount || 0).toFixed(2)}
      </span>
      <button
        onClick={() => setConfirmDeleteId(tx.id)}
  className="text-red-600 hover:text-red-800 font-medium transition"
      >
        ✕
      </button>
    </div>
  </li>
))}


              </ul>
            )}
          </div>
        )}

      </div>

      {confirmDeleteId !== null && (
  <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50 backdrop-blur-sm">
    <div className="bg-background dark:bg-background-dark rounded-2xl p-6 w-80 shadow-xl border border-gray-200 dark:border-gray-700 text-center transition">
      <h3 className="text-lg font-semibold mb-4 text-foreground">
        Delete this transaction?
      </h3>
      <div className="flex justify-center gap-4">
        <button
          className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-foreground hover:bg-gray-200 dark:hover:bg-gray-700 transition"
          onClick={() => setConfirmDeleteId(null)}
        >
          Cancel
        </button>
        <button
          className="px-4 py-2 rounded-lg bg-primary text-white hover:opacity-90 transition"
          onClick={async () => {
            try {
              await invoke("delete_transaction", { id: confirmDeleteId });
              await fetchTransactions();
            } catch (err) {
              console.error("Delete failed:", err);
            } finally {
              setConfirmDeleteId(null);
            }
          }}
        >
          Delete
        </button>
      </div>
    </div>
  </div>
)}


    </div>
  );
}
