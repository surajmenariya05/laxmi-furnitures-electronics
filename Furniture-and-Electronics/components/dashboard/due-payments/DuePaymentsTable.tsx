"use client";

import React from "react";
import Link from "next/link";
import { FaWhatsapp, FaMoneyBillWave } from "react-icons/fa";

interface DuePaymentsTableProps {
  dues: any[];
  loading: boolean;
  sendingWhatsappId: number | null;
  calculateDaysPassed: (dateStr: string) => number;
  onSendWhatsapp: (bill: any) => void;
  onOpenPaymentModal: (bill: any) => void;
}

export default function DuePaymentsTable({
  dues,
  loading,
  sendingWhatsappId,
  calculateDaysPassed,
  onSendWhatsapp,
  onOpenPaymentModal,
}: DuePaymentsTableProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Bill No
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                Customer
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Total
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">
                Paid
              </th>
              <th className="px-6 py-3 text-right text-xs font-bold text-red-500 uppercase tracking-wider">
                Due Balance
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Action
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
                Remind
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loading ? (
              <tr>
                <td colSpan={8} className="px-6 py-8 text-center text-gray-500">
                  <div className="flex justify-center items-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <span className="ml-3 font-medium">Loading dues...</span>
                  </div>
                </td>
              </tr>
            ) : dues.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-12 text-center text-gray-500 font-medium">
                  No pending due payments found.
                </td>
              </tr>
            ) : (
              dues.map((bill: any) => {
                const daysPassed = calculateDaysPassed(bill.createdAt);
                const isOverdue = daysPassed >= 15;
                const isUnpaid = (bill.paymentStatus || "").toUpperCase() === "UNPAID";

                return (
                  <tr key={bill.id} className="hover:bg-gray-50/80 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <Link
                        href={`/billing/${bill.id}`}
                        className="text-sm font-black text-blue-600 hover:text-blue-800 hover:underline"
                      >
                        #{bill.billNumber}
                      </Link>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md inline-flex items-center gap-1 ${
                            (bill.department || "FURNITURE").toUpperCase() === "FURNITURE"
                              ? "bg-[#235347] text-white border border-[#2F6859] border-b-[#14352D] shadow-[0_1.5px_0_#14352D,inset_0_1px_0_rgba(255,255,255,0.25)]"
                              : "bg-[#093F52] text-white border border-[#105269] border-b-[#052531] shadow-[0_1.5px_0_#052531,inset_0_1px_0_rgba(255,255,255,0.25)]"
                          }`}
                        >
                          {(bill.department || "FURNITURE").toUpperCase() === "FURNITURE" ? (
                            <>
                              <img
                                src="/furniture-logo-icon.png"
                                alt="Furn"
                                className="w-3 h-3 object-contain inline-block shrink-0"
                              />
                              <span>FURN</span>
                            </>
                          ) : (
                            <>
                              <span>⚡</span>
                              <span>ELEC</span>
                            </>
                          )}
                        </span>
                        <span
                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md ${
                            isUnpaid
                              ? "bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)]"
                              : "bg-[#FEF9E7] text-[#854D0E] border border-[#FFCA3A] border-b-[#E5B020] shadow-[0_2px_4px_rgba(180,83,9,0.14),inset_0_1px_0_rgba(255,255,255,0.9)]"
                          }`}
                        >
                          {isUnpaid ? "UNPAID" : "PARTIAL"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                      <div>{new Date(bill.createdAt).toLocaleDateString()}</div>
                      {isOverdue ? (
                        <div className="text-[10px] font-bold mt-0.5 bg-[#FDF2F2] text-[#780000] border border-[#780000]/30 border-b-[#780000]/60 shadow-[0_2px_4px_rgba(120,0,0,0.12),inset_0_1px_0_rgba(255,255,255,0.9)] px-2 py-0.5 rounded inline-block">
                          Overdue ({daysPassed} days)
                        </div>
                      ) : (
                        <div className="text-[10px] text-gray-400 font-semibold mt-0.5">
                          {daysPassed} days ago
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-bold text-gray-900">
                        {bill.customer?.name || "Guest"}
                      </div>
                      <div className="text-xs text-gray-500 font-medium">
                        {bill.customer?.phone || "N/A"}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                      ₹{parseFloat(bill.totalAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-[#15803D]">
                      ₹{parseFloat(bill.paidAmount).toLocaleString("en-IN")}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-black text-[#780000] bg-red-50/20">
                      ₹{parseFloat(bill.dueAmount).toLocaleString("en-IN")}
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <button
                        type="button"
                        onClick={() => onOpenPaymentModal(bill)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition shadow-xs hover:shadow"
                        title="Collect Payment / Installment"
                      >
                        <FaMoneyBillWave className="w-3.5 h-3.5" />
                        <span>Collect</span>
                      </button>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <div className="flex justify-center items-center gap-3">
                        {bill.customer?.phone ? (
                          <button
                            onClick={() => onSendWhatsapp(bill)}
                            disabled={sendingWhatsappId === bill.id}
                            className="text-gray-400 hover:text-green-600 bg-gray-100 hover:bg-green-50 p-2 rounded-full transition disabled:opacity-50"
                            title="Send WhatsApp Reminder with Invoice PDF"
                          >
                            {sendingWhatsappId === bill.id ? (
                              <div className="animate-spin h-[1.1rem] w-[1.1rem] border-2 border-green-600 border-t-transparent rounded-full mx-auto" />
                            ) : (
                              <FaWhatsapp className="text-[1.1rem]" />
                            )}
                          </button>
                        ) : (
                          <span className="text-xs text-gray-400 font-medium">No Phone</span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
