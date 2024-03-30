"use client"

import { Cart, PaymentSession } from "@medusajs/medusa"
import { Button } from "@medusajs/ui"
import { placeOrder } from "@modules/checkout/actions"
import React, { useState } from "react"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"

declare global {
  namespace payhere {
    function onCompleted(orderId: String): void;
    function onDismissed(): void;
    function onError(error: Error): void;
    function startPayment(payment: Object): void | any;
  }
}

type PaymentButtonProps = {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
}

const PaymentButton: React.FC<PaymentButtonProps> = ({ cart }) => {
  const notReady =
    !cart ||
    !cart.shipping_address ||
    !cart.billing_address ||
    !cart.email ||
    cart.shipping_methods.length < 1
      ? true
      : false


  const paymentSession = cart.payment_session as PaymentSession
  switch (paymentSession.provider_id) {
    case "Cash on Delivery":
      return <CODpaymentMethod notReady={notReady} />
    case "Online Payment":
      return <PayherePaymentMethod notReady={notReady} cart={cart}/>
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const CODpaymentMethod = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder().catch((err) => {
      console.log(err)
      setErrorMessage(err.toString())
      setSubmitting(false)
    })
  }

  const handlePayment = () => {
    setSubmitting(true)
    onPaymentCompleted()
  }

  return (
    <>
      <Button
        disabled={notReady}
        isLoading={submitting}
        onClick={handlePayment}
        size="large"
      >
        Place order
      </Button>
      <ErrorMessage error={errorMessage} />
    </>
  )
}

const PayherePaymentMethod = ({
  cart,
  notReady,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  notReady: boolean
}) => {
  const [submitting, setSubmitting] = useState(false)


  const handlePayment = async () => {
    if (!cart) {
      return
    }
    setSubmitting(true)
    const session = cart.payment_session as PaymentSession
    const billing_address = cart.billing_address
    const countryCode = cart.shipping_address?.country_code?.toLowerCase()
    var payment = {
      "sandbox": process.env.NODE_ENV !== 'production',
      "merchant_id": process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID,    // Replace your Merchant ID
      "return_url": `${process.env.NEXT_PUBLIC_BASE_URL}/${countryCode}/checkout/processing/${cart.id}`,     // Important
      "cancel_url": `${process.env.NEXT_PUBLIC_BASE_URL}/${countryCode}/checkout/processing/${cart.id}`,     // Important
      // "notify_url": `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payhere/${session.id}`,
      "notify_url": `https://dbf0-2402-4000-2201-2110-118f-5880-ae10-4be2.ngrok-free.app/store/payhere/${session.id}`,
      "order_id": cart.id,
      "items": cart.items?.map(item => item.title)?.join(","),
      "amount": session.data.amount,
      "currency": cart.region.currency_code.toUpperCase(),
      "hash": session.data.hash, // *Replace with generated hash retrieved from backend
      "first_name": billing_address?.first_name,
      "last_name": billing_address?.last_name,
      "email": cart.email,
      "phone": billing_address?.phone,
      "address": [billing_address?.address_1, billing_address?.address_2].join(","),
      "city": billing_address?.city,
      "country": billing_address.country_code,
      "delivery_address": [cart.shipping_address?.address_1, cart.shipping_address?.address_2].join(","),
      "delivery_city": cart.shipping_address?.city,
      "delivery_country": cart.shipping_address?.country_code,
      "custom_1": session.id,
      "custom_2": session.data.id
    };

    // Create a new form
    const form = document.createElement('form');
    form.method = 'POST';

    // Iterate through the payment object and create input elements
    for (const [key, value] of Object.entries(payment)) {
      if (value !== undefined) {
        const input = document.createElement('input');
        input.type = 'hidden';
        input.name = key;
        input.value = value? value.toString():""; // Convert number and boolean values to strings
        form.appendChild(input);
      }
    }

    // Set the action URL based on the environment
    const actionUrl = process.env.NODE_ENV === 'production' ?
      'https://www.payhere.lk/pay/checkout' :
      'https://sandbox.payhere.lk/pay/checkout';
    form.action = actionUrl;

    // Append the form to the document and submit it
    document.body.appendChild(form);
    form.submit();
  }

  return (
        <>
        {
        cart?
          <Button
          disabled={notReady}
          isLoading={submitting}
          onClick={handlePayment}
          size="large"
        >
          Place order
          </Button>: <Spinner />
        }
        </>
  )
}

export default PaymentButton
