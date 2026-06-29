"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EquipmentNavTree } from "@/lib/graphql/categories";

const CategoryTreeContext = createContext<EquipmentNavTree | null>(null);

type CategoryTreeProviderProps = {
  tree: EquipmentNavTree | null;
  children: ReactNode;
};

export function CategoryTreeProvider({ tree, children }: CategoryTreeProviderProps) {
  return (
    <CategoryTreeContext.Provider value={tree}>{children}</CategoryTreeContext.Provider>
  );
}

export function useCategoryTree() {
  return useContext(CategoryTreeContext);
}
