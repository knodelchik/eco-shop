'use client';

import { useMemo, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

interface PayPalCheckoutProps {
  cartItems: any[];
  shippingAddress: any;
  shippingType: string;
  // 👇 Додаємо ці поля, щоб TypeScript не сварився при білді
  amountUSD: number;
  shippingCost: number;
}

export default function PayPalCheckout({ 
  cartItems, 
  shippingAddress, 
  shippingType,
  // 👇 Деструктуризуємо їх (навіть якщо не використовуємо в логіці, щоб прийняти їх від батька)
  amountUSD,
  shippingCost
}: PayPalCheckoutProps) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const initialOptions = useMemo(() => ({
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID!,
    currency: "USD",
    intent: "capture",
  }), []);

  const handleCreateOrder = async () => {
    if (!shippingAddress || !shippingAddress.country_code) {
        const msg = "Please enter a valid shipping address first";
        toast.error(msg);
        throw new Error(msg);
    }

    try {
      setIsProcessing(true);
      const res = await fetch("/api/paypal/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          // Ми, як і раніше, не передаємо суму на бекенд (для безпеки),
          // але тепер компонент "знає" про ці пропси і не викликає помилку.
          items: cartItems,
          shippingAddress,
          shippingType,
        }),
      });

      const order = await res.json();
      
      if (!res.ok) {
        throw new Error(order.error || "Order creation failed");
      }
      
      return order.id;
    } catch (err: any) {
      setIsProcessing(false);
      if (!err.message.includes("popup")) {
          toast.error(err.message);
      }
      throw err;
    }
  };

  const handleApprove = async (data: any) => {
    try {
      const res = await fetch("/api/paypal/capture-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderID: data.orderID,
        }),
      });

      const details = await res.json();
      if (!res.ok) throw new Error(details.error || "Capture failed");

      const internalOrderId = details.data.purchase_units[0].reference_id;
      
      router.push(`/order/result?source=paypal&orderId=${internalOrderId}&status=success`);
      
    } catch (err: any) {
      console.error("PayPal Capture Error", err);
      toast.error("Payment failed. Please try again.");
      setIsProcessing(false);
    }
  };

  return (
    <div className={`w-full z-0 relative ${isProcessing ? 'opacity-50 pointer-events-none' : ''}`}>
      <PayPalScriptProvider options={initialOptions}>
        <div className="w-full transition-all duration-300 rounded-xl overflow-hidden bg-transparent dark:bg-neutral-100 dark:p-5 dark:shadow-md">
          <div className="hidden dark:block mb-3 text-sm font-medium text-neutral-500 text-center">
            Secure Checkout
          </div>

          <PayPalButtons
            style={{ 
              layout: "vertical", 
              shape: "rect", 
              color: "black",
              label: "pay"
            }}
            className="relative z-10"
            createOrder={handleCreateOrder}
            onApprove={handleApprove}
            onCancel={() => setIsProcessing(false)}
            onError={(err) => {
              console.error("PayPal Error:", err);
              toast.error("PayPal Error occurred. Check console.");
              setIsProcessing(false);
            }}
          />
        </div>
      </PayPalScriptProvider>
    </div>
  );
}