"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { addStock } from "@/lib/api/inventory";
import { mutate } from "swr";

export default function AddStockPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  
  const unwrappedParams = use(params);
  const productId = unwrappedParams.id;

  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [quantity, setQuantity] = useState("1");
  const [imeiInput, setImeiInput] = useState(""); // text area for pasted IMEIs
  const [costPrice, setCostPrice] = useState("");
  
  const [showEditImei, setShowEditImei] = useState(false);
  const [editingImeis, setEditingImeis] = useState<Record<number, string>>({});
  const [savingImeiId, setSavingImeiId] = useState<number | null>(null);

  const handleSaveImei = async (unitId: number, oldImei: string) => {
    const newImei = editingImeis[unitId];
    if (!newImei || newImei === oldImei) return;
    
    if (!window.confirm(`Are you sure you want to change Serial Number: ${oldImei} -> ${newImei}?`)) {
      return;
    }

    try {
      setSavingImeiId(unitId);
      const res = await fetch(`/api/v1/product-units/${unitId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imeiNumber: newImei }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to update Serial Number");
      
      alert(`Success! Serial Number changed from ${oldImei} to ${newImei}`);
      await loadProduct(); 
    } catch (err: any) {
      alert(err.message || "Failed to update IMEI");
    } finally {
      setSavingImeiId(null);
    }
  };

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/inventory");
      return;
    }
    loadProduct();
  }, [authLoading, role]);

  const handleNumberKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, allowDecimal = false) => {
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      return;
    }
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    if (allowDecimal && e.key === ".") {
      if (e.currentTarget.value.includes(".")) {
        e.preventDefault();
      }
      return;
    }
    if ((e.shiftKey || (e.keyCode < 48 || e.keyCode > 57)) && (e.keyCode < 96 || e.keyCode > 105)) {
      e.preventDefault();
    }
  };

  const loadProduct = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/v1/products/${productId}`);
      if (!res.ok) throw new Error("Failed to load product");
      const data = await res.json();
      setProduct(data);
      setCostPrice(data.costPrice);
      
      // Initialize editing states for IMEIs
      if (data.units) {
        const initialEdits: Record<number, string> = {};
        data.units.forEach((u: any) => {
          initialEdits[u.id] = u.imeiNumber;
        });
        setEditingImeis(initialEdits);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const payload: any = {
        costPrice: parseFloat(costPrice) || undefined,
      };

      if (product.productType !== "quantity") {
        const imeis = imeiInput
          .split(/[\n,]/)
          .map((i) => i.trim())
          .filter((i) => i.length > 0);
          
        if (imeis.length === 0) {
          throw new Error("Please enter at least one Serial Number");
        }
        payload.imeis = imeis;
      } else {
        payload.quantity = parseInt(quantity);
      }

      await addStock(parseInt(productId), payload);
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to add stock");
      setSubmitting(false);
    }
  };

  if (loading || authLoading) return <div className="text-center py-10 text-sm text-gray-500">Loading...</div>;
  if (!product) return <div className="text-center py-10 text-red-500 font-semibold">Product not found</div>;

  const detectedSerialCount = imeiInput
    .split(/[\n,]/)
    .map((i) => i.trim())
    .filter((i) => i.length > 0).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-8">
      {/* Top Back Bar */}
      <div>
        <button
          type="button"
          onClick={() => router.push("/inventory")}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-600 hover:text-gray-900 transition"
        >
          <span>←</span>
          <span>Back to Inventory</span>
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-[#DED6CA] shadow-sm overflow-hidden">
        {/* Product Summary Banner */}
        <div className="bg-[#FAF8F5] border-b border-[#E5DFD7] p-4 sm:p-6 space-y-2.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
              + Stock In
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-800 border border-blue-200">
              Current Stock: {product.quantityInStock}
            </span>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              {product.productType === "quantity" ? "Quantity" : "Serial Tracked"}
            </span>
          </div>

          <h2 className="text-lg sm:text-2xl font-black text-gray-900 leading-snug">
            {product.name}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {error && (
            <div className="text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl text-xs font-semibold">
              {error}
            </div>
          )}

          {product.productType !== "quantity" ? (
            <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-xl p-3.5 sm:p-4 space-y-2">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
                  Serial Numbers
                </label>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 tabular-nums">
                  {detectedSerialCount} {detectedSerialCount === 1 ? "serial" : "serials"} ready
                </span>
              </div>
              <textarea
                required
                rows={5}
                className="block w-full border border-gray-300 bg-white rounded-xl shadow-2xs py-2.5 px-3 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter comma-separated or one per line&#10;e.g. SN123456, SN123457"
                value={imeiInput}
                onChange={(e) => setImeiInput(e.target.value)}
              />
              <p className="text-[11px] text-gray-500 leading-snug">
                Separate serials with commas or new lines. Stock increases automatically by the count above.
              </p>
            </div>
          ) : (
            <div className="bg-[#F8FAFC] border border-slate-200/90 rounded-xl p-3.5 sm:p-4 space-y-2">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-gray-700">
                Quantity to Add
              </label>
              <input
                type="number"
                required
                min="1"
                className="block w-full border border-gray-300 bg-white rounded-xl shadow-2xs py-2.5 px-3 text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                onKeyDown={(e) => handleNumberKeyDown(e, false)}
                onWheel={(e) => (e.target as HTMLInputElement).blur()}
              />
            </div>
          )}

          {product.productType !== "quantity" && product.units && product.units.length > 0 && (
            <div className="bg-[#F8F6F2] border border-[#E5DFD7] rounded-xl p-3.5">
              <button
                type="button"
                onClick={() => setShowEditImei(!showEditImei)}
                className="text-xs sm:text-sm font-bold text-blue-700 hover:text-blue-900 flex items-center gap-2 transition"
              >
                <span>✏️</span>
                <span>{showEditImei ? "Hide Existing Serial Numbers" : `Edit Existing Serial Numbers (${product.units.length})`}</span>
              </button>

              {showEditImei && (
                <div className="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar pr-1">
                  {product.units.map((unit: any) => (
                    <div
                      key={unit.id}
                      className="flex items-center gap-2 bg-white p-2 rounded-lg border border-gray-200"
                    >
                      <input
                        type="text"
                        className="flex-1 min-w-0 border border-gray-300 rounded-md px-2.5 py-1.5 text-xs sm:text-sm font-mono focus:ring-blue-500 focus:border-blue-500"
                        value={editingImeis[unit.id] || ""}
                        onChange={(e) =>
                          setEditingImeis((prev) => ({ ...prev, [unit.id]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleSaveImei(unit.id, unit.imeiNumber);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveImei(unit.id, unit.imeiNumber)}
                        disabled={savingImeiId === unit.id || editingImeis[unit.id] === unit.imeiNumber}
                        className="shrink-0 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-md text-xs font-bold disabled:opacity-40 transition"
                      >
                        {savingImeiId === unit.id ? "..." : "Save"}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-2 sm:flex sm:justify-between items-center gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={() => router.push("/inventory")}
              className="w-full sm:w-auto bg-white border border-gray-300 rounded-full shadow-2xs py-2.5 px-5 inline-flex justify-center items-center text-xs sm:text-sm font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-full py-2.5 px-5 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-b from-[#16A34A] to-[#15803D] hover:from-[#22C55E] hover:to-[#16A34A] border border-[#15803D] border-b-2 border-b-[#14532D] shadow-[0_2px_6px_rgba(21,128,61,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] active:translate-y-px transition disabled:opacity-50"
            >
              {submitting ? "Adding..." : "Confirm Stock In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
