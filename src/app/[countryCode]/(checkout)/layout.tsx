import LocalizedClientLink from "@modules/common/components/localized-client-link"
import ChevronDown from "@modules/common/icons/chevron-down"
import MedusaCTA from "@modules/layout/components/medusa-cta"
import Head from "next/head"
import Script from "next/script"

export default function CheckoutLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative w-full bg-white small:min-h-screen">
      <div className="h-16 bg-white border-b ">
        <nav className="flex items-center justify-between h-full content-container">
          <LocalizedClientLink
            href="/cart"
            className="flex items-center flex-1 uppercase text-small-semi text-ui-fg-base gap-x-2 basis-0"
          >
            <ChevronDown className="rotate-90" size={16} />
            <span className="hidden mt-px small:block txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base ">
              Back to shopping cart
            </span>
            <span className="block mt-px small:hidden txt-compact-plus text-ui-fg-subtle hover:text-ui-fg-base">
              Back
            </span>
          </LocalizedClientLink>
          <LocalizedClientLink
            href="/"
            className="uppercase txt-compact-xlarge-plus text-ui-fg-subtle hover:text-ui-fg-base"
          >
            Medusa Store
          </LocalizedClientLink>
          <div className="flex-1 basis-0" />
        </nav>
      </div>
      <div className="relative">{children}</div>
      <div className="flex items-center justify-center w-full py-4">
        <MedusaCTA />
      </div>
    </div>
  )
}
