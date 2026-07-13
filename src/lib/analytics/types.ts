export type Ga4Item = {
  item_id: string;
  item_name: string;
  item_brand?: string;
  item_category?: string;
  item_category2?: string;
  item_variant?: string;
  price?: number;
  quantity?: number;
  index?: number;
};

export type Ga4EcommercePayload = {
  currency?: string;
  value?: number;
  transaction_id?: string;
  tax?: number;
  shipping?: number;
  coupon?: string;
  payment_type?: string;
  shipping_tier?: string;
  item_list_id?: string;
  item_list_name?: string;
  items: Ga4Item[];
};
