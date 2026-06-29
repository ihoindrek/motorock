export type PickupCarrier =
  | "omniva"
  | "smartposti"
  | "dpd"
  | "gls"
  | "alzabox"
  | "novapost";

export type PickupPoint = {
  id: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  carrier: PickupCarrier;
};
