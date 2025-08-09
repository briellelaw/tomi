import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';

export default function App() {
  const [transactions, setTransactions] = useState([]);
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState('');

  const fetchTransactions = async () => {
    const list = await invoke('get_transactions');
    setTransactions(list);
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const addTransaction = async () => {
    if (!desc || !amount || !date) return alert('Fill all fields');
    await invoke('add_transaction', {
      description: desc,
      amount: parseFloat(amount),
      date,
    });
    setDesc('');
    setAmount('');
    setDate('');
    fetchTransactions();
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 font-sans max-w-xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-indigo-600">Finance Tracker</h1>
      
      <div className="mb-4 space-y-2">
        <input
          className="w-full p-2 border rounded"
          placeholder="Description"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          placeholder="Amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          className="w-full p-2 border rounded"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <button
          className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700"
          onClick={addTransaction}
        >
          Add Transaction
        </button>
      </div>

      <h2 className="text-xl font-semibold mb-2">Transactions</h2>
      <ul>
        {transactions.map(([id, description, amount, date]) => (
          <li
            key={id}
            className="bg-white p-3 rounded shadow mb-2 flex justify-between"
          >
            <div>
              <div className="font-medium">{description}</div>
              <div className="text-sm text-gray-500">{date}</div>
            </div>
            <div className={`font-semibold ${amount < 0 ? 'text-red-600' : 'text-green-600'}`}>
              ${amount.toFixed(2)}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

