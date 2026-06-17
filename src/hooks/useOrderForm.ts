import { useState, useCallback } from "react";
import type { WindowItem, GlassType } from "@/store/types";
import { calcOrderSummary, type OrderSummary } from "@/utils";

export interface WindowItemFormData {
  widthMm: number;
  heightMm: number;
  profileColor: string;
  glassType: GlassType;
  hardwareBrand: string;
  unitPrice: number;
  quantity: number;
}

const defaultItem: WindowItemFormData = {
  widthMm: 1500,
  heightMm: 1800,
  profileColor: "深咖色",
  glassType: "double",
  hardwareBrand: "好博 HOPO",
  unitPrice: 5000,
  quantity: 1,
};

export function useOrderForm(initialItems?: WindowItem[]) {
  const [items, setItems] = useState<WindowItemFormData[]>(
    initialItems && initialItems.length > 0
      ? initialItems.map((i) => ({
          widthMm: i.widthMm,
          heightMm: i.heightMm,
          profileColor: i.profileColor,
          glassType: i.glassType,
          hardwareBrand: i.hardwareBrand,
          unitPrice: i.unitPrice,
          quantity: i.quantity,
        }))
      : [{ ...defaultItem }]
  );

  const summary: OrderSummary = calcOrderSummary(
    items.map((i, idx) => ({ ...i, id: String(idx), orderId: "" }))
  );

  const addItem = useCallback(() => {
    setItems((prev) => [...prev, { ...defaultItem }]);
  }, []);

  const removeItem = useCallback((index: number) => {
    setItems((prev) =>
      prev.length > 1 ? prev.filter((_, i) => i !== index) : prev
    );
  }, []);

  const updateItem = useCallback(
    (index: number, field: keyof WindowItemFormData, value: string | number) => {
      setItems((prev) =>
        prev.map((item, i) =>
          i === index ? { ...item, [field]: value } : item
        )
      );
    },
    []
  );

  return {
    items,
    setItems,
    summary,
    addItem,
    removeItem,
    updateItem,
  };
}
