export type ParcelLocker = {
  id: string;
  city: string;
  name: string;
  address: string;
};

export const parcelLockers: readonly ParcelLocker[] = [
  {
    id: "tl-ulemiste",
    city: "Tallinn",
    name: "Ülemiste Centre",
    address: "Lennujaama tee 2",
  },
  {
    id: "tl-kristiine",
    city: "Tallinn",
    name: "Kristiine Keskus",
    address: "Endla 45",
  },
  {
    id: "tl-rocca",
    city: "Tallinn",
    name: "Rocca al Mare",
    address: "Paldiski mnt 102",
  },
  {
    id: "tr-centrum",
    city: "Tartu",
    name: "Centrum",
    address: "Riia 1",
  },
  {
    id: "tr-lounakeskus",
    city: "Tartu",
    name: "Lõunakeskus",
    address: "Lääneringtee 39",
  },
  {
    id: "pa-portartur",
    city: "Pärnu",
    name: "Port Artur 2",
    address: "Lai 37",
  },
] as const;
