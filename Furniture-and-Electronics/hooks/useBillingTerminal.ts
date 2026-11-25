"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getProducts } from "@/lib/api/inventory";
import { searchCustomer, createBill, getBill, updateBill, removeBillItem } from "@/lib/api/billing";
import { mutate } from "swr";
import { useReactToPrint } from "react-to-print";

export interface BillingToast {
  text: string;
  type: "success" | "error" | "info";
}

export function useBillingTerminal() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const editBillIdParam = searchParams.get("editBillId");

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

  // Search & Cart State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [cart, setCart] = useState<any[]>([]);
  const [isSearchingProduct, setIsSearchingProduct] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const searchContainerRef = useRef<HTMLDivElement>(null);

  // Inline rate editing state
  const [editingRateCartItemId, setEditingRateCartItemId] = useState<string | null>(null);
  const [tempRate, setTempRate] = useState<string>("");

  // Customer info
  const [phone, setPhone] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [isSearchingCustomer, setIsSearchingCustomer] = useState(false);

  // Bill metadata
  const [paymentMode, setPaymentMode] = useState("cash");
  const [discount, setDiscount] = useState("");
  const [sgstPercent, setSgstPercent] = useState("");
  const [cgstPercent, setCgstPercent] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");

  // Finance states
  const [financeProviders, setFinanceProviders] = useState<any[]>([]);
  const [financeProviderId, setFinanceProviderId] = useState("");
  const [emiAmount, setEmiAmount] = useState("");
  const [financeMonths, setFinanceMonths] = useState("");

  // Print & Modals
  const [createdBill, setCreatedBill] = useState<any>(null);
  const [lastCreatedBill, setLastCreatedBill] = useState<any>(null);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showUpiModal, setShowUpiModal] = useState(false);
  const printComponentRef = useRef<HTMLDivElement>(null);

  // Edit Bill Mode State
  const [editingBill, setEditingBill] = useState<any>(null);
  const [isLoadingEditBill, setIsLoadingEditBill] = useState(false);
  const [itemPendingRemoval, setItemPendingRemoval] = useState<any>(null);
  const [isRemovingItem, setIsRemovingItem] = useState(false);
  const [showEditSummaryModal, setShowEditSummaryModal] = useState(false);
  const [toast, setToast] = useState<BillingToast | null>(null);

  useEffect(() => {
    if (createdBill) {
      setLastCreatedBill(createdBill);
    }
  }, [createdBill]);

  const activeCreatedBill = createdBill || lastCreatedBill;

  const showToast = useCallback((text: string, type: "success" | "error" | "info" = "success") => {
    setToast({ text, type });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4500);
    return () => clearTimeout(timer);
  }, [toast]);

  // Load existing bill when ?editBillId= is present
  useEffect(() => {
    if (!editBillIdParam) {
      setEditingBill(null);
      return;
    }
    const id = parseInt(editBillIdParam, 10);
    if (isNaN(id)) return;

    let cancelled = false;
    setIsLoadingEditBill(true);
    getBill(id)
      .then((bill) => {
        if (cancelled) return;
        if (bill.status === "voided") {
          setError("Voided bills cannot be edited.");
          return;
        }
        setEditingBill(bill);
        setPhone(bill.customer?.phone || "");
        setCustomerName(bill.customer?.name || "");
        setCustomerAddress(bill.customer?.address || "");
        setPaymentMode((bill.paymentMode || "cash").toLowerCase());
        setDiscount(Number(bill.discount || 0) > 0 ? String(Number(bill.discount)) : "");
        setSgstPercent(Number(bill.sgstPercent || 0) > 0 ? String(Number(bill.sgstPercent)) : "");
        setCgstPercent(Number(bill.cgstPercent || 0) > 0 ? String(Number(bill.cgstPercent)) : "");
        setPaidAmount(String(Number(bill.paidAmount ?? bill.totalAmount ?? 0)));

        if (bill.financeRecord) {
          setFinanceProviderId(String(bill.financeRecord.financeProviderId || ""));
          setEmiAmount(String(bill.financeRecord.emiAmount || ""));
          setFinanceMonths(bill.financeRecord.months ? String(bill.financeRecord.months) : "");
        }

        const mappedCart = (bill.billItems || []).map((bi: any) => ({
          cartItemId: `existing-${bi.id}`,
          billItemId: bi.id,
          isExisting: true,
          originalQuantity: bi.quantity,
          originalUnitPrice: Number(bi.unitPrice),
          product: bi.product,
          productUnit: bi.productUnit,
          quantity: bi.quantity,
          configuredPrice: Number(bi.unitPrice),
          selectedUnitId: bi.productUnitId ? String(bi.productUnitId) : "",
        }));
        setCart(mappedCart);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message || "Failed to load bill for editing");
        }
      })
      .finally(() => {
        if (!cancelled) setIsLoadingEditBill(false);
      });

    return () => {
      cancelled = true;
    };
  }, [editBillIdParam]);

  // Fetch finance providers
  useEffect(() => {
    const fetchFinanceProviders = async () => {
      try {
        const res = await fetch("/api/v1/finance/providers");
        if (res.ok) {
          const data = await res.json();
          setFinanceProviders(data);
        }
      } catch (err) {
        console.error("Failed to fetch finance providers", err);
      }
    };
    fetchFinanceProviders();
  }, []);

  // Close product dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent | TouchEvent) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
        setIsSearchingProduct(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("touchstart", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
  }, []);

  // Debounced product search
  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      setIsDropdownOpen(false);
      setIsSearchingProduct(false);
      return;
    }
    setIsSearchingProduct(true);
    const delayDebounce = setTimeout(async () => {
      try {
        const res = await getProducts(undefined, searchQuery, "Accessories", undefined, 15);
        const items = Array.isArray(res) ? res : res?.items || [];
        setSearchResults(items);
        setIsDropdownOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingProduct(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  // Rate helpers
  const getItemEffectivePrice = (item: any): number => {
    if (
      item.configuredPrice !== undefined &&
      item.configuredPrice !== null &&
      !isNaN(Number(item.configuredPrice)) &&
      Number(item.configuredPrice) >= 0
    ) {
      return Number(item.configuredPrice);
    }
    return Number(item.product?.sellingPrice || 0);
  };

  const startEditingRate = (item: any) => {
    setEditingRateCartItemId(item.cartItemId);
    const currentRate =
      item.configuredPrice !== undefined ? item.configuredPrice : item.product.sellingPrice;
    setTempRate(currentRate.toString());
  };

  const saveCustomRate = (cartItemId: string) => {
    const parsed = parseFloat(tempRate);
    if (!isNaN(parsed) && parsed >= 0) {
      setCart((prev) =>
        prev.map((item) =>
          item.cartItemId === cartItemId ? { ...item, configuredPrice: parsed } : item
        )
      );
    }
    setEditingRateCartItemId(null);
    setTempRate("");
  };

  const cancelCustomRate = () => {
    setEditingRateCartItemId(null);
    setTempRate("");
  };

  const resetToCatalogRate = (cartItemId: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, configuredPrice: undefined } : item
      )
    );
    if (editingRateCartItemId === cartItemId) {
      setEditingRateCartItemId(null);
      setTempRate("");
    }
  };

  // Cart actions
  const addToCart = async (product: any) => {
    const existing = cart.find((item) => item.product.id === product.id);

    if (existing && product.productType === "quantity") {
      if (existing.quantity < product.quantityInStock) {
        setCart(
          cart.map((item) =>
            item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
          )
        );
      }
      setSearchQuery("");
      setSearchResults([]);
      setIsSearchingProduct(false);
      setIsDropdownOpen(false);
      return;
    }

    try {
      const res = await fetch(`/api/v1/products/${product.id}`);
      const fullProduct = await res.json();

      let smartUnitId = "";
      if (fullProduct.units && fullProduct.units.length > 0) {
        const alreadySelectedIds = cart
          .filter((item) => item.product.id === fullProduct.id)
          .map((item) => item.selectedUnitId);

        const availableUnit = fullProduct.units.find(
          (u: any) => !alreadySelectedIds.includes(u.id.toString())
        );
        smartUnitId = availableUnit
          ? availableUnit.id.toString()
          : fullProduct.units[0].id.toString();
      }

      const newItem = {
        cartItemId: Math.random().toString(36).substring(2, 9),
        product: fullProduct,
        quantity: 1,
        selectedUnitId: smartUnitId,
      };

      setCart([...cart, newItem]);
      setSearchQuery("");
      setSearchResults([]);
      setIsSearchingProduct(false);
      setIsDropdownOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePhoneChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPhone(value);

    if (value.length === 10) {
      setIsSearchingCustomer(true);
      try {
        const cust = await searchCustomer(value);
        if (cust) {
          if (cust.name) setCustomerName((prev) => (prev.trim() === "" ? cust.name : prev));
          if (cust.address) setCustomerAddress((prev) => (prev.trim() === "" ? cust.address : prev));
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsSearchingCustomer(false);
      }
    }
  };

  const removeFromCart = (cartItemId: string) => {
    const targetItem = cart.find((item) => item.cartItemId === cartItemId);
    if (!targetItem) return;

    if (editingBill && targetItem.isExisting) {
      if (cart.length <= 1) {
        setError(
          "Cannot remove the last item from an existing bill. Use Void Bill in Billing History instead."
        );
        showToast("A bill must contain at least one item.", "error");
        return;
      }
      setItemPendingRemoval(targetItem);
      return;
    }

    setCart(cart.filter((item) => item.cartItemId !== cartItemId));
  };

  const confirmRemoveExistingItem = async () => {
    if (!editingBill || !itemPendingRemoval) return;
    setIsRemovingItem(true);
    setError("");
    try {
      const res = await removeBillItem(editingBill.id, itemPendingRemoval.billItemId);
      setCart((prev) => prev.filter((item) => item.cartItemId !== itemPendingRemoval.cartItemId));
      if (res.bill) {
        setEditingBill(res.bill);
        setPaidAmount(String(Number(res.bill.paidAmount ?? 0)));
      }
      await mutate(() => true);
      const refundNote = res.refundedAmount > 0 ? ` Refund marked: ₹${res.refundedAmount}.` : "";
      showToast(
        `Stock restored for ${res.restoredProductName} (+${res.restoredQuantity}). Bill updated.${refundNote}`,
        "success"
      );
      setItemPendingRemoval(null);
    } catch (err: any) {
      setError(err.message || "Failed to remove item and restore stock");
      showToast(err.message || "Failed to remove item", "error");
    } finally {
      setIsRemovingItem(false);
    }
  };

  const updateQuantity = (cartItemId: string, qty: number) => {
    setCart(
      cart.map((item) => (item.cartItemId === cartItemId ? { ...item, quantity: qty } : item))
    );
  };

  const updateSelectedUnit = (cartItemId: string, unitId: string) => {
    setCart(
      cart.map((item) =>
        item.cartItemId === cartItemId
          ? {
              ...item,
              selectedUnitId: unitId === "__MANUAL__" ? "" : unitId,
              useManualSerial: unitId === "__MANUAL__",
            }
          : item
      )
    );
  };

  const updateCustomSerial = (cartItemId: string, serial: string) => {
    setCart(
      cart.map((item) =>
        item.cartItemId === cartItemId ? { ...item, customSerialNumber: serial } : item
      )
    );
  };

  // Calculations
  const grossTotal = cart.reduce(
    (sum, item) => sum + getItemEffectivePrice(item) * item.quantity,
    0
  );
  const discountVal = parseFloat(discount || "0");
  const grossAfterDiscount = grossTotal - discountVal;
  const totalGstPercent = parseFloat(sgstPercent || "0") + parseFloat(cgstPercent || "0");
  const taxableAmount = grossAfterDiscount / (1 + totalGstPercent / 100);
  const totalAmount = grossAfterDiscount;

  // Checkout & Update
  const handleCheckout = async () => {
    if (cart.length === 0) {
      setError("Please add at least one item to the cart");
      return;
    }
    if (customerName.trim() === "") {
      setError("Customer Name is required to generate an invoice.");
      return;
    }
    if (phone.trim() === "") {
      setError("Customer Phone number is required to generate an invoice.");
      return;
    }
    if (phone.trim().length !== 10) {
      setError("Customer Phone number must be exactly 10 digits");
      return;
    }
    if (paymentMode.toLowerCase() === "finance") {
      if (!financeProviderId) {
        setError("Please select a Finance Provider");
        return;
      }
      if (!emiAmount || parseFloat(emiAmount) <= 0) {
        setError("Please enter a valid EMI Amount");
        return;
      }
      if (!financeMonths || parseInt(financeMonths) <= 0) {
        setError("Please enter valid Months");
        return;
      }
    }
    for (const item of cart) {
      if (item.product.productType !== "quantity" && !item.isExisting) {
        const hasUnit = Boolean(item.selectedUnitId);
        const hasCustomSerial = Boolean(item.customSerialNumber && item.customSerialNumber.trim());
        if (!hasUnit && !hasCustomSerial) {
          setError(`Please select or enter a serial number for ${item.product.name}`);
          return;
        }
      }
    }
    setError("");
    if (editingBill) {
      setShowEditSummaryModal(true);
      return;
    }
    setIsSaving(true);

    try {
      const itemsPayload = cart.map((item) => {
        const effectivePrice = getItemEffectivePrice(item);
        return {
          productId: item.product.id,
          quantity: item.quantity,
          configuredPrice:
            item.configuredPrice !== undefined ? Number(item.configuredPrice) : undefined,
          unitPrice: effectivePrice,
          productUnitId:
            item.product.productType !== "quantity" && item.selectedUnitId
              ? parseInt(item.selectedUnitId)
              : undefined,
          serialNumber:
            item.product.productType !== "quantity" &&
            !item.selectedUnitId &&
            item.customSerialNumber?.trim()
              ? item.customSerialNumber.trim()
              : undefined,
        };
      });

      const billData: any = {
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerPhone: phone.trim(),
        paymentMode,
        discount: discountVal,
        sgstPercent: parseFloat(sgstPercent || "0"),
        cgstPercent: parseFloat(cgstPercent || "0"),
        paidAmount: paidAmount === "" ? totalAmount : parseFloat(paidAmount),
        items: itemsPayload,
      };

      if (paymentMode.toLowerCase() === "finance") {
        billData.financeProviderId = financeProviderId;
        billData.emiAmount = emiAmount;
        billData.financeMonths = financeMonths;
      }

      const bill = await createBill(billData);
      await mutate(() => true);
      setCreatedBill(bill);
      setShowPrintModal(true);

      if (billData.customerPhone) {
        try {
          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const blob = await generateBillPdfBlob(bill);
          const formData = new FormData();
          formData.append("file", blob, `Laxmi_Invoice_${bill.billNumber}.pdf`);
          formData.append("customerName", billData.customerName);
          if (billData.customerAddress) {
            formData.append("customerAddress", billData.customerAddress);
          }
          formData.append("mobileNumber", billData.customerPhone);
          formData.append("billNumber", bill.billNumber);

          fetch(`/api/v1/bills/${bill.id}/whatsapp/upload`, {
            method: "POST",
            body: formData,
          }).catch((err) => console.error("Auto-whatsapp send failed", err));
        } catch (err) {
          console.error("Auto PDF generation failed", err);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to create invoice");
    } finally {
      setIsSaving(false);
    }
  };

  const confirmUpdateBill = async () => {
    if (!editingBill) return;
    setIsSaving(true);
    setError("");

    try {
      const itemsPayload = cart.map((item) => {
        const effectivePrice = getItemEffectivePrice(item);
        return {
          billItemId: item.isExisting ? item.billItemId : undefined,
          productId: item.product.id,
          quantity: item.quantity,
          configuredPrice:
            item.configuredPrice !== undefined ? Number(item.configuredPrice) : undefined,
          unitPrice: effectivePrice,
          productUnitId:
            item.product.productType !== "quantity" && item.selectedUnitId
              ? parseInt(item.selectedUnitId)
              : undefined,
          serialNumber:
            item.product.productType !== "quantity" &&
            !item.selectedUnitId &&
            item.customSerialNumber?.trim()
              ? item.customSerialNumber.trim()
              : undefined,
        };
      });

      const billData: any = {
        customerName: customerName.trim(),
        customerAddress: customerAddress.trim(),
        customerPhone: phone.trim(),
        paymentMode,
        discount: discountVal,
        sgstPercent: parseFloat(sgstPercent || "0"),
        cgstPercent: parseFloat(cgstPercent || "0"),
        paidAmount: paidAmount === "" ? totalAmount : parseFloat(paidAmount),
        items: itemsPayload,
      };

      if (paymentMode.toLowerCase() === "finance") {
        billData.financeProviderId = financeProviderId;
        billData.emiAmount = emiAmount;
        billData.financeMonths = financeMonths;
      }

      const res = await updateBill(editingBill.id, billData);
      const updatedBill = res.bill;
      await mutate(() => true);
      setShowEditSummaryModal(false);
      setEditingBill(updatedBill);
      setCreatedBill(updatedBill);
      setShowPrintModal(true);

      if (billData.customerPhone) {
        try {
          const { generateBillPdfBlob } = await import("@/lib/client-pdf");
          const blob = await generateBillPdfBlob(updatedBill);
          const formData = new FormData();
          formData.append("file", blob, `Laxmi_Invoice_${updatedBill.billNumber}.pdf`);
          formData.append("customerName", billData.customerName);
          if (billData.customerAddress) {
            formData.append("customerAddress", billData.customerAddress);
          }
          formData.append("mobileNumber", billData.customerPhone);
          formData.append("billNumber", updatedBill.billNumber);
          formData.append(
            "customMessage",
            `Hello ${billData.customerName}, your invoice #${updatedBill.billNumber} at Laxmi Electronics & Furniture has been updated. Revised Total: ₹${Number(updatedBill.totalAmount).toLocaleString("en-IN")}${Number(updatedBill.dueAmount) > 0 ? ` (Due: ₹${Number(updatedBill.dueAmount).toLocaleString("en-IN")})` : " (Paid)"}. Please find your updated bill attached.`
          );

          fetch(`/api/v1/bills/${updatedBill.id}/whatsapp/upload`, {
            method: "POST",
            body: formData,
          }).catch((err) => console.error("Auto-whatsapp update send failed", err));
        } catch (err) {
          console.error("Auto PDF generation failed for updated bill", err);
        }
      }

      const refundNote = res.refundedAmount > 0 ? ` (Refund marked: ₹${res.refundedAmount})` : "";
      showToast(
        `Bill #${updatedBill.billNumber} updated successfully${refundNote}${billData.customerPhone ? " & sent to WhatsApp!" : "!"}`,
        "success"
      );
    } catch (err: any) {
      setError(err.message || "Failed to update invoice");
      showToast(err.message || "Failed to update invoice", "error");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = useReactToPrint({
    contentRef: printComponentRef,
    documentTitle: `Laxmi_Invoice_${createdBill?.billNumber || ""}`,
  });

  const closePrintModal = () => {
    setShowPrintModal(false);
    setCreatedBill(null);
    if (editingBill) {
      router.push("/billing/history");
      return;
    }
    setCart([]);
    setPhone("");
    setCustomerName("");
    setCustomerAddress("");
    setDiscount("0");
    setPaidAmount("");
    setSgstPercent("0");
    setCgstPercent("0");
    setFinanceProviderId("");
    setEmiAmount("");
    setFinanceMonths("");
  };

  const navigateToHistory = () => router.push("/billing/history");

  return {
    // Refs
    searchContainerRef,
    printComponentRef,
    // Search & Cart
    searchQuery,
    setSearchQuery,
    searchResults,
    setSearchResults,
    isSearchingProduct,
    setIsSearchingProduct,
    isDropdownOpen,
    setIsDropdownOpen,
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    updateSelectedUnit,
    updateCustomSerial,
    // Rate editing
    editingRateCartItemId,
    tempRate,
    setTempRate,
    getItemEffectivePrice,
    startEditingRate,
    saveCustomRate,
    cancelCustomRate,
    resetToCatalogRate,
    // Customer & Billing metadata
    phone,
    handlePhoneChange,
    customerName,
    setCustomerName,
    customerAddress,
    setCustomerAddress,
    isSearchingCustomer,
    paymentMode,
    setPaymentMode,
    discount,
    setDiscount,
    sgstPercent,
    setSgstPercent,
    cgstPercent,
    setCgstPercent,
    paidAmount,
    setPaidAmount,
    financeProviders,
    financeProviderId,
    setFinanceProviderId,
    emiAmount,
    setEmiAmount,
    financeMonths,
    setFinanceMonths,
    // Totals
    grossTotal,
    taxableAmount,
    totalAmount,
    // Status & Actions
    isSaving,
    error,
    handleNumberKeyDown,
    handleCheckout,
    confirmUpdateBill,
    handlePrint,
    closePrintModal,
    navigateToHistory,
    // Modals & Edit mode
    editingBill,
    isLoadingEditBill,
    itemPendingRemoval,
    setItemPendingRemoval,
    isRemovingItem,
    confirmRemoveExistingItem,
    showEditSummaryModal,
    setShowEditSummaryModal,
    createdBill,
    activeCreatedBill,
    showPrintModal,
    showUpiModal,
    setShowUpiModal,
    toast,
  };
}
