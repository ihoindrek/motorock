export type PickupCarrier =
  | "omniva"
  | "smartposti"
  | "dpd"
  | "gls"
  | "alzabox"
  | "novapost";

export type PickupPoint = {
  /** Carrier-facing id (e.g. SmartPosti locker code) when known. */
  id: string;
  /** Montonio shipping method item id required for Woo checkout. */
  montonioItemId?: string;
  /** Carrier-assigned pickup id stored on the Woo order. */
  carrierAssignedId?: string;
  name: string;
  address: string;
  city: string;
  postcode: string;
  carrier: PickupCarrier;
};
