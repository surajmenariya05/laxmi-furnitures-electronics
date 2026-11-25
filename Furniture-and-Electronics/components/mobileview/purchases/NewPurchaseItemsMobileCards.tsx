"use client";

import React, { useState } from "react";
import { FaChevronDown, FaTrash } from "react-icons/fa";
import { Department, PurchaseItemInput } from "@/types/purchase";
import CatalogProductPicker from "@/components/dashboard/purchases/CatalogProductPicker";

interface CatalogCategory {
  id: number;
  name: string;
  department?: string;
}

interface NewPurchaseItemsMobileCardsProps {
  items: PurchaseItemInput[];
  department: Department;
  categories: CatalogCategory[];
  onSelectProduct: (idx: number, product: any) => void;
  onItemChange: (idx: number, field: keyof PurchaseItemInput, value: any) => void;
  onRemoveItemRow: (idx: number) => void;
}

export default function NewPurchaseItemsMobileCards({
  items,
  department,
  categories,
  onSelectProduct,
  onItemChange,
  onRemoveItemRow,
}: NewPurchaseItemsMobileCardsProps) {
  const [openCatIdx, setOpenCatIdx] = useState<number | null>(null);

  return (
    <div className="md:hidden p-2.5 space-y-2.5 bg-[#F8F6F2]">
      {items.map((item, idx) => {
        const selectedCat = categories.find(
          (c) => String(c.id) === String(item.categoryId || "")
        );

        return (
          <div
            key={idx}
            className="bg-white rounded-xl border border-[#CBD8E8] p-3 space-y-2.5 shadow-2xs"
          >
            {/* Card Header: Item # Badge + Remove */}
            <div className="flex items-center justify-between gap-2">
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-50 text-blue-700 border border-blue-100">
                Item #{idx + 1}
              </span>
              {items.length > 1 && (
                <button
                  type="button"
                  onClick={() => onRemoveItemRow(idx)}
                  className="p-1.5 rounded-lg border border-red-200 bg-red-50/50 text-red-500 hover:text-red-700 hover:bg-red-100 transition"
                  title="Remove item"
                >
                  <FaTrash className="w-3 h-3" />
                </button>
              )}
            </div>

            {/* Catalog Link */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Catalog Link (Optional)
              </label>
              <CatalogProductPicker
                selectedProductId={item.productId}
                selectedProductName={item.itemName}
                department={department}
                onSelectProduct={(product) => onSelectProduct(idx, product)}
              />
            </div>

            {/* Item Name */}
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                Item Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Teak Wood Double Bed"
                value={item.itemName}
                onChange={(e) => onItemChange(idx, "itemName", e.target.value)}
                className="w-full py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs font-semibold text-gray-900 focus:ring-1 focus:ring-blue-500 focus:outline-none"
              />
            </div>

            {/* Category (& Warranty for Electronics) */}
            <div
              className={`grid gap-2 ${
                department === "ELECTRONICS" ? "grid-cols-12" : "grid-cols-1"
              }`}
            >
              <div
                className={`relative ${
                  department === "ELECTRONICS" ? "col-span-8" : ""
                }`}
              >
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Category *
                </label>
                <button
                  type="button"
                  onClick={() =>
                    setOpenCatIdx((prev) => (prev === idx ? null : idx))
                  }
                  className="w-full flex items-center justify-between gap-2 py-1.5 px-2.5 border border-gray-300 rounded-lg text-xs font-medium bg-white text-left focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <span
                    className={`truncate ${
                      selectedCat ? "text-gray-900 font-semibold" : "text-gray-400"
                    }`}
                  >
                    {selectedCat ? selectedCat.name : "-- Category --"}
                  </span>
                  <FaChevronDown
                    className={`w-2.5 h-2.5 text-gray-400 shrink-0 transition-transform ${
                      openCatIdx === idx ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {openCatIdx === idx && (
                  <>
                    <div
                      className="fixed inset-0 z-20"
                      onClick={() => setOpenCatIdx(null)}
                    />
                    <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                      <button
                        type="button"
                        onClick={() => {
                          onItemChange(idx, "categoryId", "");
                          setOpenCatIdx(null);
                        }}
                        className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 ${
                          !item.categoryId
                            ? "bg-blue-50 font-bold text-blue-700"
                            : "text-gray-400"
                        }`}
                      >
                        -- Category --
                      </button>
                      {categories.map((cat) => {
                        const isSelected =
                          String(cat.id) === String(item.categoryId || "");
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => {
                              onItemChange(idx, "categoryId", String(cat.id));
                              setOpenCatIdx(null);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs hover:bg-blue-50 truncate ${
                              isSelected
                                ? "bg-blue-50 font-bold text-blue-700"
                                : "text-gray-800 font-medium"
                            }`}
                          >
                            {cat.name}
                          </button>
                        );
                      })}
                    </div>
                  </>
                )}
              </div>

              {department === "ELECTRONICS" && (
                <div className="col-span-4">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                    Warranty (Mo)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="12"
                    value={
                      item.warrantyMonths !== undefined ? item.warrantyMonths : ""
                    }
                    onWheel={(e) => e.currentTarget.blur()}
                    onChange={(e) =>
                      onItemChange(idx, "warrantyMonths", e.target.value)
                    }
                    className="w-full py-1.5 px-2 border border-gray-300 rounded-lg text-xs font-bold text-center font-mono [appearance:textfield]"
                  />
                </div>
              )}
            </div>

            {/* Pricing Strip: Cost/Unit | Qty | Line Total */}
            <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-lg p-2.5 grid grid-cols-12 gap-2 items-end">
              <div className="col-span-5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Cost/Unit (₹)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  placeholder="0"
                  value={item.unitCostPrice}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) =>
                    onItemChange(idx, "unitCostPrice", e.target.value)
                  }
                  className="w-full py-1.5 px-2 bg-white border border-gray-300 rounded-md text-xs font-mono font-bold text-right [appearance:textfield]"
                />
              </div>

              <div className="col-span-3">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1 text-center">
                  Qty
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  placeholder="1"
                  value={item.quantity}
                  onWheel={(e) => e.currentTarget.blur()}
                  onChange={(e) => onItemChange(idx, "quantity", e.target.value)}
                  className="w-full py-1.5 px-1.5 bg-white border border-gray-300 rounded-md text-xs font-bold text-center [appearance:textfield]"
                />
              </div>

              <div className="col-span-4 text-right">
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-1">
                  Line Total
                </p>
                <p className="font-mono font-black text-sm text-gray-900 py-1 tabular-nums">
                  ₹{item.lineTotal.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
