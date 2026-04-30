export type CheckoutProfile = {
  customerName: string;
  customerEmail: string;
  recipientName: string;
  customerDocument: string;
  customerPhone: string;
  paymentMethod: string;
  shippingMethod: string;
  shippingAddress: string;
  shippingNumber: string;
  shippingAddress2: string;
  shippingNeighborhood: string;
  shippingCity: string;
  shippingState: string;
  shippingPostalCode: string;
  useStoreCreditAmount: string;
  notes: string;
};

export const CHECKOUT_PROFILE_STORAGE_KEY = "maison-aurea-checkout-profile";

export const emptyCheckoutProfile: CheckoutProfile = {
  customerName: "",
  customerEmail: "",
  recipientName: "",
  customerDocument: "",
  customerPhone: "",
  paymentMethod: "PIX",
  shippingMethod: "STANDARD",
  shippingAddress: "",
  shippingNumber: "",
  shippingAddress2: "",
  shippingNeighborhood: "",
  shippingCity: "",
  shippingState: "",
  shippingPostalCode: "",
  useStoreCreditAmount: "",
  notes: ""
};
