"use client";
import { Cart, PaymentSession } from "@medusajs/medusa/dist/models"
import { Button, Heading } from "@medusajs/ui"
import { redirect, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { placeOrder } from "../../../../my-medusa-storefront/src/modules/checkout/actions";

type CheckoutProcessingTemplateProps = {
  cart: Omit<Cart, "refundable_amount" | "refunded_total"> | null;
}

export default function CheckoutProcessingTemplate({
  cart
}: CheckoutProcessingTemplateProps) {
  const [status, setStatus] = useState<string|null>(null)
  const [statusMessage, setStatusMessage] = useState<string|null>(null)
  const [isSuccess, setIsSuccess] = useState<boolean | null>(null)
  const router = useRouter()
  const initialized = useRef(false)

  useEffect(() => {
    if(initialized.current)
      return;
    const paymentSession = cart?.payment_session as PaymentSession
    const isSuccess = "payment_id" in paymentSession.data
      && paymentSession.data?.payment_id? true:false
    setIsSuccess(isSuccess)
    setStatus(isSuccess? "Success":"Error")
    setStatusMessage(isSuccess? "Checkout Confirmed. Placing Order...":"Checkout Failed")
    if(isSuccess && !initialized.current){
      initialized.current = true;
      onPaymentCompleted();
    }
  }, [])

  const onPaymentCompleted = async () => {
    await placeOrder()
    .then(() => {
      setStatusMessage("Order Placed Sucessfully...")
    })
    .catch((e) => {
      console.log(e);
      setStatusMessage("Order Placement failed. Contact support asap...")
      setStatus("Error")
    })
  }

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl content-container gap-y-10">
        <div className="flex flex-col w-full h-full max-w-4xl gap-4 py-10 bg-white">
          <Heading
            level="h1"
            className="flex flex-col mb-4 text-3xl gap-y-3 text-ui-fg-base"
          >
            <span>Please Wait...</span>
            <span>We're processing your purchase. You will be redirected.</span>
          </Heading>
          <Heading
            level="h2"
            className="flex flex-col mb-4 text-3xl gap-y-3 text-ui-fg-base"
          >
            <span>Status: {status}</span>
            <span>Description: {statusMessage}</span>
          </Heading>
        </div>
        <Button
        onClick={()=>{
          const countryCode = cart?.shipping_address?.country_code?.toLowerCase()
          router.push(`/${countryCode}/checkout`)
        }}
        hidden={isSuccess == null? false: isSuccess}
        size="large"
      >
        Go To Cart
      </Button>
      </div>
    </div>
  )
}
