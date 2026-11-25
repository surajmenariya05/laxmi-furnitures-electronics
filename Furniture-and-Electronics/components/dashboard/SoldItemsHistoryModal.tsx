"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { X, Search, Loader2, ChevronDown, Calendar } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import SoldItemsMobileCards from "@/components/mobileview/dashboard/SoldItemsMobileCards";

interface Category {
  id: number;
  name: string;
  parentCategoryId: number | null;
}

export default function SoldItemsHistoryModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [parentCategory, setParentCategory] = useState<string>("");
  const [subCategory, setSubCategory] = useState<string>("");
  const [fromDate, setFromDate] = useState<string>("");
  const [toDate, setToDate] = useState<string>("");
  const [parentDropdownOpen, setParentDropdownOpen] = useState(false);
  const [subDropdownOpen, setSubDropdownOpen] = useState(false);
  const toDateInputRef = useRef<HTMLInputElement>(null);

  const openToDatePicker = () => {
    const input = toDateInputRef.current;
    if (!input) return;
    try {
      if (typeof input.showPicker === "function") {
        input.showPicker();
        return;
      }
    } catch {
      // Fallback below
    }
    input.focus();
    input.click();
  };

  const formatDisplayDate = (iso: string) => {
    if (!iso) return "dd-mm-yyyy";
    const parts = iso.split("-");
    return parts.length === 3 ? `${parts[2]}-${parts[1]}-${parts[0]}` : iso;
  };
  
  const [items, setItems] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  // Observer for infinite scroll
  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLElement | null) => {
    if (loading || !hasMore) return;
    if (observer.current) observer.current.disconnect();
    
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loading) {
        setPage(prev => prev + 1);
      }
    });
    
    if (node) observer.current.observe(node);
  }, [loading, hasMore]);

  // Fetch categories on mount
  useEffect(() => {
    if (isOpen && categories.length === 0) {
      fetch("/api/v1/categories")
        .then(res => res.json())
        .then(data => setCategories(data))
        .catch(err => console.error("Error fetching categories:", err));
    }
  }, [isOpen, categories.length]);

  // Fetch data
  useEffect(() => {
    if (!isOpen) return;
    
    const fetchItems = async () => {
      setLoading(true);
      try {
        const query = new URLSearchParams({
          page: page.toString(),
          limit: "20"
        });
        
        if (subCategory) {
          query.append("subCategoryId", subCategory);
        } else if (parentCategory) {
          query.append("parentCategoryId", parentCategory);
        }
        if (fromDate) query.append("fromDate", fromDate);
        if (toDate) query.append("toDate", toDate);

        const res = await fetch(`/api/v1/dashboard/sold-items?${query.toString()}`);
        const data = await res.json();
        
        if (data.items) {
          if (page === 1) {
            setItems(data.items);
          } else {
            setItems(prev => [...prev, ...data.items]);
          }
          setHasMore(data.hasMore);
        }
      } catch (err) {
        console.error("Failed to fetch sold items:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchItems();
  }, [isOpen, page, parentCategory, subCategory, fromDate, toDate]);

  // Reset page and items when filters change
  useEffect(() => {
    setPage(1);
    setItems([]);
  }, [parentCategory, subCategory, fromDate, toDate]);


  const parents = categories.filter(c => !c.parentCategoryId);
  const subs = parentCategory 
    ? categories.filter(c => c.parentCategoryId === parseInt(parentCategory))
    : [];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="bg-[#F8F6F2] rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden border border-[#E8E2D8]"
    >
        
        {/* Header */}
        <div className="px-4 sm:px-6 py-3.5 sm:py-4 border-b flex justify-between items-start gap-2 bg-gray-50/50">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Sold Items History</h2>
            <p className="text-xs sm:text-sm text-gray-500">View and filter all historical sales</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 shrink-0 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters */}
        <div className="relative px-4 sm:px-6 py-3 sm:py-4 border-b bg-white grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-4">
          {/* Hidden To Date input anchored at left-0 so native calendar never overflows right on mobile */}
          <input
            ref={toDateInputRef}
            type="date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            aria-label="To Date"
            tabIndex={-1}
            className="absolute left-0 bottom-0 w-px h-px opacity-0 pointer-events-none"
          />

          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">From Date</label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">To Date</label>
            <button
              type="button"
              onClick={openToDatePicker}
              className="w-full flex items-center justify-between gap-2 border rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white text-left focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <span className={toDate ? "text-gray-900 font-medium tabular-nums" : "text-gray-500"}>
                {formatDisplayDate(toDate)}
              </span>
              <Calendar className="w-3.5 h-3.5 text-gray-500 shrink-0" />
            </button>
          </div>
          <div className="relative">
            <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Parent Category</label>
            <button
              type="button"
              onClick={() => {
                setParentDropdownOpen((prev) => !prev);
                setSubDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 border rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white text-left focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <span className="truncate text-gray-900">
                {parents.find((c) => String(c.id) === parentCategory)?.name || "All Categories"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${
                  parentDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {parentDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setParentDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setParentCategory("");
                      setSubCategory("");
                      setParentDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 ${
                      !parentCategory ? "bg-blue-50 font-bold text-blue-700" : "text-gray-700"
                    }`}
                  >
                    All Categories
                  </button>
                  {parents.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setParentCategory(String(c.id));
                        setSubCategory("");
                        setParentDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 truncate ${
                        parentCategory === String(c.id)
                          ? "bg-blue-50 font-bold text-blue-700"
                          : "text-gray-800"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
          <div className="relative">
            <label className="block text-[11px] sm:text-xs font-medium text-gray-500 mb-1">Subcategory</label>
            <button
              type="button"
              disabled={!parentCategory}
              onClick={() => {
                setSubDropdownOpen((prev) => !prev);
                setParentDropdownOpen(false);
              }}
              className="w-full flex items-center justify-between gap-2 border rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm bg-white text-left focus:ring-2 focus:ring-blue-500 outline-none disabled:bg-gray-50 disabled:opacity-50"
            >
              <span className="truncate text-gray-900">
                {subs.find((c) => String(c.id) === subCategory)?.name || "All Subcategories"}
              </span>
              <ChevronDown
                className={`w-3.5 h-3.5 text-gray-400 shrink-0 transition-transform ${
                  subDropdownOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {subDropdownOpen && parentCategory && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setSubDropdownOpen(false)}
                />
                <div className="absolute left-0 right-0 top-full mt-1 z-30 bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1">
                  <button
                    type="button"
                    onClick={() => {
                      setSubCategory("");
                      setSubDropdownOpen(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 ${
                      !subCategory ? "bg-blue-50 font-bold text-blue-700" : "text-gray-700"
                    }`}
                  >
                    All Subcategories
                  </button>
                  {subs.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSubCategory(String(c.id));
                        setSubDropdownOpen(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs sm:text-sm hover:bg-blue-50 truncate ${
                        subCategory === String(c.id)
                          ? "bg-blue-50 font-bold text-blue-700"
                          : "text-gray-800"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Table / Mobile Cards Content */}
        <div className="flex-1 overflow-auto p-3.5 sm:p-6 bg-gray-50/30">
          {items.length === 0 && !loading && (
            <div className="md:hidden border rounded-xl bg-white p-8 text-center text-gray-500 text-sm">
              No sold items found.
            </div>
          )}

          <SoldItemsMobileCards items={items} lastElementRef={() => {}} />

          <div className="hidden md:block border rounded-xl bg-white shadow-sm overflow-hidden">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-600 font-medium border-b text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Bill No</th>
                  <th className="px-4 py-3">Product details</th>
                  <th className="px-4 py-3">Serial No. / S/N</th>
                  <th className="px-4 py-3 text-right">Amount</th>
                  <th className="px-4 py-3 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.length === 0 && !loading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                      No sold items found.
                    </td>
                  </tr>
                ) : (
                  items.map((item) => {
                    const date = new Date(item.bill.createdAt).toLocaleDateString("en-IN", {
                      day: "2-digit", month: "short", year: "numeric"
                    });
                    
                    const isAccessory = item.product?.productType === "accessory";
                    const identifier = isAccessory ? "NA" : (item.productUnit?.imeiNumber || "NA");
                    const billNo = item.bill?.billNumber || "N/A";
                    const customerName = item.bill?.customer?.name;
                    
                    return (
                      <tr 
                        key={item.id} 
                        className="hover:bg-blue-50/50 transition-colors group"
                      >
                        <td className="px-4 py-3 whitespace-nowrap text-gray-600">{date}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{billNo}</div>
                          {customerName && (
                            <div className="text-xs text-blue-800 mt-0.5 opacity-90">{customerName}</div>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider mb-0.5">
                            {item.product?.brand || "Brand"}
                          </div>
                          <div className="font-medium text-gray-900">
                            {item.product?.name || "Product"}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                            identifier === 'NA' ? 'bg-gray-100 text-gray-600' : 'bg-blue-50 text-blue-700'
                          }`}>
                            {identifier}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-gray-900">
                          ₹{parseFloat(item.lineTotal).toFixed(2)}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-[10px] font-medium uppercase tracking-wider ${
                            item.bill?.paymentStatus === 'PAID' ? 'bg-green-100 text-green-700' : 
                            item.bill?.paymentStatus === 'DUE' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {item.bill?.paymentStatus || "UNKNOWN"}
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {hasMore && items.length > 0 && <div ref={lastElementRef} className="h-2" />}

          {loading && (
            <div className="p-6 flex justify-center items-center">
              <Loader2 className="w-6 h-6 animate-spin text-blue-500" />
            </div>
          )}
        </div>
      </Modal>
    );
}
