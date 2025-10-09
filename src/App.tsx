import React, { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

type Transaction = [number, string, number, string];

export default function App() {
  const [activeTab, setActiveTab] = useState<"overview" | "transactions" | "settings">("overview");

  // --- Transaction State ---
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [desc, setDesc] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  const fetchTransactions = async () => {
    try {
      const list = await invoke<Transaction[]>("get_transactions");
      setTransactions(list);
    } catch (err) {
      console.error("Failed to fetch transactions:", err);
    }
  };

  useEffect(() => {
    if (activeTab === "transactions") {
      fetchTransactions();
    }
  }, [activeTab]);

  const addTransaction = async () => {
    if (!desc || !amount || !date) return alert("Fill all fields");
    await invoke("add_transaction", {
      description: desc,
      amount: parseFloat(amount),
      date,
    });
    setDesc("");
    setAmount("");
    setDate("");
    fetchTransactions();
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
              Welcome to TOMI — your personal finance tracker.
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
        </div>)}

      </div>
    </div>
  );
}
