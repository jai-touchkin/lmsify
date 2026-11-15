/**
 * Payments feature — single flat file. Co-locates the API calls, TanStack Query
 * hooks, the Razorpay Checkout integration, and the CheckoutButton component.
 *
 * Same precedent as `auth.tsx` / `courses.tsx`: no nested folders, suppress
 * Fast Refresh's "only-export-components" warning.
 *
 * Scope (FE-4):
 *   - POST /api/v1/payment/create-order   (auth)
 *   - POST /api/v1/payment/verify         (auth)
 *
 * Out of scope: refunds, invoice download, admin payout dashboard.
 */
/* eslint-disable react-refresh/only-export-components */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link, useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import { api } from "@/api/client";
import { authKeys } from "@/features/auth";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { ENDPOINTS, ROUTES, courseDetailPath } from "@/api/endpoints";
import {
  type CreateOrderResponse,
  type CreateOrderAlreadyPaid,
  type VerifyPaymentResponse,
} from "@/api/schemas";

// ---------------------------------------------------------------------------
// API layer
// ---------------------------------------------------------------------------

const paymentsApi = {
  createOrder: (courseId: string) =>
    api
      .post<CreateOrderResponse | CreateOrderAlreadyPaid>(
        ENDPOINTS.paymentCreateOrder,
        { courseId },
      )
      .then((r) => r.data),
  verify: (body: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    courseId: string;
  }) =>
    api
      .post<VerifyPaymentResponse>(ENDPOINTS.paymentVerify, body)
      .then((r) => r.data),
};

// ---------------------------------------------------------------------------
// Query keys + hooks
// ---------------------------------------------------------------------------

export const paymentKeys = {
  createOrder: (courseId: string) => ["payment", "create-order", courseId] as const,
};

/** Create a Razorpay order. `alreadyPaid: true` means the user already owns the course. */
export function useCreateOrder() {
  const navigate = useNavigate();
  const verifyPayment = useVerifyPayment();
  return useMutation({
    mutationFn: (courseId: string) => paymentsApi.createOrder(courseId),
    onSuccess: (data) => {
      if ("alreadyPaid" in data && data.alreadyPaid) {
        toast.info("You're already enrolled in this course");
        navigate(courseDetailPath(data.courseId));
        return;
      }
      // data is CreateOrderResponse — hand off to Razorpay Checkout
      const order = data as CreateOrderResponse;
      openRazorpayCheckout(order, order.course.id, verifyPayment);
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? (err as Error)?.message ?? "Could not start checkout";
      toast.error(msg);
    },
  });
}

/** Verify payment after Razorpay returns. */
export function useVerifyPayment() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: paymentsApi.verify,
    onSuccess: (data) => {
      toast.success("Payment successful!");
      // The server just added this course to `purchasedCourses`. Without
      // refetching `/me` the store keeps the pre-purchase user, so the course
      // the student just bought would still show its paywall until a reload.
      void qc.invalidateQueries({ queryKey: authKeys.me });
      navigate(
        `${ROUTES.PAYMENT_SUCCESS}?courseId=${data.courseId}&reference=${data.reference}`,
      );
    },
    onError: (err) => {
      const msg =
        (err as { response?: { data?: { message?: string } } })?.response?.data
          ?.message ?? (err as Error)?.message ?? "Payment verification failed";
      toast.error(msg);
    },
  });
}

// ---------------------------------------------------------------------------
// Razorpay Checkout (client-side)
// ---------------------------------------------------------------------------

/**
 * Open the Razorpay Checkout modal. The `order` param comes from
 * `/payment/create-order` and contains everything Razorpay needs:
 *   - key (public API key)
 *   - order_id (Razorpay order ID)
 *   - amount, currency
 *   - course info for the description
 *
 * On success, Razorpay calls `handler` with the payment response.
 * We POST that to `/payment/verify` to grant access on the backend.
 *
 * Note: `openRazorpayCheckout` is called from `useCreateOrder.onSuccess`,
 * which already has `verifyPayment` in scope. Navigation to the success page
 * is handled inside `useVerifyPayment.onSuccess`.
 */
function openRazorpayCheckout(
  order: CreateOrderResponse,
  courseId: string,
  verifyPayment: ReturnType<typeof useVerifyPayment>,
) {
  if (typeof window.Razorpay !== "function") {
    toast.error("Payment system not loaded. Please refresh and try again.");
    return;
  }

  const rz = new window.Razorpay({
    key: order.key,
    order_id: order.orderId,
    amount: order.amount,
    currency: order.currency,
    name: "Lmsify",
    description: `Purchase: ${order.course.title}`,
    handler: (resp) => {
      // Razorpay calls this on success. The `resp` object contains:
      //   - razorpay_order_id
      //   - razorpay_payment_id
      //   - razorpay_signature (for server-side verification)
      verifyPayment.mutate({
        razorpay_order_id: resp.razorpay_order_id,
        razorpay_payment_id: resp.razorpay_payment_id,
        razorpay_signature: resp.razorpay_signature,
        courseId,
      });
    },
    modal: {
      ondismiss: () => {
        // User closed the modal without paying — quiet, no toast needed.
        // Could track this as an abandonment metric if desired.
      },
    },
  });

  // Open the checkout modal
  try {
    rz.open();
  } catch (err) {
    toast.error("Could not open payment modal");
    console.error("Razorpay error:", err);
  }
}

// ---------------------------------------------------------------------------
// CheckoutButton
// ---------------------------------------------------------------------------

export function CheckoutButton({ courseId }: { courseId: string }) {
  const { isAuthenticated } = useAuth();
  const createOrder = useCreateOrder();

  if (!isAuthenticated) {
    // Carry the course path through sign-in so the student lands back here.
    const next = encodeURIComponent(courseDetailPath(courseId));
    return (
      <Button asChild size="lg" className="w-full">
        <Link to={`${ROUTES.LOGIN}?next=${next}`}>Sign in to enrol</Link>
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full"
      onClick={() => createOrder.mutate(courseId)}
      disabled={createOrder.isPending}
    >
      {createOrder.isPending ? (
        <>
          <Loader2 className="size-4 animate-spin" />
          Opening checkout…
        </>
      ) : (
        "Enrol now"
      )}
    </Button>
  );
}