"use client";

import { Suspense } from "react";
import { FaEdit, FaArrowLeft, FaCheckCircle } from "react-icons/fa";
import { useBillingTerminal } from "@/hooks/useBillingTerminal";
import InvoiceTemplate from "@/components/dashboard/InvoiceTemplate";
import ProductSearchBar from "@/components/dashboard/billing/ProductSearchBar";
import BillingCartTable from "@/components/dashboard/billing/BillingCartTable";
import BillingCustomerPaymentForm from "@/components/dashboard/billing/BillingCustomerPaymentForm";
import BillingModals from "@/components/dashboard/billing/BillingModals";
import RemoveItemConfirmModal from "@/components/dashboard/billing/RemoveItemConfirmModal";
import EditBillSummaryModal from "@/components/dashboard/billing/EditBillSummaryModal";
import BanterLoader from "@/components/ui/BanterLoader";

export default function BillingPage() {
  return (
    <Suspense
      fallback={
        <div className="h-[calc(100vh-8rem)] flex items-center justify-center">
          <BanterLoader label="Loading billing terminal..." />
        </div>
      }
    >
      <BillingTerminal />
    </Suspense>
  );
}

function BillingTerminal() {
  const b = useBillingTerminal();

  return (
    <div className="relative grid grid-cols-1 xl:grid-cols-5 gap-6 h-[calc(100vh-8rem)]">
      {b.isLoadingEditBill && (
        <div className="absolute inset-0 z-40 bg-[#FAF6F0]/80 backdrop-blur-sm rounded-2xl flex items-center justify-center">
          <BanterLoader label="Loading bill details..." />
        </div>
      )}

      {/* LEFT: Live Invoice Preview */}
      <div className="xl:col-span-2 flex flex-col justify-start bg-[#F5F2ED]/95 backdrop-blur-md border border-[#E5DFD7] p-4 rounded-2xl shadow-sm overflow-y-auto max-h-full">
        <div className="flex justify-between items-center mb-3">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-400">
            Live Bill Preview
          </span>
          <span className="text-[10px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full font-bold">
            Real-time update
          </span>
        </div>
        <InvoiceTemplate
          isDraft={!b.editingBill}
          billNumber={b.editingBill ? b.editingBill.billNumber : "DRAFT"}
          createdAt={b.editingBill ? new Date(b.editingBill.createdAt) : new Date()}
          customerName={b.customerName}
          customerAddress={b.customerAddress}
          customerPhone={b.phone}
          cartItems={b.cart.map((item) => {
            const effectivePrice = b.getItemEffectivePrice(item);
            return {
              ...item,
              productUnit:
                item.customSerialNumber?.trim() && !item.selectedUnitId
                  ? { imeiNumber: item.customSerialNumber.trim() }
                  : item.productUnit,
              unitPrice: effectivePrice,
              configuredPrice: item.configuredPrice,
              lineTotal: effectivePrice * item.quantity,
              mrp: item.product.sellingPrice,
            };
          })}
          subtotal={b.taxableAmount}
          grossTotal={b.grossTotal}
          discount={parseFloat(b.discount || "0")}
          totalAmount={b.totalAmount}
          sgstPercent={b.sgstPercent}
          cgstPercent={b.cgstPercent}
          paidAmount={b.paidAmount ? parseFloat(b.paidAmount) : b.totalAmount}
          dueAmount={b.paidAmount ? b.totalAmount - parseFloat(b.paidAmount) : 0}
          paymentMode={b.paymentMode}
        />
      </div>

      {/* RIGHT: Input Form & Terminal */}
      <div className="xl:col-span-3 bg-[#F5F2ED]/95 backdrop-blur-md rounded-2xl shadow-sm border border-[#E5DFD7] p-6 flex flex-col h-full overflow-y-auto">
        {b.editingBill && (
          <div className="mb-4 px-4 py-2.5 rounded-xl bg-indigo-50 border border-indigo-200 flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-xs font-bold text-indigo-900">
              <FaEdit className="w-3.5 h-3.5 text-indigo-600 shrink-0" />
              <span>
                Editing Bill <span className="font-mono">#{b.editingBill.billNumber}</span>
                {b.editingBill.booking?.bookingNumber
                  ? ` (Booking ${b.editingBill.booking.bookingNumber})`
                  : ""}
              </span>
            </div>
            <button
              type="button"
              onClick={b.navigateToHistory}
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-700 hover:text-indigo-900 bg-white px-2.5 py-1 rounded-lg border border-indigo-200 transition"
            >
              <FaArrowLeft className="w-2.5 h-2.5" />
              <span>Cancel Edit</span>
            </button>
          </div>
        )}

        <h2 className="text-xl font-bold mb-4 text-black border-b pb-2 flex items-center justify-between">
          <span>
            {b.editingBill
              ? `Modify Invoice #${b.editingBill.billNumber}`
              : "POS Billing Terminal"}
          </span>
          <span className="text-xs text-red-500 font-normal">* Required fields</span>
        </h2>

        {b.error && (
          <div className="mb-4 text-red-600 bg-red-50 p-3 border border-red-100 rounded-lg text-sm font-semibold">
            {b.error}
          </div>
        )}

        <ProductSearchBar
          searchContainerRef={b.searchContainerRef}
          searchQuery={b.searchQuery}
          setSearchQuery={b.setSearchQuery}
          searchResults={b.searchResults}
          setSearchResults={b.setSearchResults}
          isSearchingProduct={b.isSearchingProduct}
          setIsSearchingProduct={b.setIsSearchingProduct}
          isDropdownOpen={b.isDropdownOpen}
          setIsDropdownOpen={b.setIsDropdownOpen}
          onSelectProduct={b.addToCart}
        />

        <BillingCartTable
          cart={b.cart}
          editingRateCartItemId={b.editingRateCartItemId}
          tempRate={b.tempRate}
          setTempRate={b.setTempRate}
          getItemEffectivePrice={b.getItemEffectivePrice}
          startEditingRate={b.startEditingRate}
          saveCustomRate={b.saveCustomRate}
          cancelCustomRate={b.cancelCustomRate}
          resetToCatalogRate={b.resetToCatalogRate}
          updateSelectedUnit={b.updateSelectedUnit}
          updateCustomSerial={b.updateCustomSerial}
          updateQuantity={b.updateQuantity}
          removeFromCart={b.removeFromCart}
          handleNumberKeyDown={b.handleNumberKeyDown}
        />

        <BillingCustomerPaymentForm
          phone={b.phone}
          handlePhoneChange={b.handlePhoneChange}
          isSearchingCustomer={b.isSearchingCustomer}
          customerName={b.customerName}
          setCustomerName={b.setCustomerName}
          customerAddress={b.customerAddress}
          setCustomerAddress={b.setCustomerAddress}
          paymentMode={b.paymentMode}
          setPaymentMode={b.setPaymentMode}
          onOpenUpiModal={() => b.setShowUpiModal(true)}
          discount={b.discount}
          setDiscount={b.setDiscount}
          sgstPercent={b.sgstPercent}
          setSgstPercent={b.setSgstPercent}
          cgstPercent={b.cgstPercent}
          setCgstPercent={b.setCgstPercent}
          paidAmount={b.paidAmount}
          setPaidAmount={b.setPaidAmount}
          grossTotal={b.grossTotal}
          totalAmount={b.totalAmount}
          cartLength={b.cart.length}
          isSaving={b.isSaving}
          isEditMode={Boolean(b.editingBill)}
          onCheckout={b.handleCheckout}
          handleNumberKeyDown={b.handleNumberKeyDown}
        />
      </div>

      <BillingModals
        showPrintModal={b.showPrintModal}
        createdBill={b.createdBill}
        activeCreatedBill={b.activeCreatedBill}
        closePrintModal={b.closePrintModal}
        handlePrint={b.handlePrint}
        printComponentRef={b.printComponentRef}
        isEditMode={Boolean(b.editingBill)}
        customerName={b.customerName}
        customerAddress={b.customerAddress}
        phone={b.phone}
        showUpiModal={b.showUpiModal}
        setShowUpiModal={b.setShowUpiModal}
      />

      <RemoveItemConfirmModal
        isOpen={Boolean(b.itemPendingRemoval)}
        itemName={b.itemPendingRemoval?.product?.name || "Product"}
        quantity={b.itemPendingRemoval?.quantity || 1}
        serialNumber={b.itemPendingRemoval?.productUnit?.imeiNumber || null}
        isBookingLinked={Boolean(b.editingBill?.bookingId)}
        isSubmitting={b.isRemovingItem}
        onConfirm={b.confirmRemoveExistingItem}
        onCancel={() => b.setItemPendingRemoval(null)}
      />

      <EditBillSummaryModal
        isOpen={b.showEditSummaryModal && Boolean(b.editingBill)}
        billNumber={b.editingBill?.billNumber || ""}
        previousTotal={Number(b.editingBill?.totalAmount || 0)}
        newTotal={b.totalAmount}
        previousPaid={Number(b.editingBill?.paidAmount || 0)}
        requestedPaid={
          b.paidAmount === "" ? b.totalAmount : parseFloat(b.paidAmount || "0")
        }
        addedItems={b.cart
          .filter((i) => !i.isExisting)
          .map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            lineTotal: b.getItemEffectivePrice(i) * i.quantity,
          }))}
        modifiedItems={b.cart
          .filter(
            (i) =>
              i.isExisting &&
              (i.quantity !== i.originalQuantity ||
                b.getItemEffectivePrice(i) !== i.originalUnitPrice)
          )
          .map((i) => ({
            name: i.product.name,
            quantity: i.quantity,
            lineTotal: b.getItemEffectivePrice(i) * i.quantity,
          }))}
        hasCustomerPhone={Boolean(b.phone.trim())}
        isSubmitting={b.isSaving}
        onConfirm={b.confirmUpdateBill}
        onCancel={() => b.setShowEditSummaryModal(false)}
      />

      {b.toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-xs font-bold transition-all ${
            b.toast.type === "error"
              ? "bg-rose-50 text-rose-900 border-rose-200"
              : "bg-emerald-50 text-emerald-900 border-emerald-200"
          }`}
        >
          <FaCheckCircle
            className={`w-4 h-4 shrink-0 ${
              b.toast.type === "error" ? "text-rose-600" : "text-emerald-600"
            }`}
          />
          <span>{b.toast.text}</span>
        </div>
      )}
    </div>
  );
}
