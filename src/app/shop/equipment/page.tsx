import type { Metadata } from "next";
import { EquipmentHubView } from "@/components/shop/equipment-hub-view";
import { equipmentHubCopy } from "@/data/equipment-hub";

export const revalidate = 300;

export const metadata: Metadata = {
  title: equipmentHubCopy.title,
  description: equipmentHubCopy.description,
};

export default function EquipmentHubPage() {
  return <EquipmentHubView />;
}
