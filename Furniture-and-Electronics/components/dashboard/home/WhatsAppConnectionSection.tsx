"use client";

import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { FaWhatsapp } from "react-icons/fa";
import { Modal } from "@/components/ui/modal";
import TactileButton from "@/components/ui/TactileButton";

interface WhatsAppConnectionSectionProps {
  whatsappSettings: any;
  mutateWhatsappSettings: (data?: any, shouldRevalidate?: boolean) => Promise<any>;
}

export default function WhatsAppConnectionSection({
  whatsappSettings,
  mutateWhatsappSettings,
}: WhatsAppConnectionSectionProps) {
  const setWhatsappSettings = (data: any) => mutateWhatsappSettings(data, false);
  const [whatsappLoading, setWhatsappLoading] = useState(false);
  const [whatsappDisconnecting, setWhatsappDisconnecting] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);

  useEffect(() => {
    if (!whatsappSettings) return;

    if (whatsappSettings.status === "connected" && showQrModal) {
      setShowQrModal(false);
      return;
    }

    if (
      whatsappSettings.status !== "connecting" &&
      whatsappSettings.status !== "QR_READY" &&
      !showQrModal
    ) {
      return;
    }

    let timeoutId: NodeJS.Timeout;

    const poll = async () => {
      try {
        const res = await fetch(`/api/v1/whatsapp/settings?t=${Date.now()}`, {
          cache: "no-store",
        });
        if (res.ok) {
          const data = await res.json();
          setWhatsappSettings(data);

          if (
            data.status === "connecting" ||
            data.status === "QR_READY" ||
            showQrModal
          ) {
            if (data.status !== "connected") {
              timeoutId = setTimeout(poll, 2000);
            }
          }
        }
      } catch (err) {
        console.error("Failed to fetch WhatsApp settings:", err);
        timeoutId = setTimeout(poll, 2000);
      }
    };

    timeoutId = setTimeout(poll, 2000);
    return () => clearTimeout(timeoutId);
  }, [whatsappSettings?.status, showQrModal]);

  const handleConnectWhatsapp = async () => {
    if (whatsappSettings?.status === "connected") {
      alert("WhatsApp is already connected.");
      return;
    }
    try {
      setWhatsappLoading(true);
      const res = await fetch("/api/v1/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "connecting" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to start WhatsApp connection. Please try again.");
        return;
      }

      const data = await res.json();
      setWhatsappSettings(data);
      setShowQrModal(true);
    } catch (err) {
      console.error(err);
      alert("Failed to connect. Check your network and try again.");
    } finally {
      setWhatsappLoading(false);
    }
  };

  const handleDisconnectWhatsapp = async () => {
    if (
      !confirm(
        "Are you sure you want to disconnect WhatsApp? This will log out the session and clear credentials."
      )
    ) {
      return;
    }
    try {
      setWhatsappDisconnecting(true);
      const res = await fetch("/api/v1/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disconnected" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWhatsappDisconnecting(false);
    }
  };

  const handleCancelPairing = async () => {
    setShowQrModal(false);
    try {
      setWhatsappDisconnecting(true);
      const res = await fetch("/api/v1/whatsapp/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "disconnected" }),
      });
      if (res.ok) {
        const data = await res.json();
        setWhatsappSettings(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setWhatsappDisconnecting(false);
    }
  };

  return (
    <>
      <div className="bg-white p-3.5 sm:p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-6 transition-all duration-300 hover:shadow-md">
        <div className="flex items-center sm:items-start gap-3 sm:gap-4 min-w-0">
          <div className="p-2 sm:p-3 bg-green-50 text-green-600 rounded-xl shrink-0">
            <FaWhatsapp className="w-6 h-6 sm:w-8 sm:h-8" />
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-sm sm:text-lg font-bold text-gray-800 flex items-center gap-2 flex-wrap">
              <span>WhatsApp Invoice Delivery</span>
              {whatsappSettings?.enabled && (
                <span
                  className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase ${
                    whatsappSettings.status === "connected"
                      ? "bg-green-100 text-green-800 animate-pulse"
                      : whatsappSettings.status === "connecting" ||
                        whatsappSettings.status === "QR_READY"
                      ? "bg-amber-100 text-amber-800 animate-pulse"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {whatsappSettings.status}
                </span>
              )}
            </h3>
            <p className="text-[11px] sm:text-xs text-gray-500 mt-0.5 sm:mt-1 max-w-xl line-clamp-2 sm:line-clamp-none">
              Connect WhatsApp account to automatically deliver professionally-formatted PDF invoices directly to clients upon checkout.
            </p>
            {whatsappSettings?.status === "connected" && whatsappSettings?.ownerPhone && (
              <p className="text-[11px] sm:text-xs font-semibold text-green-700 mt-1.5 sm:mt-2 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-ping shrink-0"></span>
                <span className="truncate">
                  ✓ Paired:{" "}
                  <strong className="text-gray-900 font-bold">
                    {whatsappSettings.ownerName ? `${whatsappSettings.ownerName} ` : ""}
                    ({whatsappSettings.ownerPhone.length === 10
                      ? `+91 ${whatsappSettings.ownerPhone}`
                      : whatsappSettings.ownerPhone})
                  </strong>
                </span>
              </p>
            )}
          </div>
        </div>

        <div className="shrink-0 flex flex-col items-stretch sm:items-center gap-2">
          {!whatsappSettings ? (
            <button
              disabled
              className="bg-gray-100 text-gray-500 font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2 cursor-wait border border-gray-200"
            >
              <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
              Checking Status...
            </button>
          ) : whatsappSettings.status === "connected" ? (
            <TactileButton
              onClick={handleDisconnectWhatsapp}
              disabled={whatsappDisconnecting}
              variant="whatsapp-disconnect"
              size="md"
              className="w-full md:w-auto text-xs sm:text-sm"
            >
              {whatsappDisconnecting ? "Disconnecting..." : "❌ Disconnect Session"}
            </TactileButton>
          ) : whatsappSettings.status === "connecting" && !whatsappSettings.qrCode ? (
            <button
              disabled
              className="bg-amber-100 text-amber-700 font-bold py-2 px-4 sm:py-2.5 sm:px-6 rounded-lg text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              <div className="w-4 h-4 border-2 border-amber-300 border-t-amber-700 rounded-full animate-spin"></div>
              Connecting...
            </button>
          ) : (
            <TactileButton
              onClick={handleConnectWhatsapp}
              disabled={whatsappLoading}
              variant="whatsapp-connect"
              size="md"
              className="w-full md:w-auto text-xs sm:text-sm"
            >
              {whatsappLoading ? "Initializing..." : "🔌 Connect Now"}
            </TactileButton>
          )}
        </div>
      </div>

      {/* Official WhatsApp QR Connection Modal */}
      <Modal
        isOpen={showQrModal}
        onClose={handleCancelPairing}
        className="bg-[#F2F7F4] rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-[#D2E3D8]"
      >
        <div className="px-6 py-4 bg-green-600 text-white flex justify-between items-center">
          <h3 className="font-extrabold text-lg flex items-center gap-2">
            <span>💬</span> Link WhatsApp Device
          </h3>
          <button
            onClick={handleCancelPairing}
            className="text-white hover:text-gray-200 text-2xl font-bold focus:outline-none"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>

        <div className="p-6 flex flex-col items-center text-center">
          <p className="text-sm font-semibold text-gray-700 mb-5">
            Scan the QR code below using WhatsApp on your phone to link your account.
          </p>

          <div className="w-52 h-52 bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl flex items-center justify-center p-3 relative mb-5">
            {whatsappSettings?.qrCode ? (
              <QRCodeSVG
                value={whatsappSettings.qrCode}
                size={200}
                className="w-full h-full object-contain rounded-lg bg-white shadow-sm"
              />
            ) : (
              <div className="flex flex-col items-center justify-center gap-2">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-green-600"></div>
                <span className="text-xs font-bold text-gray-500">Generating QR code...</span>
              </div>
            )}
          </div>

          <div className="text-left w-full bg-gray-50 p-4 rounded-xl border border-gray-100 mb-6 space-y-2">
            <p className="text-xs font-bold text-gray-800 uppercase tracking-wider mb-1">
              How to link your phone:
            </p>
            <ol className="list-decimal list-inside text-xs text-gray-600 space-y-1.5 font-semibold">
              <li>Open WhatsApp on your phone</li>
              <li>Tap Menu (Android) or Settings (iPhone)</li>
              <li>
                Select <span className="font-extrabold text-gray-800">Linked Devices</span>
              </li>
              <li>
                Tap <span className="font-extrabold text-green-600">Link a Device</span> and point your camera here
              </li>
            </ol>
          </div>

          <div className="flex justify-end gap-3 w-full border-t pt-4">
            <button
              onClick={handleCancelPairing}
              disabled={whatsappDisconnecting}
              className="bg-gray-100 hover:bg-gray-200 text-gray-700 font-extrabold py-2.5 px-5 rounded-lg text-xs transition disabled:opacity-50"
            >
              Cancel Pairing
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
