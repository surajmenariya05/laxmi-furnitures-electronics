/*
 * From Uiverse.io by BridgerSilk - https://uiverse.io/BridgerSilk/empty-donkey-99
 * MIT License, Copyright (c) Nawsome, BridgerSilk (Silky)
 */

"use client";

import React from "react";
import styles from "./BanterLoader.module.css";

interface BanterLoaderProps {
  label?: string;
}

export default function BanterLoader({ label }: BanterLoaderProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-5">
      <div className={styles.banterLoader} aria-label={label || "Loading"}>
        {Array.from({ length: 9 }).map((_, index) => (
          <div key={index} className={styles.banterLoaderBox} />
        ))}
      </div>
      {label && (
        <p className="text-sm font-bold text-gray-700 tracking-wide animate-pulse">
          {label}
        </p>
      )}
    </div>
  );
}
