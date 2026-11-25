"use client";

import React from "react";
import Link from "next/link";
import { FaPen, FaPlus, FaSpinner, FaTrash } from "react-icons/fa";

interface InventoryMobileCardsProps {
  products: any[];
  loading: boolean;
  role?: string | null;
  lastElementRef: (node: HTMLElement | null) => void;
  expandedImeiId: number | null;
  expandedImeis: any[];
  isLoadingImeis: boolean;
  onExpandImeis: (productId: number) => void;
  isAccessoriesSelected: boolean;
  quickSellData: Record<number, string>;
  quickSellingId: number | null;
  onQuickSellQtyChange: (productId: number, value: string) => void;
  onQuickSell: (product: any) => void;
  onEditClick: (product: any) => void;
  onDeleteClick: (productId: number) => void;
}

export default function InventoryMobileCards({
  products,
  loading,
  role,
  lastElementRef,
  expandedImeiId,
  expandedImeis,
  isLoadingImeis,
  onExpandImeis,
  isAccessoriesSelected,
  quickSellData,
  quickSellingId,
  onQuickSellQtyChange,
  onQuickSell,
  onEditClick,
  onDeleteClick,
}: InventoryMobileCardsProps) {
  if (products.length === 0 && !loading) {
    return (
      <div className="md:hidden bg-[#F8F6F2] p-4 rounded-xl border border-[#E5DFD7] text-center text-sm text-gray-500 font-medium">
        No products found.
      </div>
    );
  }

  return (
    <div className="md:hidden bg-[#F8F6F2] p-3 rounded-xl border border-[#E5DFD7] space-y-3">
      {products.map((product, index) => {
        const isLast = products.length === index + 1;
        const isLowStock = product.quantityInStock <= product.lowStockThreshold;
        const showSerialBtn =
          product.productType !== "quantity" && product.quantityInStock > 0;
        const showQuickSell =
          role === "owner" &&
          isAccessoriesSelected &&
          (product.category?.name?.toLowerCase() === "accessories" ||
            product.category?.parentCategory?.name?.toLowerCase() ===
              "accessories");

        return (
          <div
            key={product.id}
            ref={isLast ? lastElementRef : null}
            className="bg-white rounded-2xl border border-[#DED6CA] p-3.5 shadow-xs space-y-3"
          >
            {/* 1. Top Row: Product Name & Brand (left) + Stock Pill (right) */}
            <div className="flex items-start justify-between gap-2.5">
              <div className="min-w-0 flex-1">
                <p className="text-base font-extrabold text-gray-900 leading-snug break-words">
                  {product.name}
                </p>
                {product.brand && (
                  <p className="text-xs font-semibold text-gray-500 mt-0.5">
                    {product.brand}
                  </p>
                )}
              </div>

              <span
                className={`shrink-0 px-2.5 py-0.5 inline-flex items-center text-xs font-extrabold rounded-full tabular-nums ${
                  isLowStock
                    ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                    : "bg-[#EBFDE7] text-[#14532D] border border-[#81FF7A]/80 border-b-[#4ADE80] shadow-[0_2px_4px_rgba(20,83,45,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                }`}
              >
                Stock: {product.quantityInStock}
              </span>
            </div>

            {/* 2. Meta Row: Category (left) + View Serial Nos. (right) */}
            <div className="flex items-center justify-between gap-2 flex-wrap">
              {product.category?.name ? (
                <span className="text-[11px] font-bold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-full">
                  {product.category.name}
                </span>
              ) : (
                <span />
              )}

              {showSerialBtn && (
                <div className="relative imei-dropdown-container">
                  <button
                    type="button"
                    onClick={() => onExpandImeis(product.id)}
                    className="flex items-center justify-between gap-2 px-2.5 py-1 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-700 transition-colors"
                  >
                    <span>View Serial Nos.</span>
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-200 px-1.5 rounded">
                      {product.quantityInStock}
                    </span>
                  </button>

                  {expandedImeiId === product.id && (
                    <div className="mt-1 right-0 w-44 max-h-36 overflow-y-auto border border-slate-200 rounded-lg bg-white shadow-lg absolute z-20">
                      {isLoadingImeis ? (
                        <div className="px-2 py-2 text-[11px] text-center text-slate-500">
                          Loading...
                        </div>
                      ) : expandedImeis.length > 0 ? (
                        expandedImeis.map((unit: any) => (
                          <div
                            key={unit.id}
                            className="px-2.5 py-1.5 text-[11px] font-mono text-slate-700 border-b border-slate-100 last:border-0 hover:bg-slate-50"
                          >
                            {unit.imeiNumber}
                          </div>
                        ))
                      ) : (
                        <div className="px-2 py-2 text-[11px] text-center text-slate-500">
                          No units found
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 3. Pricing Strip */}
            <div
              className={`grid ${
                role === "owner"
                  ? "grid-cols-2 divide-x divide-[#E5DFD7]"
                  : "grid-cols-1"
              } bg-[#FAF8F5] rounded-xl py-2.5 border border-[#E5DFD7] text-center`}
            >
              {role === "owner" && (
                <div className="px-2">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                    Cost Price
                  </p>
                  <p className="text-xs font-extrabold text-gray-800 tabular-nums mt-0.5">
                    ₹{Number(product.costPrice).toLocaleString("en-IN")}
                  </p>
                </div>
              )}
              <div className="px-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Selling Price
                </p>
                <p className="text-xs font-black text-gray-900 tabular-nums mt-0.5">
                  ₹{Number(product.sellingPrice).toLocaleString("en-IN")}
                </p>
              </div>
            </div>

            {/* 4. Quick Sell (Accessories only, owner) */}
            {showQuickSell && (
              <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl p-2">
                <input
                  type="number"
                  min="1"
                  max={product.quantityInStock}
                  placeholder="Qty"
                  className="flex-1 bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-center"
                  value={quickSellData[product.id] || ""}
                  onChange={(e) =>
                    onQuickSellQtyChange(product.id, e.target.value)
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") onQuickSell(product);
                  }}
                  disabled={quickSellingId === product.id}
                />
                <button
                  type="button"
                  onClick={() => onQuickSell(product)}
                  disabled={
                    quickSellingId === product.id || !quickSellData[product.id]
                  }
                  className="bg-blue-600 hover:bg-blue-700 text-white font-extrabold px-4 py-1.5 rounded-lg text-xs transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
                >
                  {quickSellingId === product.id ? (
                    <FaSpinner className="animate-spin w-3 h-3" />
                  ) : (
                    "Sell"
                  )}
                </button>
              </div>
            )}

            {/* 5. Action Pills (Owner) */}
            {role === "owner" && (
              <div className="grid grid-cols-3 gap-2 pt-0.5">
                <Link
                  href={`/inventory/${product.id}/stock`}
                  className="w-full inline-flex items-center justify-center gap-1 h-9 px-2 text-xs font-bold text-[#16507A] bg-gradient-to-b from-[#F2F8FC] to-[#E2F0F9] border border-[#AED5EE] border-b-2 border-b-[#4E97C7] rounded-full shadow-2xs active:translate-y-px whitespace-nowrap"
                >
                  <FaPlus className="w-2.5 h-2.5 shrink-0" />
                  <span>Stock</span>
                </Link>
                <button
                  type="button"
                  onClick={() => onEditClick(product)}
                  className="w-full inline-flex items-center justify-center gap-1 h-9 px-2 text-xs font-bold text-[#7A5416] bg-gradient-to-b from-[#FCF7EB] to-[#F7ECD6] border border-[#E5CE9A] border-b-2 border-b-[#C69C4D] rounded-full shadow-2xs active:translate-y-px whitespace-nowrap"
                >
                  <FaPen className="w-2.5 h-2.5 shrink-0" />
                  <span>Edit</span>
                </button>
                <button
                  type="button"
                  onClick={() => onDeleteClick(product.id)}
                  className="w-full inline-flex items-center justify-center gap-1 h-9 px-2 text-xs font-bold text-[#882424] bg-gradient-to-b from-[#FDF5F5] to-[#F9E8E8] border border-[#E9C3C3] border-b-2 border-b-[#C06A6A] rounded-full shadow-2xs active:translate-y-px whitespace-nowrap"
                >
                  <FaTrash className="w-2.5 h-2.5 shrink-0" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
