export {
  trackAddPaymentInfo,
  trackAddShippingInfo,
  trackAddToCart,
  trackBeginCheckout,
  trackPurchase,
  trackRemoveFromCart,
  trackSearch,
  trackViewCart,
  trackViewItem,
  trackViewItemList,
  trackViewMotorcycleProduct,
} from "@/lib/analytics/events";
export { canSendAnalyticsEvents, isAnalyticsConfigured } from "@/lib/analytics/consent";
export { hasTrackedPurchase } from "@/lib/analytics/data-layer";
