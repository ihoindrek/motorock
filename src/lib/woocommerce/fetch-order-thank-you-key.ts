import { fetchOrderReturnContext } from "@/lib/woocommerce/fetch-order-return-context";

export async function fetchOrderThankYouKey(orderId: string) {
  const context = await fetchOrderReturnContext(orderId);
  return context?.key ?? null;
}
