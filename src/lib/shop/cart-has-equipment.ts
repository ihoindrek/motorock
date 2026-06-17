import type { CartLine } from "@/context/cart-context";

export function cartHasEquipment(lines: readonly CartLine[]) {
  return lines.some((line) => line.type !== "motorcycle");
}
