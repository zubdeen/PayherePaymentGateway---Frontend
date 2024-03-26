import { Order } from "@medusajs/medusa"
import { Heading } from "@medusajs/ui"

import CartTotals from "@modules/common/components/cart-totals"
import Help from "@modules/order/components/help"
import Items from "@modules/order/components/items"
import OrderDetails from "@modules/order/components/order-details"
import ShippingDetails from "@modules/order/components/shipping-details"
import PaymentDetails from "@modules/order/components/payment-details"

type OrderCancelledTemplateProps = {
  order: Order
}

export default function OrderCancelledTemplate({
  order,
}: OrderCancelledTemplateProps) {

  return (
    <div className="py-6 min-h-[calc(100vh-64px)]">
      <div className="flex flex-col items-center justify-center w-full h-full max-w-4xl content-container gap-y-10">
        <div className="flex flex-col w-full h-full max-w-4xl gap-4 py-10 bg-white">
          <Heading
            level="h1"
            className="flex flex-col mb-4 text-3xl gap-y-3 text-ui-fg-base"
          >
            <span>Unfortunately</span>
            <span>Your order was unsuccessful.</span>
          </Heading>
          <OrderDetails order={order} />
          <Heading level="h2" className="flex flex-row text-3xl-regular">
            Summary
          </Heading>
          <Items items={order.items} region={order.region} />
          <CartTotals data={order} />
          <ShippingDetails order={order} />
          <PaymentDetails order={order} />
          <Help />
        </div>
      </div>
    </div>
  )
}
