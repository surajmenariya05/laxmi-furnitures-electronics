"use client";

import { useState, useEffect, useCallback } from "react";
import { getCategories, createCategory, createProduct } from "@/lib/api/inventory";
import { mutate } from "swr";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import CategorySelector from "@/components/dashboard/CategorySelector";


import { useDepartment } from "@/components/dashboard/department/DepartmentContext";

export default function NewProductPage() {
  const router = useRouter();
  const { role, isLoading: authLoading } = useAuth();
  const { department: activeDept } = useDepartment();
  
  const [selectedDept, setSelectedDept] = useState<"FURNITURE" | "ELECTRONICS">(
    activeDept === "ELECTRONICS" ? "ELECTRONICS" : "FURNITURE"
  );
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    categoryId: "",
    productType: activeDept === "ELECTRONICS" ? "serialized" : "quantity",
    costPrice: "",
    sellingPrice: "",
    lowStockThreshold: "2",
    initialQuantity: "",
    imeis: "",
    imageUrl: "",
    barcode: "",
    warrantyMonths: "12",
  });

  const handleDepartmentSwitch = (dept: "FURNITURE" | "ELECTRONICS") => {
    setSelectedDept(dept);
    setFormData((prev) => ({
      ...prev,
      categoryId: "",
      productType: dept === "ELECTRONICS" ? "serialized" : "quantity",
    }));
  };

  useEffect(() => {
    if (!authLoading && role !== "owner") {
      router.push("/inventory");
    }
  }, [authLoading, role, router]);

  useEffect(() => {
    setFormData((prev) => ({ ...prev, categoryId: "" }));
    loadCategories(selectedDept);
  }, [selectedDept]);

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

  const handleTextOnlyKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (
      [46, 8, 9, 27, 13].indexOf(e.keyCode) !== -1 ||
      (e.ctrlKey === true && [65, 67, 86, 88].indexOf(e.keyCode) !== -1) ||
      (e.keyCode >= 35 && e.keyCode <= 39)
    ) {
      return;
    }
    if ((e.keyCode >= 48 && e.keyCode <= 57) || (e.keyCode >= 96 && e.keyCode <= 105)) {
      e.preventDefault();
    }
  };

  const loadCategories = async (dept = selectedDept) => {
    try {
      const cats = await getCategories(dept);
      setCategories(cats);
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateCategory = async (name: string, parentCategoryId?: number) => {
    try {
      const cat = await createCategory({ name, parentCategoryId, department: selectedDept });
      setCategories((prev) => [...prev, cat]);
      return cat;
    } catch (err) {
      setError("Failed to create category");
      throw err;
    }
  };
      
  const handleThresholdChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, ""); // Remove all non-digits
    setFormData({ ...formData, lowStockThreshold: cleanValue });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const threshold = parseInt(formData.lowStockThreshold) || 0;
    if (threshold <= 0) {
      setError("Low Stock Threshold must be a positive number.");
      setLoading(false);
      return;
    }
    
    try {
      const payload = {
        categoryId: formData.categoryId,
        department: selectedDept,
        name: formData.name,
        brand: formData.brand,
        productType: formData.productType,
        costPrice: parseFloat(formData.costPrice),
        sellingPrice: parseFloat(formData.sellingPrice),
        lowStockThreshold: threshold,
        warrantyMonths: selectedDept === "ELECTRONICS" ? parseInt(formData.warrantyMonths || "12") : null,
        initialQuantity: formData.productType === "quantity" ? parseInt(formData.initialQuantity) || 0 : 0,
        imeis: formData.productType !== "quantity"
          ? formData.imeis.split(/[\n,]+/).map(i => i.trim()).filter(Boolean)
          : [],
        imageUrl: formData.imageUrl || undefined,
        barcode: formData.barcode || undefined,
      };

      await createProduct(payload);
      router.push("/inventory");
    } catch (err: any) {
      setError(err.message || "Failed to create product");
      setLoading(false);
    }
  };

  if (authLoading || role !== "owner") return null;

  const costNum = parseFloat(formData.costPrice) || 0;
  const sellNum = parseFloat(formData.sellingPrice) || 0;
  const hasPrices = formData.costPrice !== "" && formData.sellingPrice !== "";
  const marginAmount = sellNum - costNum;
  const marginPct = costNum > 0 ? ((marginAmount / costNum) * 100).toFixed(1) : null;
  const detectedSerialCount = formData.imeis
    .split(/[\n,]+/)
    .map((i) => i.trim())
    .filter(Boolean).length;

  return (
    <div className="max-w-2xl mx-auto space-y-4 pb-10">
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
        {/* Editorial Header */}
        <div className="bg-[#FAF8F5] border-b border-[#E5DFD7] p-4 sm:p-6 flex items-center justify-between gap-3">
          <div>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-blue-50 text-blue-700 border border-blue-200 mb-1.5">
              + New Catalog Item
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-gray-900 tracking-tight leading-tight">
              Add New Product
            </h2>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider border ${
              selectedDept === "FURNITURE"
                ? "bg-[#235347] text-white border-[#14352D]"
                : "bg-[#093F52] text-white border-[#052531]"
            }`}
          >
            <span>{selectedDept === "FURNITURE" ? "🛋️" : "⚡"}</span>
            <span>{selectedDept === "FURNITURE" ? "Furniture" : "Electronics"}</span>
          </span>
        </div>

        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5">
          {error && (
            <div className="text-red-700 bg-red-50 p-3 rounded-xl border border-red-200 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Interactive Showroom Division Switcher */}
          <div className="bg-[#F8F6F2] p-3.5 sm:p-4 rounded-xl border border-[#E5DFD7] space-y-2.5">
            <label className="block text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
              Showroom Division
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => handleDepartmentSwitch("FURNITURE")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm border transition-all ${
                  selectedDept === "FURNITURE"
                    ? "bg-[#235347] text-white border-[#2F6859] border-b-2 border-b-[#14352D] shadow-[0_2px_6px_rgba(35,83,71,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>🪑</span>
                <span>Furniture</span>
              </button>
              <button
                type="button"
                onClick={() => handleDepartmentSwitch("ELECTRONICS")}
                className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl font-extrabold text-xs sm:text-sm border transition-all ${
                  selectedDept === "ELECTRONICS"
                    ? "bg-[#093F52] text-white border-[#105269] border-b-2 border-b-[#052531] shadow-[0_2px_6px_rgba(9,63,82,0.28),inset_0_1px_0_rgba(255,255,255,0.25)]"
                    : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                }`}
              >
                <span>⚡</span>
                <span>Electronics</span>
              </button>
            </div>
            <p className="text-[11px] text-gray-500 leading-snug">
              {selectedDept === "FURNITURE"
                ? "Beds, Sofas, Dining Tables, Wardrobes, Dressing Tables, etc."
                : "Appliances, TVs, Refrigerators, ACs, Washing Machines with warranty tracking."}
            </p>
          </div>

          {selectedDept === "ELECTRONICS" && (
            <div className="bg-blue-50/70 p-3.5 sm:p-4 rounded-xl border border-blue-200 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <label className="block text-xs sm:text-sm font-extrabold text-blue-950">
                  Manufacturer Warranty (Months)
                </label>
                <p className="text-[11px] text-blue-700 mt-0.5 leading-snug">
                  Starts on the delivery / invoice date.
                </p>
              </div>
              <div className="w-24 shrink-0">
                <input
                  type="number"
                  min="0"
                  className="block w-full border border-blue-300 rounded-lg shadow-2xs py-2 px-3 text-sm bg-white font-extrabold text-center font-mono"
                  value={formData.warrantyMonths}
                  onChange={(e) => setFormData({ ...formData, warrantyMonths: e.target.value })}
                  placeholder="12"
                />
              </div>
            </div>
          )}

          {/* Card 1: Product Identity */}
          <div className="bg-white border border-gray-200 rounded-xl p-3.5 sm:p-4 space-y-3.5">
            <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-500">
              Product Identity
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Product Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. 6-Seater Solid Sheesham Dining Table"
                className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Brand</label>
              <input
                type="text"
                placeholder="e.g. Laxmi Craft, IFB, Samsung"
                className="block w-full border border-gray-300 rounded-lg py-2 px-3 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Category *</label>
              <CategorySelector
                categories={categories}
                selectedCategoryId={formData.categoryId}
                onChange={(catId) => setFormData({ ...formData, categoryId: catId })}
                onAddCategory={handleCreateCategory}
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">Product Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, productType: "quantity" })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    formData.productType === "quantity"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>📦</span>
                  <span>Quantity Based</span>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, productType: "serialized" })}
                  className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                    formData.productType === "serialized"
                      ? "bg-slate-900 text-white border-slate-900 shadow-xs"
                      : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                  }`}
                >
                  <span>🔢</span>
                  <span>Serial Tracked</span>
                </button>
              </div>
            </div>
          </div>

          {/* Card 2: Pricing & Live Margin */}
          <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2 flex-wrap">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
                Pricing &amp; Margin
              </p>
              {hasPrices && (
                <span
                  className={`text-[11px] font-extrabold px-2.5 py-0.5 rounded-full border tabular-nums ${
                    marginAmount > 0
                      ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                      : marginAmount < 0
                      ? "bg-red-50 text-red-700 border-red-200"
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}
                >
                  Margin: {marginAmount >= 0 ? "+" : ""}₹{marginAmount.toLocaleString("en-IN")}
                  {marginPct !== null ? ` (${marginPct}%)` : ""}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Cost Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0"
                  className="block w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.costPrice}
                  onChange={(e) => setFormData({ ...formData, costPrice: e.target.value })}
                  onKeyDown={(e) => handleNumberKeyDown(e, true)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Selling Price (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  placeholder="0"
                  className="block w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  value={formData.sellingPrice}
                  onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                  onKeyDown={(e) => handleNumberKeyDown(e, true)}
                  onWheel={(e) => (e.target as HTMLInputElement).blur()}
                />
              </div>
            </div>
          </div>

          {/* Card 3: Initial Stock Setup */}
          <div className="bg-[#F8FAFC] border border-slate-200 rounded-xl p-3.5 sm:p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-[11px] font-extrabold uppercase tracking-wider text-gray-600">
                Initial Stock Setup
              </p>
              {formData.productType !== "quantity" && (
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 tabular-nums">
                  {detectedSerialCount} {detectedSerialCount === 1 ? "serial" : "serials"} ready
                </span>
              )}
            </div>

            {formData.productType === "quantity" ? (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Initial Stock Qty</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    className="block w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.initialQuantity}
                    onChange={(e) => setFormData({ ...formData, initialQuantity: e.target.value })}
                    onKeyDown={(e) => handleNumberKeyDown(e, false)}
                    onWheel={(e) => (e.target as HTMLInputElement).blur()}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Low Stock Alert *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2"
                    className="block w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.lowStockThreshold}
                    onChange={(e) => handleThresholdChange(e.target.value)}
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    Initial Serial Numbers (Comma or new line separated)
                  </label>
                  <textarea
                    placeholder="e.g. SN1000234, SN1000235"
                    rows={3}
                    className="block w-full border border-gray-300 bg-white rounded-lg py-2 px-3 font-mono text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.imeis}
                    onChange={(e) => setFormData({ ...formData, imeis: e.target.value })}
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Low Stock Alert Threshold *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 2"
                    className="block w-full border border-gray-300 bg-white rounded-lg py-2 px-3 text-sm font-mono font-bold focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={formData.lowStockThreshold}
                    onChange={(e) => handleThresholdChange(e.target.value)}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Footer */}
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
              disabled={loading}
              className="w-full sm:w-auto inline-flex justify-center items-center rounded-full py-2.5 px-6 text-xs sm:text-sm font-extrabold text-white bg-gradient-to-b from-[#2E62EB] to-[#1D4ED8] hover:from-[#3B6EF0] hover:to-[#1E40AF] border border-[#1E40AF] border-b-2 border-b-[#172554] shadow-[0_2px_6px_rgba(29,78,216,0.28),inset_0_1px_0_rgba(255,255,255,0.3)] active:translate-y-px transition disabled:opacity-50"
            >
              {loading ? "Saving..." : "Save Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
