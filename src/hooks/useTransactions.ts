import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";

export type Transaction = {
  id: number;
  description: string;
  amount: number;
  date: string;
};

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const list = await invoke<Transaction[]>("get_transactions");
      setTransactions(list);
    } catch (err) {
      console.error("Error fetching transactions:", err);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (description: string, amount: number, date: string) => {
    await invoke("add_transaction", { description, amount, date });
    await fetchTransactions();
  };

  const deleteTransaction = async (id: number) => {
    await invoke("delete_transaction", { id });
    await fetchTransactions();
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return { transactions, loading, addTransaction, deleteTransaction, fetchTransactions };
}
