/**
 * Type declarations for the Razorpay Checkout script loaded via
 * `<script src="https://checkout.razorpay.com/v1/razorpay.js">`.
 *
 * The script exposes a global `Razorpay` constructor. These types let us call
 * `new Razorpay({ ... })` without TS errors.
 */

interface RazorpayOptions {
  key: string;
  order_id?: string;
  amount?: number;
  currency?: string;
  name?: string;
  description?: string;
  image?: string;
  prefill?: {
    name?: string;
    email?: string;
    contact?: string;
  };
  notes?: Record<string, string>;
  theme?: {
    color?: string;
    hide_topbar?: boolean;
  };
  handler?: (response: RazorpayResponse) => void;
  modal?: {
    ondismiss?: () => void;
  };
  _direct?: boolean;
}

interface RazorpayResponse {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void;
      close: () => void;
    };
  }
}

export {};