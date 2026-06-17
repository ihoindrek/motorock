import type { ReactNode } from "react";
import { EquipmentSubnav } from "@/components/navigation/equipment-subnav";

export default function EquipmentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EquipmentSubnav />
      {children}
    </>
  );
}
