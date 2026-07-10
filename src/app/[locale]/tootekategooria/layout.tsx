import type { ReactNode } from "react";
import { EquipmentSubnav } from "@/components/navigation/equipment-subnav";

export default function TootekategooriaLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <EquipmentSubnav />
      {children}
    </>
  );
}
