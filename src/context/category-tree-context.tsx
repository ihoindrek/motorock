"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { EquipmentNavTree, WcCategoryEntry } from "@/lib/graphql/categories";

type CategoryNavContextValue = {
  tree: EquipmentNavTree | null;
  toolsCategory: WcCategoryEntry | null;
};

const CategoryNavContext = createContext<CategoryNavContextValue>({
  tree: null,
  toolsCategory: null,
});

type CategoryTreeProviderProps = {
  tree: EquipmentNavTree | null;
  toolsCategory?: WcCategoryEntry | null;
  children: ReactNode;
};

export function CategoryTreeProvider({
  tree,
  toolsCategory = null,
  children,
}: CategoryTreeProviderProps) {
  return (
    <CategoryNavContext.Provider value={{ tree, toolsCategory }}>
      {children}
    </CategoryNavContext.Provider>
  );
}

export function useCategoryTree() {
  return useContext(CategoryNavContext).tree;
}

export function useToolsCategory() {
  return useContext(CategoryNavContext).toolsCategory;
}
