import {
  isShippingByAgreement,
  parseShippingRateCost,
  type ShippingRate,
} from "@/lib/shop/shipping-method";
import { isShowroomPickupRate } from "@/lib/shop/shipping-showroom-pickup";

export type CheapestDeliveryPick =
  | {
      kind: "priced";
      rate: ShippingRate;
      cost: number;
    }
  | {
      kind: "byAgreement";
      rate: ShippingRate;
    }
  | {
      kind: "free";
      rate: ShippingRate;
    };

/** Cheapest delivery to the destination — excludes showroom pickup. */
export function pickCheapestDeliveryRate(
  rates: readonly ShippingRate[],
): CheapestDeliveryPick | null {
  const delivery = rates.filter((rate) => !isShowroomPickupRate(rate));

  if (delivery.length === 0) {
    return null;
  }

  const priced = delivery
    .filter((rate) => !isShippingByAgreement(rate))
    .map((rate) => ({
      rate,
      cost: parseShippingRateCost(rate.cost),
    }))
    .sort((left, right) => left.cost - right.cost);

  if (priced.length > 0) {
    const cheapest = priced[0];
    if (cheapest.cost === 0) {
      return { kind: "free", rate: cheapest.rate };
    }

    return { kind: "priced", rate: cheapest.rate, cost: cheapest.cost };
  }

  const agreement = delivery.find((rate) => isShippingByAgreement(rate));
  if (agreement) {
    return { kind: "byAgreement", rate: agreement };
  }

  return null;
}
