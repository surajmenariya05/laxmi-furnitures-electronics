"use client";

import React from "react";
import { FaTimes, FaEdit, FaCheck, FaUndo, FaCouch, FaTv } from "react-icons/fa";
import BillingCartMobileCards from "@/components/mobileview/billing/BillingCartMobileCards";

interface BillingCartTableProps {
  cart: any[];
  editingRateCartItemId: string | null;
  tempRate: string;
  setTempRate: (val: string) => void;
  getItemEffectivePrice: (item: any) => number;
  startEditingRate: (item: any) => void;
  saveCustomRate: (cartItemId: string) => void;
  cancelCustomRate: () => void;
  resetToCatalogRate: (cartItemId: string) => void;
  updateSelectedUnit: (cartItemId: string, unitId: string) => void;
  updateCustomSerial: (cartItemId: string, serial: string) => void;
  updateQuantity: (cartItemId: string, qty: number) => void;
  removeFromCart: (cartItemId: string) => void;
  handleNumberKeyDown: (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal?: boolean) => void;
}

export default function BillingCartTable({
  cart,
  editingRateCartItemId,
  tempRate,
  setTempRate,
  getItemEffectivePrice,
  startEditingRate,
  saveCustomRate,
  cancelCustomRate,
  resetToCatalogRate,
  updateSelectedUnit,
  updateCustomSerial,
  updateQuantity,
  removeFromCart,
  handleNumberKeyDown,
}: BillingCartTableProps) {
  return (
    <div className="flex-1 overflow-y-auto border border-gray-200 rounded-lg mb-5 min-h-[150px]">
      {cart.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 py-8">
          <span className="text-3xl mb-2">🛒</span>
          <span className="text-sm font-semibold">Cart is currently empty</span>
          <span className="text-xs text-gray-400 mt-1">
            Search above to add products to the invoice
          </span>
        </div>
      ) : (
        <>
          {/* Mobile Cart Cards (< sm) */}
          <div className="sm:hidden">
            <BillingCartMobileCards
              cart={cart}
              editingRateCartItemId={editingRateCartItemId}
              tempRate={tempRate}
              setTempRate={setTempRate}
              getItemEffectivePrice={getItemEffectivePrice}
              startEditingRate={startEditingRate}
              saveCustomRate={saveCustomRate}
              cancelCustomRate={cancelCustomRate}
              updateSelectedUnit={updateSelectedUnit}
              updateCustomSerial={updateCustomSerial}
              updateQuantity={updateQuantity}
              removeFromCart={removeFromCart}
              handleNumberKeyDown={handleNumberKeyDown}
            />
          </div>

          {/* Desktop Cart Table (sm+) */}
          <div className="hidden sm:block">
            <table className="w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">
                Item
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">
                Unit Price
              </th>
              <th className="px-3 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">
                Qty / Serial No.
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase">
                Total
              </th>
              <th className="px-3 py-2.5 text-right text-xs font-bold text-gray-500 uppercase"></th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200 text-sm">
            {cart.map((item) => {
              const effectivePrice = getItemEffectivePrice(item);
              const isConfigured =
                item.configuredPrice !== undefined &&
                item.configuredPrice !== item.product.sellingPrice;
              const isFurniture =
                item.product.department === "FURNITURE" ||
                item.product.productType === "quantity";

              return (
                <tr key={item.cartItemId} className="hover:bg-gray-50/50">
                  {/* Item Details with 3D Pill Badge */}
                  <td className="px-3 py-3 max-w-[175px]">
                    <div
                      className="font-bold text-gray-900 truncate cursor-help"
                      title={item.product.name}
                    >
                      {item.product.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          isFurniture
                            ? "bg-[#235347] text-white border border-[#2F6859] border-b-[#14352D] shadow-[0_2px_4px_rgba(20,83,45,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]"
                            : "bg-[#093F52] text-white border border-[#105269] border-b-[#052531] shadow-[0_2px_4px_rgba(9,63,82,0.2),inset_0_1px_0_rgba(255,255,255,0.35)]"
                        }`}
                      >
                        {isFurniture ? (
                          <>
                            <FaCouch className="w-2.5 h-2.5" />
                            <span>FURNITURE</span>
                          </>
                        ) : (
                          <>
                            <FaTv className="w-2.5 h-2.5" />
                            <span>ELECTRONICS</span>
                          </>
                        )}
                      </span>
                    </div>
                  </td>

                  {/* Configurable Unit Price Column */}
                  <td className="px-4 py-3 whitespace-nowrap text-gray-900 font-medium">
                    {editingRateCartItemId === item.cartItemId ? (
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1 bg-blue-50/90 p-1.5 rounded-lg border border-blue-300 shadow-xs">
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
                            className="w-24 px-2 py-1 text-xs font-bold text-gray-900 bg-white border border-blue-400 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            placeholder="Rate"
                          />
                          <button
                            type="button"
                            onClick={() => saveCustomRate(item.cartItemId)}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-100/60 rounded transition"
                            title="Apply Rate (Enter)"
                          >
                            <FaCheck className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={cancelCustomRate}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-200/60 rounded transition"
                            title="Cancel (Esc)"
                          >
                            <FaTimes className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        {item.product.costPrice &&
                          parseFloat(tempRate) > 0 &&
                          parseFloat(tempRate) < parseFloat(item.product.costPrice) && (
                            <span className="text-[9.5px] font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                              ⚠️ Below cost: ₹{item.product.costPrice}
                            </span>
                          )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 group">
                        <div className="flex flex-col">
                          <span
                            className={`font-bold text-sm ${
                              isConfigured ? "text-blue-700" : "text-gray-900"
                            }`}
                          >
                            ₹{effectivePrice}
                          </span>
                          {isConfigured && (
                            <span className="text-[10px] text-gray-400 line-through">
                              MRP ₹{item.product.sellingPrice}
                            </span>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={() => startEditingRate(item)}
                          className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                          title="Configure unit price"
                        >
                          <FaEdit className="w-3.5 h-3.5" />
                        </button>
                        {isConfigured && (
                          <button
                            type="button"
                            onClick={() => resetToCatalogRate(item.cartItemId)}
                            className="p-1 text-gray-300 hover:text-amber-600 hover:bg-amber-50 rounded-md transition"
                            title="Reset to catalog price"
                          >
                            <FaUndo className="w-2.5 h-2.5" />
                          </button>
                        )}
                      </div>
                    )}
                  </td>

                  {/* Unit / Qty / Serial No. Selection */}
                  <td className="px-4 py-3 whitespace-nowrap">
                    {item.product.productType !== "quantity" ? (
                      item.isExisting ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-gray-100 text-gray-800 border border-gray-200">
                          SN: {item.productUnit?.imeiNumber || item.selectedUnitId || "Assigned"}
                        </span>
                      ) : item.product.units &&
                        item.product.units.length > 0 &&
                        !item.useManualSerial ? (
                        <select
                          className="border border-gray-300 rounded-md px-2 py-1 text-xs max-w-[180px] font-medium focus:ring-1 focus:ring-blue-500"
                          value={item.selectedUnitId}
                          onChange={(e) => updateSelectedUnit(item.cartItemId, e.target.value)}
                        >
                          {item.product.units?.map((u: any) => {
                            const isAlreadySelected = cart.some(
                              (cItem) =>
                                cItem.product.id === item.product.id &&
                                cItem.cartItemId !== item.cartItemId &&
                                cItem.selectedUnitId === u.id.toString()
                            );
                            return (
                              <option key={u.id} value={u.id} disabled={isAlreadySelected}>
                                {u.imeiNumber} {isAlreadySelected ? "(Already Selected)" : ""}
                              </option>
                            );
                          })}
                          <option value="__MANUAL__">+ Enter Serial No. Manually</option>
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            placeholder="Enter Serial No..."
                            value={item.customSerialNumber || ""}
                            onChange={(e) => updateCustomSerial(item.cartItemId, e.target.value)}
                            className={`border rounded-md px-2 py-1 text-xs w-32 font-mono font-semibold focus:outline-none focus:ring-1 ${
                              !item.customSerialNumber?.trim()
                                ? "border-amber-400 bg-amber-50/40 focus:ring-amber-500"
                                : "border-gray-300 focus:ring-blue-500"
                            }`}
                          />
                          {item.product.units && item.product.units.length > 0 && (
                            <button
                              type="button"
                              onClick={() =>
                                updateSelectedUnit(
                                  item.cartItemId,
                                  item.product.units[0].id.toString()
                                )
                              }
                              className="text-[10px] font-bold text-blue-600 hover:underline"
                              title="Select from existing serial numbers"
                            >
                              List
                            </button>
                          )}
                        </div>
                      )
                    ) : (
                      (() => {
                        const maxStock = item.isExisting
                          ? (item.product.quantityInStock || 0) + (item.originalQuantity || 0)
                          : item.product.quantityInStock;
                        return (
                          <input
                            type="number"
                            min="1"
                            max={maxStock}
                            className="border border-gray-300 rounded-md px-2 py-1 text-xs w-16 text-center font-semibold focus:ring-1 focus:ring-blue-500"
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
                        );
                      })()
                    )}
                  </td>

                  {/* Line Total */}
                  <td className="px-4 py-3 whitespace-nowrap font-bold text-gray-900 text-right">
                    ₹{effectivePrice * item.quantity}
                  </td>

                  <td className="px-4 py-3 whitespace-nowrap text-right text-xs">
                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="text-red-600 hover:text-red-900 font-bold"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
          </div>
        </>
      )}
    </div>
  );
}
