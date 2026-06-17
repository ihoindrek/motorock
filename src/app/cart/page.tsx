import { CartCheckoutView } from "@/components/shop/cart-checkout-view";

export const metadata = {
  title: "Cart",
  description: "Review your order, choose delivery, and checkout at Motorock.eu.",
};

export default function CartPage() {
  return <CartCheckoutView />;
}
