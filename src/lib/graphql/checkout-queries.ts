export const ALLOWED_COUNTRIES = `
  query AllowedCountries {
    allowedCountries
  }
`;

export const CART_SHIPPING = `
  query CartShipping {
    cart {
      subtotal
      shippingTotal
      total
      discountTotal
      needsShippingAddress
      chosenShippingMethods
      appliedCoupons {
        code
        discountAmount
      }
      availableShippingMethods {
        packageDetails
        rates {
          id
          label
          cost
          methodId
          instanceId
        }
      }
    }
  }
`;

export const CART_ITEM_KEYS = `
  query CartItemKeys {
    cart {
      contents(first: 100) {
        nodes {
          key
        }
      }
    }
  }
`;

export const CART_ITEM_COUNT = `
  query CartItemCount {
    cart {
      contents {
        itemCount
      }
    }
  }
`;

/** Checkout resolves products by slug (EN catalog). Omit WPML `translations` — some
 *  products expose variation rows there and WooGraphQL rejects the whole query. */
const RESOLVE_PRODUCT_FIELDS = `
  databaseId
  languageCode
  ... on SimpleProduct {
    __typename
  }
  ... on VariableProduct {
    __typename
    variations(first: 100) {
      nodes {
        databaseId
        attributes {
          nodes {
            name
            value
          }
        }
      }
    }
  }
`;

export const RESOLVE_PRODUCT_IDS = `
  query ResolveProductIds($slug: ID!) {
    product(id: $slug, idType: SLUG) {
      ${RESOLVE_PRODUCT_FIELDS}
    }
  }
`;

export const RESOLVE_PRODUCT_BY_ID = `
  query ResolveProductById($id: ID!) {
    product(id: $id, idType: DATABASE_ID) {
      ${RESOLVE_PRODUCT_FIELDS}
    }
  }
`;

export const EMPTY_CART = `
  mutation EmptyCart {
    emptyCart(input: { clearPersistentCart: true }) {
      cart {
        isEmpty
      }
    }
  }
`;

export const ADD_TO_CART = `
  mutation AddToCart($input: AddToCartInput!) {
    addToCart(input: $input) {
      cart {
        isEmpty
        contents {
          itemCount
        }
      }
    }
  }
`;

export const UPDATE_CUSTOMER = `
  mutation UpdateCustomer($input: UpdateCustomerInput!) {
    updateCustomer(input: $input) {
      customer {
        shipping {
          country
          postcode
          city
          address1
        }
      }
    }
  }
`;

export const UPDATE_SHIPPING_METHOD = `
  mutation UpdateShippingMethod($input: UpdateShippingMethodInput!) {
    updateShippingMethod(input: $input) {
      cart {
        subtotal
        shippingTotal
        total
        discountTotal
        chosenShippingMethods
        appliedCoupons {
          code
          discountAmount
        }
        availableShippingMethods {
          rates {
            id
            label
            cost
            methodId
            instanceId
          }
        }
      }
    }
  }
`;

const CART_TOTALS_FRAGMENT = `
  subtotal
  shippingTotal
  total
  discountTotal
  needsShippingAddress
  chosenShippingMethods
  appliedCoupons {
    code
    discountAmount
  }
  availableShippingMethods {
    packageDetails
    rates {
      id
      label
      cost
      methodId
      instanceId
    }
  }
`;

export const APPLY_COUPON = `
  mutation ApplyCoupon($input: ApplyCouponInput!) {
    applyCoupon(input: $input) {
      cart {
        ${CART_TOTALS_FRAGMENT}
      }
    }
  }
`;

export const REMOVE_COUPONS = `
  mutation RemoveCoupons($input: RemoveCouponsInput!) {
    removeCoupons(input: $input) {
      cart {
        ${CART_TOTALS_FRAGMENT}
      }
    }
  }
`;

export const PAYMENT_GATEWAYS = `
  query PaymentGateways {
    paymentGateways {
      nodes {
        id
        title
        description
        icon
      }
    }
  }
`;

export const CHECKOUT = `
  mutation Checkout($input: CheckoutInput!) {
    checkout(input: $input) {
      result
      redirect
      order {
        databaseId
        orderNumber
      }
    }
  }
`;
