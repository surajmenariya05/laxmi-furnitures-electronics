"use client";

import React from "react";
import { FaTimes } from "react-icons/fa";

interface ProductSearchBarProps {
  searchContainerRef: React.RefObject<HTMLDivElement | null>;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  searchResults: any[];
  setSearchResults: (items: any[]) => void;
  isSearchingProduct: boolean;
  setIsSearchingProduct: (val: boolean) => void;
  isDropdownOpen: boolean;
  setIsDropdownOpen: (val: boolean) => void;
  onSelectProduct: (product: any) => void;
}

export default function ProductSearchBar({
  searchContainerRef,
  searchQuery,
  setSearchQuery,
  searchResults,
  setSearchResults,
  isSearchingProduct,
  setIsSearchingProduct,
  isDropdownOpen,
  setIsDropdownOpen,
  onSelectProduct,
}: ProductSearchBarProps) {
  return (
    <div className="mb-5">
      <label className="block text-sm font-bold text-gray-700 mb-1">
        Search & Add Products <span className="text-red-500">*</span>
      </label>
      <div className="relative flex gap-2" ref={searchContainerRef}>
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Type brand or product name..."
            className="w-full border-2 border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-100 rounded-lg px-4 py-2 text-sm font-medium transition pr-12"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsDropdownOpen(true);
            }}
            onFocus={() => {
              if (searchResults.length > 0) setIsDropdownOpen(true);
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setIsDropdownOpen(false);
                setIsSearchingProduct(false);
              }
            }}
          />
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1.5">
            {isSearchingProduct && (
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            )}
            {searchQuery && (
              <button
                type="button"
                onClick={() => {
                  setSearchQuery("");
                  setSearchResults([]);
                  setIsDropdownOpen(false);
                  setIsSearchingProduct(false);
                }}
                className="text-gray-400 hover:text-gray-600 p-0.5 rounded-full hover:bg-gray-100 transition"
                title="Clear search"
              >
                <FaTimes className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
        {isDropdownOpen && searchQuery.trim().length >= 2 && !isSearchingProduct && (
          <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 mt-1.5 rounded-lg shadow-xl z-50 max-h-72 overflow-y-auto divide-y divide-gray-100">
            {searchResults.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-500 text-center">
                No matching products found
              </div>
            ) : (
              searchResults.map((p) => {
                const isOutOfStock = p.quantityInStock <= 0;
                return (
                  <button
                    key={p.id}
                    type="button"
                    disabled={isOutOfStock}
                    className={`w-full text-left px-4 py-3 flex justify-between items-center transition-colors ${
                      isOutOfStock
                        ? "bg-gray-50 opacity-60 cursor-not-allowed"
                        : "hover:bg-blue-50 cursor-pointer"
                    }`}
                    onClick={() => {
                      if (!isOutOfStock) {
                        onSelectProduct(p);
                        setIsDropdownOpen(false);
                      }
                    }}
                  >
                    <div>
                      <span className="font-semibold text-gray-900">{p.name}</span>
                      {p.brand && (
                        <span className="text-xs text-gray-500 ml-2">({p.brand})</span>
                      )}
                    </div>
                    <div className="text-sm flex items-center gap-3">
                      <span className="text-gray-900 font-bold">₹{p.sellingPrice}</span>
                      {isOutOfStock ? (
                        <span className="text-xs text-red-600 bg-red-50 px-2 py-1 rounded font-medium border border-red-100">
                          Out of Stock
                        </span>
                      ) : (
                        <span className="text-xs text-green-700 bg-green-50 px-2 py-1 rounded font-medium border border-green-100">
                          In Stock: {p.quantityInStock}
                        </span>
                      )}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}
