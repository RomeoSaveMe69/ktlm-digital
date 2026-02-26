"use client";

/** Seller Product: add product (dropdown from admin products), price + stock; list. UI shell. */

import { useState } from "react";

const DUMMY_ADMIN_PRODUCTS = [
  { id: "P1", game: "PUBG Mobile", name: "60 UC" },
  { id: "P2", game: "PUBG Mobile", name: "325 UC" },
  { id: "P3", game: "Mobile Legends", name: "50 Diamonds" },
];

const DUMMY_MY_PRODUCTS = [
  { id: "SP1", product: "60 UC", price: "4,500", stock: "10" },
  { id: "SP2", product: "325 UC", price: "12,000", stock: "5" },
];

export default function SellerProductPage() {
  const [selectedProduct, setSelectedProduct] = useState("");
  const [price, setPrice] = useState("");
  const [stock, setStock] = useState("");

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Product</h2>
        <p className="text-sm text-slate-500">Admin ချပေးထားသော Product များကိုသာ Dropdown ဖြင့်ရွေး၍ ဈေးနှုန်းသတ်မှတ်ရန်</p>
      </div>

      <section className="rounded-xl border border-slate-700/60 bg-slate-800/50 p-6">
        <h3 className="mb-4 text-sm font-medium text-slate-400">Add Product</h3>
        <form
          className="flex flex-wrap gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            setPrice("");
            setStock("");
          }}
        >
          <select
            value={selectedProduct}
            onChange={(e) => setSelectedProduct(e.target.value)}
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            <option value="">Select Product (from Admin list)</option>
            {DUMMY_ADMIN_PRODUCTS.map((p) => (
              <option key={p.id} value={p.id}>
                {p.game} — {p.name}
              </option>
            ))}
          </select>
          <input
            type="text"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
            placeholder="Price (MMK)"
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <input
            type="text"
            value={stock}
            onChange={(e) => setStock(e.target.value)}
            placeholder="Stock"
            className="rounded-lg border border-slate-600 bg-slate-800 px-4 py-2.5 text-slate-100 placeholder:text-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
          >
            Add Product
          </button>
        </form>
      </section>

      <section>
        <h3 className="mb-4 text-sm font-medium text-slate-400">My Products</h3>
        <div className="overflow-hidden rounded-xl border border-slate-700/60 bg-slate-800/50">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-700/80 bg-slate-800/80">
                <th className="px-4 py-3 font-medium text-slate-400">Product</th>
                <th className="px-4 py-3 font-medium text-slate-400">Price (MMK)</th>
                <th className="px-4 py-3 font-medium text-slate-400">Stock</th>
                <th className="px-4 py-3 font-medium text-slate-400">Action</th>
              </tr>
            </thead>
            <tbody>
              {DUMMY_MY_PRODUCTS.map((row) => (
                <tr
                  key={row.id}
                  className="border-b border-slate-700/40 transition hover:bg-slate-800/60"
                >
                  <td className="px-4 py-3 font-medium text-slate-200">{row.product}</td>
                  <td className="px-4 py-3 text-slate-200">{row.price}</td>
                  <td className="px-4 py-3 text-slate-400">{row.stock}</td>
                  <td className="px-4 py-3">
                    <button type="button" className="text-amber-400 hover:text-amber-300">
                      Edit
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
