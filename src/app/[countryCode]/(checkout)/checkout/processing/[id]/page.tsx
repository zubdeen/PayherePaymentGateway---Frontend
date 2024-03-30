import { Metadata } from "next"

import { getCart } from "@lib/data"
import CheckoutProcessingTemplate from "@modules/checkout/templates/checkout-processing-template"

type Props = {
  params: { id: string }
}

export const metadata: Metadata = {
  title: "Checkout processing",
  description: "You will be redirected...",
}

export default async function CheckoutProcessingPage({ params }: Props) {
  const cart = await getCart(params.id)
  return <CheckoutProcessingTemplate cart={cart} />
}
