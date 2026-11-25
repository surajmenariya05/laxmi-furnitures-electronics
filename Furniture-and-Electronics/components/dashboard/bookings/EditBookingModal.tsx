"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { BookingResponse } from "@/types/booking";
import ProductPicker from "@/components/dashboard/bookings/new/ProductPicker";
import EditBookingItemsMobileCards from "@/components/mobileview/bookings/EditBookingItemsMobileCards";
import {
  FaUser,
  FaPhone,
  FaMapMarkerAlt,
  FaCalendarAlt,
  FaTrash,
  FaPlus,
  FaLock,
  FaCouch,
  FaBolt,
  FaExclamationTriangle,
  FaSave,
  FaTimes,
} from "react-icons/fa";

interface EditBookingModalProps {
  booking: BookingResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface EditableItem {
  id?: number;
  productId: number;
  name: string;
  brand: string | null;
  department: "FURNITURE" | "ELECTRONICS";
  warrantyMonths: number | null;
  unitPrice: number;
  mrp?: number;
  quantity: number;
  stock?: number;
  lineTotal: number;
  customisations?: string | null;
  isBilled: boolean;
  isLocked: boolean; // Delivered via ELEC invoice
}

export default function EditBookingModal({
  booking,
  isOpen,
  onClose,
  onSuccess,
}: EditBookingModalProps) {
  if (!isOpen || !booking) return null;

  // Form Fields
  const [customerName, setCustomerName] = useState(booking.customer?.name || "");
  const [customerPhone, setCustomerPhone] = useState(booking.customer?.phone || "");
  const [customerAddress, setCustomerAddress] = useState(booking.customer?.address || "");
  const [eventDate, setEventDate] = useState(
    booking.eventDate ? new Date(booking.eventDate).toISOString().split("T")[0] : ""
  );
  const [expectedDeliveryDate, setExpectedDeliveryDate] = useState(
    booking.expectedDeliveryDate
      ? new Date(booking.expectedDeliveryDate).toISOString().split("T")[0]
      : ""
  );

  // Extract notes and any legacy discount
  const rawNotes = booking.notes || "";
  const discountMatch = rawNotes.match(/\(Discount:\s*₹?(\d+(?:\.\d+)?)\)/i) || rawNotes.match(/Discount:\s*₹?(\d+(?:\.\d+)?)/i);
  const initialDiscount = discountMatch ? parseFloat(discountMatch[1]) : 0;
  const cleanedNotes = rawNotes
    .replace(/\(Discount:\s*₹?\d+(?:\.\d+)?\)/gi, "")
    .replace(/Discount:\s*₹?\d+(?:\.\d+)?/gi, "")
    .replace(/\[DESIGNS\]:[\s\S]*$/g, "")
    .trim();

  const [notes, setNotes] = useState(cleanedNotes);
  const [discount, setDiscount] = useState<number>(initialDiscount);
  const [advancePaid, setAdvancePaid] = useState<number>(Number(booking.advancePaid || 0));

  // Map initial items
  // Check which items are already delivered in an ELECTRONICS delivery invoice
  const [items, setItems] = useState<EditableItem[]>(() => {
    return (booking.bookingItems || []).map((bi) => {
      const isFurn = (bi.department || "FURNITURE").toUpperCase() === "FURNITURE";
      const isDelivered = !isFurn && bi.isBilled; // Electronics that was billed = delivered

      return {
        id: bi.id,
        productId: bi.productId,
        name: bi.product?.name || "Product",
        brand: bi.product?.brand || null,
        department: isFurn ? "FURNITURE" : "ELECTRONICS",
        warrantyMonths: bi.product?.warrantyMonths || null,
        unitPrice: Number(bi.unitPrice || 0),
        mrp: bi.mrp ? Number(bi.mrp) : undefined,
        quantity: bi.quantity,
        stock: bi.product?.quantityInStock,
        lineTotal: Number(bi.lineTotal || Number(bi.unitPrice || 0) * bi.quantity),
        customisations: bi.customisations || null,
        isBilled: bi.isBilled,
        isLocked: isDelivered,
      };
    });
  });

  const [showProductPicker, setShowProductPicker] = useState(false);
  const [removedNotices, setRemovedNotices] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  // Sync state if booking changes
  useEffect(() => {
    if (booking) {
      setCustomerName(booking.customer?.name || "");
      setCustomerPhone(booking.customer?.phone || "");
      setCustomerAddress(booking.customer?.address || "");
      setEventDate(
        booking.eventDate ? new Date(booking.eventDate).toISOString().split("T")[0] : ""
      );
      setExpectedDeliveryDate(
        booking.expectedDeliveryDate
          ? new Date(booking.expectedDeliveryDate).toISOString().split("T")[0]
          : ""
      );
      setAdvancePaid(Number(booking.advancePaid || 0));
      setDiscount(initialDiscount);
      setNotes(cleanedNotes);
    }
  }, [booking]);

  // Handle Item Quantity & Rate Updates
  const handleUpdateItem = (
    index: number,
    updates: Partial<Pick<EditableItem, "quantity" | "unitPrice">>
  ) => {
    setItems((prev) => {
      const updated = [...prev];
      const item = { ...updated[index], ...updates };
      item.quantity = Math.max(1, item.quantity);
      item.lineTotal = item.quantity * item.unitPrice;
      updated[index] = item;
      return updated;
    });
  };

  // Handle Remove Item
  const handleRemoveItem = (index: number) => {
    const item = items[index];
    if (item.isLocked) {
      alert("This item has already been delivered and cannot be removed.");
      return;
    }

    if (item.department === "FURNITURE" && item.isBilled) {
      setRemovedNotices((prev) => [
        ...prev,
        `🛋️ ${item.name} removed: Stock of ${item.quantity} units will be restored upon saving.`,
      ]);
    }

    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Handle Add Item from Picker
  const handleAddItemFromPicker = (pickerItem: {
    productId: number;
    name: string;
    brand: string | null;
    department: "FURNITURE" | "ELECTRONICS";
    warrantyMonths: number | null;
    sellingPrice: number;
    quantity: number;
    stock: number;
  }) => {
    // Check if already in items
    const existingIndex = items.findIndex(
      (i) => i.productId === pickerItem.productId && !i.isLocked
    );

    if (existingIndex !== -1) {
      // Increment quantity
      handleUpdateItem(existingIndex, {
        quantity: items[existingIndex].quantity + pickerItem.quantity,
      });
    } else {
      const newItem: EditableItem = {
        productId: pickerItem.productId,
        name: pickerItem.name,
        brand: pickerItem.brand,
        department: pickerItem.department,
        warrantyMonths: pickerItem.warrantyMonths,
        unitPrice: pickerItem.sellingPrice,
        mrp: pickerItem.sellingPrice,
        quantity: pickerItem.quantity,
        stock: pickerItem.stock,
        lineTotal: pickerItem.quantity * pickerItem.sellingPrice,
        isBilled: false,
        isLocked: false,
      };
      setItems((prev) => [...prev, newItem]);
    }

    setShowProductPicker(false);
  };

  // Financial Calculations
  const grossSubtotal = items.reduce((sum, item) => sum + item.lineTotal, 0);
  const netTotal = Math.max(0, grossSubtotal - (discount || 0));
  const remainingDue = Math.max(0, netTotal - (advancePaid || 0));

  // Save Edits Handler
  const handleSave = async () => {
    setErrorMessage("");

    if (!expectedDeliveryDate) {
      setErrorMessage("Please select a target delivery date.");
      return;
    }

    if (items.length === 0) {
      setErrorMessage("At least one item must remain in the booking.");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customerName: customerName.trim(),
        customerPhone: customerPhone.trim(),
        customerAddress: customerAddress.trim(),
        eventDate: eventDate || null,
        expectedDeliveryDate,
        notes,
        discount: Number(discount) || 0,
        advancePaid: Number(advancePaid) || 0,
        items: items.map((i) => ({
          id: i.id,
          productId: i.productId,
          department: i.department,
          quantity: i.quantity,
          mrp: i.mrp,
          unitPrice: i.unitPrice,
          lineTotal: i.lineTotal,
          customisations: i.customisations,
          isBilled: i.isBilled,
        })),
      };

      const res = await fetch(`/api/v1/bookings/${booking.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to update booking");
      }

      alert(`✅ Advance Booking #${booking.bookingNumber} updated successfully!`);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Save booking failed:", err);
      setErrorMessage(err.message || "Failed to save booking edits");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      containerClassName="max-w-4xl"
      className="p-0 overflow-hidden rounded-2xl bg-white border border-[#E5DFD7] shadow-2xl"
    >
      {/* Modal Header */}
      <div className="bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-transparent border-b border-amber-200/80 px-4 sm:px-6 py-3.5 sm:py-4 flex items-start justify-between gap-2.5">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 shrink-0 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black shadow-sm mt-0.5">
            <FaSave className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <h2 className="text-base sm:text-lg font-black text-gray-900 tracking-tight leading-tight">
                Edit Advance Booking
              </h2>
              <span className="font-mono text-[11px] sm:text-xs font-black text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded border border-amber-300 whitespace-nowrap">
                {booking.bookingNumber}
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1 leading-relaxed">
              Modify customer details, dates, items, and advance payments. Changes to furniture sync with existing bills in-place.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="w-8 h-8 shrink-0 rounded-lg hover:bg-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-700 transition-colors"
        >
          <FaTimes className="w-4 h-4" />
        </button>
      </div>

      <div className="p-4 sm:p-6 max-h-[75vh] overflow-y-auto space-y-6">
        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-semibold flex items-center gap-2">
            <FaExclamationTriangle className="w-4 h-4 shrink-0 text-red-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Removed Stock Notices */}
        {removedNotices.length > 0 && (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 space-y-1">
            {removedNotices.map((n, i) => (
              <p key={i} className="text-xs text-emerald-800 font-medium">
                {n}
              </p>
            ))}
          </div>
        )}

        {/* Section 1: Customer Details */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
            <FaUser className="w-3.5 h-3.5 text-gray-400" />
            <span>Customer Information</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Customer Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="w-full text-xs font-mono font-medium px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Address / Village
              </label>
              <input
                type="text"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                placeholder="e.g. Bhinder"
                className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Dates & Notes */}
        <div>
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 mb-3 flex items-center gap-1.5">
            <FaCalendarAlt className="w-3.5 h-3.5 text-gray-400" />
            <span>Schedule & Event Details</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Target Delivery Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={expectedDeliveryDate}
                onChange={(e) => setExpectedDeliveryDate(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Event / Wedding Date (Optional)
              </label>
              <input
                type="date"
                value={eventDate}
                onChange={(e) => setEventDate(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Booking Notes / Special Instructions
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Customer requested brown walnut color finish on wardrobe..."
              className="w-full text-xs px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        {/* Section 3: Package Items Grid */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-black uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
              <span>Reserved Package Items ({items.length})</span>
            </h3>
            <button
              type="button"
              onClick={() => setShowProductPicker(!showProductPicker)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg shadow-2xs transition-colors"
            >
              <FaPlus className="w-3 h-3" />
              <span>{showProductPicker ? "Close Catalog" : "Add Product"}</span>
            </button>
          </div>

          {/* Embedded Product Picker Drawer */}
          {showProductPicker && (
            <div className="mb-4 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <h4 className="text-xs font-bold text-gray-700 mb-3">
                Search & Select Product to Add:
              </h4>
              <ProductPicker onAddItem={handleAddItemFromPicker} />
            </div>
          )}

          {/* Mobile Item Cards */}
          <EditBookingItemsMobileCards
            items={items}
            onUpdateItem={handleUpdateItem}
            onRemoveItem={handleRemoveItem}
          />

          {/* Desktop Items Table */}
          <div className="hidden md:block border border-gray-200 rounded-xl overflow-hidden bg-white shadow-2xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase tracking-wider text-[10px] font-black">
                  <th className="py-2.5 px-3">Item Details</th>
                  <th className="py-2.5 px-3 text-center">Dept</th>
                  <th className="py-2.5 px-3 text-right">Unit Rate (₹)</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3 text-right">Total (₹)</th>
                  <th className="py-2.5 px-3 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {items.map((item, idx) => (
                  <tr key={idx} className={item.isLocked ? "bg-slate-50/60" : "hover:bg-amber-50/30"}>
                    <td className="py-2.5 px-3 font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        {item.isLocked && (
                          <span
                            title="Delivered under Delivery Invoice. Locked."
                            className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 text-[10px] font-black"
                          >
                            <FaLock className="w-2.5 h-2.5" />
                            <span>Delivered</span>
                          </span>
                        )}
                        <div>
                          <p className="font-bold text-gray-900">{item.name}</p>
                          {item.brand && <p className="text-[10px] text-gray-500">{item.brand}</p>}
                        </div>
                      </div>
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${
                          item.department === "FURNITURE"
                            ? "bg-amber-50 text-amber-800 border-amber-200"
                            : "bg-blue-50 text-blue-800 border-blue-200"
                        }`}
                      >
                        {item.department === "FURNITURE" ? (
                          <FaCouch className="w-2.5 h-2.5" />
                        ) : (
                          <FaBolt className="w-2.5 h-2.5" />
                        )}
                        <span>{item.department}</span>
                      </span>
                    </td>

                    <td className="py-2.5 px-3 text-right">
                      {item.isLocked ? (
                        <span className="font-mono font-bold text-gray-700">
                          ₹{item.unitPrice.toLocaleString("en-IN")}
                        </span>
                      ) : (
                        <input
                          type="number"
                          min="0"
                          value={item.unitPrice}
                          onChange={(e) =>
                            handleUpdateItem(idx, {
                              unitPrice: parseFloat(e.target.value) || 0,
                            })
                          }
                          className="w-24 text-right font-mono font-bold text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {item.isLocked ? (
                        <span className="font-mono font-bold text-gray-700">{item.quantity}</span>
                      ) : (
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={(e) =>
                            handleUpdateItem(idx, {
                              quantity: parseInt(e.target.value, 10) || 1,
                            })
                          }
                          className="w-14 text-center font-mono font-bold text-xs px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
                        />
                      )}
                    </td>

                    <td className="py-2.5 px-3 text-right font-mono font-bold text-gray-900">
                      ₹{item.lineTotal.toLocaleString("en-IN")}
                    </td>

                    <td className="py-2.5 px-3 text-center">
                      {item.isLocked ? (
                        <span className="text-[10px] text-gray-400 italic">Locked</span>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRemoveItem(idx)}
                          className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50 transition-colors"
                          title="Remove item"
                        >
                          <FaTrash className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Section 4: Live Financial Summary */}
        <div className="bg-[#FAF8F5] border border-[#E5DFD7] rounded-xl p-4">
          <h3 className="text-xs font-black uppercase tracking-wider text-gray-600 mb-3">
            Financial Summary & Balances
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Package Gross</span>
              <span className="text-base font-black text-gray-900 font-mono">
                ₹{grossSubtotal.toLocaleString("en-IN")}
              </span>
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                Discount (₹)
              </label>
              <input
                type="number"
                min="0"
                value={discount}
                onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-mono font-bold text-amber-700 px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <label className="text-[10px] uppercase font-bold text-gray-500 block mb-0.5">
                Advance Paid (₹)
              </label>
              <input
                type="number"
                min="0"
                value={advancePaid}
                onChange={(e) => setAdvancePaid(parseFloat(e.target.value) || 0)}
                className="w-full text-sm font-mono font-bold text-emerald-700 px-2 py-0.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-emerald-500"
              />
            </div>

            <div className="bg-white p-3 rounded-lg border border-gray-200">
              <span className="text-[10px] uppercase font-bold text-gray-500 block">Remaining Due</span>
              <span className="text-base font-black text-rose-700 font-mono">
                ₹{remainingDue.toLocaleString("en-IN")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Actions Footer */}
      <div className="bg-gray-50 border-t border-gray-200 px-6 py-3.5 flex items-center justify-between">
        <button
          type="button"
          onClick={onClose}
          disabled={submitting}
          className="px-4 py-2 text-xs font-bold text-gray-700 bg-white hover:bg-gray-100 border border-gray-300 rounded-lg shadow-2xs transition-colors"
        >
          Cancel
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-amber-600 hover:bg-amber-700 active:bg-amber-800 disabled:opacity-50 rounded-lg shadow-sm hover:shadow transition-all"
        >
          <FaSave className="w-3.5 h-3.5" />
          <span>{submitting ? "Saving Changes..." : "Save Changes"}</span>
        </button>
      </div>
    </Modal>
  );
}
