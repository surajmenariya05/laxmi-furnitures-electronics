"use client";

import React from "react";
import { FaTimes, FaEdit, FaCheck } from "react-icons/fa";

interface BillingCartMobileCardsProps {
  cart: any[];
  editingRateCartItemId: string | null;
  tempRate: string;
  setTempRate: (val: string) => void;
  getItemEffectivePrice: (item: any) => number;
  startEditingRate: (item: any) => void;
  saveCustomRate: (cartItemId: string) => void;
  cancelCustomRate: () => void;
  updateSelectedUnit: (cartItemId: string, unitId: string) => void;
  updateCustomSerial: (cartItemId: string, serial: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  handleNumberKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal?: boolean) => void;
}

export default function BillingCartMobileCards({
  cart,
  editingRateCartItemId,
  tempRate,
  setTempRate,
  getItemEffectivePrice,
  startEditingRate,
  saveCustomRate,
  cancelCustomRate,
  updateSelectedUnit,
  updateCustomSerial,
  updateQuantity,
  removeFromCart,
  handleNumberKeyDown,
}: BillingCartMobileCardsProps) {
  return (
    <div className="divide-y divide-gray-200 bg-white">
      {cart.map((item) => {
        const effectivePrice = getItemEffectivePrice(item);
        const isConfigured =
          item.configuredPrice !== undefined &&
          item.configuredPrice !== item.product.sellingPrice;
        const isFurniture =
          item.product.department === "FURNITURE" ||
          item.product.productType === "quantity";
        const maxStock = item.isExisting
          ? (item.product.quantityInStock || 0) + (item.originalQuantity || 0)
          : item.product.quantityInStock;

        return (
          <div key={item.cartItemId} className="p-3.5 space-y-2.5">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="font-bold text-gray-900 text-sm leading-snug">
                  {item.product.name}
                </div>
                <span
                  className={`mt-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9.5px] font-black uppercase tracking-wider ${
                    isFurniture
                      ? "bg-[#235347] text-white"
                      : "bg-[#093F52] text-white"
                  }`}
                >
                  {isFurniture ? "FURNITURE" : "ELECTRONICS"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => removeFromCart(item.cartItemId)}
                className="text-xs font-bold text-rose-600 bg-rose-50 px-2.5 py-1 rounded-lg border border-rose-200 shrink-0"
              >
                Remove
              </button>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              {/* Rate */}
              {editingRateCartItemId === item.cartItemId ? (
                <div className="flex items-center gap-1 bg-blue-50 p-1 rounded-lg border border-blue-300">
                  <span className="text-xs font-bold text-gray-600">₹</span>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    autoFocus
                    value={tempRate}
                    onChange={(e) => setTempRate(e.target.value)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCustomRate(item.cartItemId);
                      if (e.key === "Escape") cancelCustomRate();
                      handleNumberKeyDown(e, true);
                    }}
                    className="w-20 px-1.5 py-1 text-xs font-bold bg-white border border-blue-400 rounded"
                  />
                  <button
                    type="button"
                    onClick={() => saveCustomRate(item.cartItemId)}
                    className="p-1 text-emerald-600"
                  >
                    <FaCheck className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={cancelCustomRate}
                    className="p-1 text-gray-400"
                  >
                    <FaTimes className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-bold text-sm ${
                      isConfigured ? "text-blue-700" : "text-gray-900"
                    }`}
                  >
                    ₹{effectivePrice}
                  </span>
                  <button
                    type="button"
                    onClick={() => startEditingRate(item)}
                    className="p-1 text-gray-400 hover:text-blue-600"
                    title="Edit unit price"
                  >
                    <FaEdit className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Qty / Serial */}
              <div>
                {item.product.productType !== "quantity" ? (
                  item.isExisting ? (
                    <span className="inline-flex px-2 py-1 rounded text-[11px] font-mono font-bold bg-gray-100 text-gray-800 border border-gray-200">
                      SN: {item.productUnit?.imeiNumber || item.selectedUnitId || "Assigned"}
                    </span>
                  ) : item.product.units &&
                    item.product.units.length > 0 &&
                    !item.useManualSerial ? (
                    <select
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs max-w-[140px] font-medium"
                      value={item.selectedUnitId}
                      onChange={(e) => updateSelectedUnit(item.cartItemId, e.target.value)}
                    >
                      {item.product.units?.map((u: any) => (
                        <option key={u.id} value={u.id}>
                          {u.imeiNumber}
                        </option>
                      ))}
                      <option value="__MANUAL__">+ Manual Serial</option>
                    </select>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter Serial No..."
                      value={item.customSerialNumber || ""}
                      onChange={(e) => updateCustomSerial(item.cartItemId, e.target.value)}
                      className="border border-gray-300 rounded-md px-2 py-1 text-xs w-32 font-mono font-semibold"
                    />
                  )
                ) : (
                  <div className="inline-flex items-center rounded-lg border border-gray-300 bg-white overflow-hidden shadow-2xs">
                    <button
                      type="button"
                      disabled={item.quantity <= 1}
                      onClick={() =>
                        updateQuantity(item.cartItemId, Math.max(1, item.quantity - 1))
                      }
                      className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-black text-sm border-r border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Decrease quantity"
                    >
                      −
                    </button>
                    <input
                      type="number"
                      min="1"
                      max={maxStock}
                      className="w-10 h-7 text-xs text-center font-extrabold text-gray-900 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.cartItemId,
                          Math.min(maxStock, Math.max(1, parseInt(e.target.value) || 1))
                        )
                      }
                      onKeyDown={(e) => handleNumberKeyDown(e, false)}
                      onWheel={(e) => (e.target as HTMLInputElement).blur()}
                    />
                    <button
                      type="button"
                      disabled={item.quantity >= maxStock}
                      onClick={() =>
                        updateQuantity(
                          item.cartItemId,
                          Math.min(maxStock, item.quantity + 1)
                        )
                      }
                      className="w-7 h-7 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 font-black text-sm border-l border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed transition"
                      aria-label="Increase quantity"
                    >
                      +
                    </button>
                  </div>
                )}
              </div>

              <div className="font-extrabold text-gray-900 text-sm">
                ₹{effectivePrice * item.quantity}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
