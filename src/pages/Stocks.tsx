import React, { useEffect, useState } from "react";
import { invoke } from "@tauri-apps/api/core";

type StockRow = {
  id: number;
  symbol: string;
  name?: string;
  price?: number;
  change?: number;
};

export default function StocksPage() {
  const [stocks, setStocks] = useState<StockRow[]>([]);
  const [newSymbol, setNewSymbol] = useState("");
  const [loading, setLoading] = useState(false);
  const [newStock, setNewStock] = useState("");

  const fetchWatchlist = async () => {
    try {
      const list = await invoke<StockRow[]>("get_stocks");
      setStocks(list);
    } catch (e) {
      console.error("Failed to load watchlist:", e);
    }
  };

  const addStock = async () => {
    if (!newStock.trim()) return;
    try {
      await invoke("add_stock", { symbol: newStock.trim() });
      setNewStock("");
      await fetchWatchlist();
      await fetchStockPrices();
    } catch (err) {
      console.error("Add stock failed:", err);
    }
  };

  const deleteStock = async (id: number) => {
    try {
      await invoke("delete_stock", { id });
      await fetchWatchlist();
    } catch (err) {
      console.error("Delete stock failed:", err);
    }
  };


  useEffect(() => {
    fetchWatchlist();
  }, []);

  useEffect(() => {
    if (stocks.length > 0) fetchStockPrices();
  }, [stocks.length]);


  const fetchStockPrices = async () => {
  if (stocks.length === 0) return;
  setLoading(true);
  try {
    const symbols = stocks.map((s) => s.symbol);
    const data = await invoke<{
      symbol: string;
      name: string;
      price: number;
      change: number;
    }[]>("fetch_stock_data", { symbols });
    const updated = stocks.map((s) => {
      const q = data.find((d) => d.symbol === s.symbol);
      return q
        ? { ...s, name: q.name, price: q.price, change: q.change }
        : s;
    });
    console.log("Fetched stock data:", data);
    setStocks(updated);
  } catch (err) {
    console.error("Failed to fetch stock data:", err);
  } finally {
    setLoading(false);
  }
};

  type PortfolioEntry = {
    id: number;
    symbol: string;
    shares: number;
    cost_basis: number;
    price?: number;
    change?: number;
  };

  const [portfolio, setPortfolio] = useState<PortfolioEntry[]>([]);
  const [shares, setShares] = useState("");
  const [costBasis, setCostBasis] = useState("");

  // --- fetch portfolio ---
  const fetchPortfolio = async () => {
    try {
      const list = await invoke<PortfolioEntry[]>("get_portfolio");
      setPortfolio(list);
    } catch (e) {
      console.error("Failed to fetch portfolio:", e);
    }
  };

  // --- add entry ---
  const addPortfolio = async () => {
    if (!newSymbol || !shares || !costBasis) return alert("Fill all fields");
    await invoke("add_portfolio_entry", {
      symbol: newSymbol.trim().toUpperCase(),
      shares: parseFloat(shares),
      costBasis: parseFloat(costBasis),
      purchaseDate: new Date().toISOString().split('T')[0], // Use current date
    });
    setNewSymbol("");
    setShares("");
    setCostBasis("");
    await fetchPortfolio();
  };

  // --- delete entry ---
  const deletePortfolio = async (id: number) => {
    await invoke("delete_portfolio_entry", { id });
    await fetchPortfolio();
  };

  useEffect(() => {
    fetchPortfolio();
  }, []);

    const priceMap = Object.fromEntries(
    stocks.map((s) => [s.symbol.toUpperCase(), s.price ?? 0])
  );

  return (
    <div>
      <h2 className="text-xl font-semibold mb-4">Stocks</h2>

      {/* Add stock input */}
      <div className="flex gap-2 mb-4">
        <input
          className="flex-1 p-2 border border-gray-300 rounded"
          placeholder="Enter symbol (e.g. AAPL)"
          value={newStock}
          onChange={(e) => setNewStock(e.target.value.toUpperCase())}
        />
        <button
          className="px-4 py-2 rounded bg-primary text-white hover:opacity-90 transition"
          onClick={addStock}
        >
          Add
        </button>
      </div>

      {stocks.length === 0 ? (
        <p className="text-gray-500 italic">No stocks being monitored yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full border-collapse">
            <thead>
              <tr className="bg-gray-100 dark:bg-gray-800 text-left">
                <th className="p-3 font-semibold">Symbol</th>
                <th className="p-3 font-semibold">Name</th>
                <th className="p-3 font-semibold">Price</th>
                <th className="p-3 font-semibold">Change</th>
                <th className="p-3"></th>
              </tr>
            </thead>
            <tbody>
              {stocks.map((s) => (
                <tr
                  key={s.id}
                  className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                >
                  <td className="p-3 font-medium text-primary">{s.symbol}</td>
                  <td className="p-3">{s.name || "-"}</td>
                  <td className="p-3">
                    {s.price !== undefined ? `$${s.price.toFixed(2)}` : "—"}
                  </td>
                  <td
                    className={`p-3 font-semibold ${
                      s.change && s.change >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {s.change !== undefined
                      ? `${s.change >= 0 ? "+" : ""}${s.change.toFixed(2)}%`
                      : "—"}
                  </td>
                  <td className="p-3 text-right">
                    <button
                      className="text-red-600 hover:text-red-800"
                      onClick={() => deleteStock(s.id)}
                    >
                      ✕
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && (
        <p className="text-sm text-gray-400 mt-2">Fetching latest prices...</p>
      )}

{/* --- PORTFOLIO SECTION --- */}
<div className="mt-12">
  <h2 className="text-xl font-semibold mb-4">My Portfolio</h2>

  {/* Add portfolio form */}
  <div className="flex gap-2 mb-4">
    <input
      className="flex-1 p-2 border border-gray-300 rounded"
      placeholder="Symbol (e.g. TSLA)"
      value={newSymbol}
      onChange={(e) => setNewSymbol(e.target.value.toUpperCase())}
    />
    <input
      className="w-28 p-2 border border-gray-300 rounded"
      placeholder="Shares"
      type="number"
      step="0.01"
      value={shares}
      onChange={(e) => setShares(e.target.value)}
    />
    <input
      className="w-28 p-2 border border-gray-300 rounded"
      placeholder="Cost"
      type="number"
      step="0.01"
      value={costBasis}
      onChange={(e) => setCostBasis(e.target.value)}
    />
    <button
      className="px-4 py-2 bg-primary text-white rounded hover:opacity-90 transition"
      onClick={addPortfolio}
    >
      Add
    </button>
  </div>

  {portfolio.length === 0 ? (
    <p className="text-gray-500 italic">No portfolio entries yet.</p>
  ) : (
    <div className="space-y-8">
      {(() => {
        // ✅ Group all portfolio entries by symbol
        const grouped = portfolio.reduce((acc, entry) => {
          const sym = entry.symbol.toUpperCase();
          if (!acc[sym]) acc[sym] = [];
          acc[sym].push(entry);
          return acc;
        }, {} as Record<string, typeof portfolio>);

        // Accumulators for total portfolio
        let totalValue = 0;
        let totalGain = 0;

        return Object.entries(grouped).map(([symbol, entries]) => {
          const totalShares = entries.reduce((sum, e) => sum + e.shares, 0);
          const totalCost = entries.reduce(
            (sum, e) => sum + e.shares * e.cost_basis,
            0
          );
          const avgCost = totalCost / totalShares;
          const currentPrice = priceMap[symbol] ?? 0;
          const value = currentPrice * totalShares;
          const gain = (currentPrice - avgCost) * totalShares;

          totalValue += value;
          totalGain += gain;

          return (
            <div
              key={symbol}
              className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden shadow-sm"
            >
              {/* Symbol Header */}
              <div className="bg-gray-100 dark:bg-gray-800 px-4 py-2 font-semibold text-lg text-primary border-b border-gray-300">
                {symbol}
              </div>

              {/* Individual entries */}
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-gray-50 dark:bg-gray-900 text-left">
                    <th className="p-3 font-semibold">Shares</th>
                    <th className="p-3 font-semibold">Cost Basis</th>
                    <th className="p-3 font-semibold">Value</th>
                    <th className="p-3 font-semibold">Gain/Loss</th>
                    <th className="p-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((e) => {
                    const val = e.shares * currentPrice;
                    const g = (currentPrice - e.cost_basis) * e.shares;
                    return (
                      <tr
                        key={e.id}
                        className="border-t border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                      >
                        <td className="p-3">{e.shares.toFixed(2)}</td>
                        <td className="p-3">${e.cost_basis.toFixed(2)}</td>
                        <td className="p-3">${val.toFixed(2)}</td>
                        <td
                          className={`p-3 ${
                            g >= 0 ? "text-green-600" : "text-red-600"
                          }`}
                        >
                          {g >= 0 ? "+" : ""}
                          {g.toFixed(2)}
                        </td>
                        <td className="p-3 text-right">
                          <button
                            className="text-red-600 hover:text-red-800"
                            onClick={() => deletePortfolio(e.id)}
                          >
                            ✕
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {/* Subtotal row */}
                  <tr className="bg-gray-50 dark:bg-gray-900 font-semibold border-t">
                    <td className="p-3 text-primary">
                      Total: {totalShares.toFixed(2)}
                    </td>
                    <td className="p-3">${avgCost.toFixed(2)}</td>
                    <td className="p-3">${value.toFixed(2)}</td>
                    <td
                      className={`p-3 ${
                        gain >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {gain >= 0 ? "+" : ""}
                      {gain.toFixed(2)}
                    </td>
                    <td></td>
                  </tr>
                </tbody>
              </table>
            </div>
          );
        }).concat([
          // ✅ Grand total section at bottom
          <div
            key="summary"
            className="border-t-4 border-gray-300 pt-4 text-right font-semibold text-lg"
          >
            <div>
              Total Portfolio Value: ${totalValue.toFixed(2)}{" "}
              <span
                className={`${
                  totalGain >= 0 ? "text-green-600" : "text-red-600"
                }`}
              >
                ({totalGain >= 0 ? "+" : ""}
                {totalGain.toFixed(2)})
              </span>
            </div>
          </div>,
        ]);
      })()}
    </div>
  )}
</div>

    </div>

  );
}
