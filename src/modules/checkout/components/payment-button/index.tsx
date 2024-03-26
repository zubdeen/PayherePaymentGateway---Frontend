"use client"

import { Cart, PaymentSession } from "@medusajs/medusa"
import { Button } from "@medusajs/ui"
import { OnApproveActions, OnApproveData } from "@paypal/paypal-js"
import { PayPalButtons, usePayPalScriptReducer } from "@paypal/react-paypal-js"
import { useElements, useStripe } from "@stripe/react-stripe-js"
import { placeOrder } from "@modules/checkout/actions"
import React, { useEffect, useState } from "react"
import ErrorMessage from "../error-message"
import Spinner from "@modules/common/icons/spinner"
import Script from "next/script"
import Medusa from "@medusajs/medusa-js"

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
    case "stripe":
      return <StripePaymentButton notReady={notReady} cart={cart} />
    case "Cash On Delivery":
      return <CODpaymentMethod notReady={notReady} />
    case "Payhere":
      return <PayherePaymentMethod notReady={notReady} cart={cart}/>
    case "manual":
      return <ManualTestPaymentButton notReady={notReady} />
    case "paypal":
      return <PayPalPaymentButton notReady={notReady} cart={cart} />
    default:
      return <Button disabled>Select a payment method</Button>
  }
}

const StripePaymentButton = ({
  cart,
  notReady,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  notReady: boolean
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder().catch((e) => {
      console.log(e)
      setErrorMessage("An error occurred, please try again.")
      setSubmitting(false)
    })
  }

  const stripe = useStripe()
  const elements = useElements()
  const card = elements?.getElement("card")

  const session = cart.payment_session as PaymentSession

  const disabled = !stripe || !elements ? true : false

  const handlePayment = async () => {
    setSubmitting(true)

    if (!stripe || !elements || !card || !cart) {
      setSubmitting(false)
      return
    }

    await stripe
      .confirmCardPayment(session.data.client_secret as string, {
        payment_method: {
          card: card,
          billing_details: {
            name:
              cart.billing_address.first_name +
              " " +
              cart.billing_address.last_name,
            address: {
              city: cart.billing_address.city ?? undefined,
              country: cart.billing_address.country_code ?? undefined,
              line1: cart.billing_address.address_1 ?? undefined,
              line2: cart.billing_address.address_2 ?? undefined,
              postal_code: cart.billing_address.postal_code ?? undefined,
              state: cart.billing_address.province ?? undefined,
            },
            email: cart.email,
            phone: cart.billing_address.phone ?? undefined,
          },
        },
      })
      .then(({ error, paymentIntent }) => {
        if (error) {
          const pi = error.payment_intent

          if (
            (pi && pi.status === "requires_capture") ||
            (pi && pi.status === "succeeded")
          ) {
            onPaymentCompleted()
          }

          setErrorMessage(error.message || null)
          return
        }

        if (
          (paymentIntent && paymentIntent.status === "requires_capture") ||
          paymentIntent.status === "succeeded"
        ) {
          return onPaymentCompleted()
        }

        return
      })
  }

  return (
    <>
      <Button
        disabled={disabled || notReady}
        onClick={handlePayment}
        size="large"
        isLoading={submitting}
      >
        Place order
      </Button>
      <ErrorMessage error={errorMessage} />
    </>
  )
}

const PayPalPaymentButton = ({
  cart,
  notReady,
}: {
  cart: Omit<Cart, "refundable_amount" | "refunded_total">
  notReady: boolean
}) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder().catch(() => {
      setErrorMessage("An error occurred, please try again.")
      setSubmitting(false)
    })
  }

  const session = cart.payment_session as PaymentSession

  const handlePayment = async (
    _data: OnApproveData,
    actions: OnApproveActions
  ) => {
    actions?.order
      ?.authorize()
      .then((authorization) => {
        if (authorization.status !== "COMPLETED") {
          setErrorMessage(`An error occurred, status: ${authorization.status}`)
          return
        }
        onPaymentCompleted()
      })
      .catch(() => {
        setErrorMessage(`An unknown error occurred, please try again.`)
        setSubmitting(false)
      })
  }

  const [{ isPending, isResolved }] = usePayPalScriptReducer()

  if (isPending) {
    return <Spinner />
  }

  if (isResolved) {
    return (
      <>
        <PayPalButtons
          style={{ layout: "horizontal" }}
          createOrder={async () => session.data.id as string}
          onApprove={handlePayment}
          disabled={notReady || submitting || isPending}
        />
        <ErrorMessage error={errorMessage} />
      </>
    )
  }
}

const ManualTestPaymentButton = ({ notReady }: { notReady: boolean }) => {
  const [submitting, setSubmitting] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const onPaymentCompleted = async () => {
    await placeOrder().catch((err) => {
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
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [isResolved, setisResolved] = useState<boolean | null>(false)
  const medusa = new Medusa({
    baseUrl: process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000",
    maxRetries: 3,
  })
  const [originalCart, setOriginalCart] = useState<Omit<Cart, "refundable_amount" | "refunded_total"> | null>(null)

  useEffect(() => {
    medusa.carts.retrieve(cart.id, {
      expand: "billing_address, shipping_address, billing_address.currency, billing_address.country, shipping_address.country"
    }).then(({cart}) => {
      setOriginalCart(cart)
    })
  }, [medusa])


  const onPaymentCompleted = async () => {
    await placeOrder().catch(() => {
      setErrorMessage("An error occurred, please try again.")
      setSubmitting(false)
    })
  }

  const handlePayment = () => {
    if (!originalCart) {
      setErrorMessage("An error occurred, please try again.")
      return
    }
    setErrorMessage("")
    setSubmitting(true)
    const session = originalCart.payment_session as PaymentSession
    const billing_address = originalCart.billing_address
    const countryCode = originalCart.shipping_address?.country_code?.toLowerCase()
    var payment = {
      "sandbox": process.env.NODE_ENV !== 'production',
      "merchant_id": process.env.NEXT_PUBLIC_PAYHERE_MERCHANT_ID,    // Replace your Merchant ID
      "return_url": `${process.env.NEXT_PUBLIC_BASE_URL}/${countryCode}/order/confirmed/${originalCart.id}`,     // Important
      "cancel_url": `${process.env.NEXT_PUBLIC_BASE_URL}/${countryCode}/order/cancelled/${originalCart.id}`,     // Important
      "notify_url": `${process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL}/store/payhere/${session.id}`,
      "order_id": originalCart.id,
      "items": originalCart.items?.map(item => item.title)?.join(","),
      "amount": session.data.amount,
      "currency": originalCart.region.currency_code.toUpperCase(),
      "hash": session.data.hash, // *Replace with generated hash retrieved from backend
      "first_name": billing_address?.first_name,
      "last_name": billing_address?.last_name,
      "email": originalCart.email,
      "phone": billing_address?.phone,
      "address": [billing_address?.address_1, billing_address?.address_2].join(","),
      "city": billing_address?.city,
      "country": billing_address.country_code,
      "delivery_address": [originalCart.shipping_address?.address_1, originalCart.shipping_address?.address_2].join(","),
      "delivery_city": originalCart.shipping_address?.city,
      "delivery_country": originalCart.shipping_address?.country_code,
      "custom_1": session.id,
      "custom_2": session.data.id
    };
    // console.log(cart)
    console.log(payment);
    payhere.startPayment(payment);
    }
  return (
        <>
        <Script src="https://www.payhere.lk/lib/payhere.js"
          onReady={() => {
            if (window.payhere) {
              setisResolved(true);
              // Payment completed. It can be a successful failure.
              payhere.onCompleted = function onCompleted(orderId) {
                onPaymentCompleted()
                console.log("Payment completed. OrderID:" + orderId);
                setSubmitting(false);
                // Note: validate the payment and show success or failure page to the customer
              };

              // Payment window closed
              payhere.onDismissed = function onDismissed() {
                  // Note: Prompt user to pay again or show an error page
                  console.log("Payment dismissed");
                  setSubmitting(false);
              };

              // Error occurred
              payhere.onError = function onError(error) {
                  // Note: show an error page
                  setErrorMessage(error?.message);
                  console.log("Error:"  + error);
                  setSubmitting(false);
              };
            }
          }}
        />
        {
          isResolved && cart?
          <Button
          disabled={notReady}
          isLoading={submitting}
          onClick={handlePayment}
          size="large"
        >
          Place order
          </Button>: <Spinner />
        }
        <ErrorMessage error={errorMessage} />
        </>
  )
}

export default PaymentButton
