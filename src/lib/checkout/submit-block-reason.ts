export type SubmitBlockReasonMessages = {
  terms: string;
  delivery: string;
  payment: string;
  montonioBank: string;
  pickupInvalid: string;
};

export type SubmitBlockChecklistItem = {
  label: string;
  complete: boolean;
};

export type SubmitBlockReasonInput = {
  termsAccepted: boolean;
  deliveryReady: boolean;
  deliveryChecklist?: readonly SubmitBlockChecklistItem[];
  paymentSelected: boolean;
  paymentLoading: boolean;
  paymentError: string | null;
  needsMontonioProvider: boolean;
  montonioOptionSelected: boolean;
  pickupValid: boolean;
  messages: SubmitBlockReasonMessages;
};

export function resolveSubmitBlockReason(
  input: SubmitBlockReasonInput,
): string | null {
  if (!input.termsAccepted) {
    return input.messages.terms;
  }

  if (!input.deliveryReady) {
    const incomplete = input.deliveryChecklist?.find((item) => !item.complete);
    return incomplete?.label ?? input.messages.delivery;
  }

  if (input.paymentLoading) {
    return input.messages.payment;
  }

  if (input.paymentError) {
    return input.messages.payment;
  }

  if (!input.paymentSelected) {
    return input.messages.payment;
  }

  if (input.needsMontonioProvider && !input.montonioOptionSelected) {
    return input.messages.montonioBank;
  }

  if (!input.pickupValid) {
    return input.messages.pickupInvalid;
  }

  return null;
}
