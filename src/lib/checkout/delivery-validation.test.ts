import { describe, expect, it } from "vitest";
import { validateDelivery } from "@/lib/checkout/delivery-validation";

const messages = {
  required: "Required",
  emailInvalid: "Invalid email",
  checklistEmail: "Email",
  checklistCountry: "Country",
  checklistShipping: "Shipping",
  checklistPickup: "Pickup",
  checklistAddress: "Address",
  checklistName: "Name",
  checklistPhone: "Phone",
};

const baseInput = {
  email: "buyer@example.com",
  firstName: "Jane",
  lastName: "Doe",
  phone: "51234567",
  phoneCountry: "EE",
  address1: "",
  city: "",
  postcode: "",
  shippingCountry: "EE",
  selectedRateId: "flat_rate:1",
  needsAddress: false,
  needsPickupPoint: false,
  pickupPoint: null,
};

describe("validateDelivery", () => {
  it("passes when all required fields are complete", () => {
    const result = validateDelivery(baseInput, messages);

    expect(result.ready).toBe(true);
    expect(result.fieldErrors).toEqual({});
    expect(result.firstInvalidField).toBeNull();
  });

  it("flags invalid email before other fields", () => {
    const result = validateDelivery(
      { ...baseInput, email: "not-an-email" },
      messages,
    );

    expect(result.ready).toBe(false);
    expect(result.fieldErrors.email).toBe("Invalid email");
    expect(result.firstInvalidField).toBe("email");
  });

  it("requires pickup point when needed", () => {
    const result = validateDelivery(
      {
        ...baseInput,
        needsPickupPoint: true,
        pickupPoint: null,
      },
      messages,
    );

    expect(result.ready).toBe(false);
    expect(result.fieldErrors.pickupPoint).toBe("Required");
    expect(result.checklist.some((item) => item.id === "pickupPoint")).toBe(
      true,
    );
  });

  it("requires address fields when delivery needs an address", () => {
    const result = validateDelivery(
      {
        ...baseInput,
        needsAddress: true,
        address1: "",
        city: "",
        postcode: "",
      },
      messages,
    );

    expect(result.ready).toBe(false);
    expect(result.fieldErrors.address).toBe("Required");
    expect(result.fieldErrors.city).toBe("Required");
    expect(result.fieldErrors.postcode).toBe("Required");
  });
});
