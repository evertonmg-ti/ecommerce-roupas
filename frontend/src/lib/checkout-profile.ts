export type CheckoutProfile = {
  customerName: string;
  customerEmail: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingAddress: string;
  shippingAddress2: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  notes: string;
};

export const emptyCheckoutProfile: CheckoutProfile = {
  customerName: "",
  customerEmail: "",
  paymentMethod: "PIX",
  shippingMethod: "STANDARD",
  shippingAddress: "",
  shippingAddress2: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
  notes: ""
};
