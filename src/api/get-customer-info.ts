import { enhancedAppSyncHandler, logDebug, logInfo } from "honeydew-shared";
import { StripeClient } from "src/shared/stripeService";

type Payload = {
  customerId: string;
};

type Response = {
  paymentMethods: {
    id: string;
    billingName: string | null;
    brand?: string;
    cardNumber?: string;
  }[];
  internalCredit: number;
};

export const handler = enhancedAppSyncHandler<Payload, Response>(
  async (event) => {
    const { customerId } = event.arguments;
    const customer = await StripeClient.customers.retrieve(customerId);

    logDebug("Customer found in Stripe", customer);

    const paymentMethodsResponse = await StripeClient.paymentMethods.list({
      type: "card",
      customer: customerId,
    });

    logInfo("Payment methods fetched", {
      paymentMethods: paymentMethodsResponse.data,
    });

    const paymentMethods = paymentMethodsResponse.data.map(
      ({ id, billing_details, card }) => ({
        id,
        billingName: billing_details.name,
        brand: card?.brand,
        cardNumber: card?.last4,
      })
    );

    return {
      paymentMethods,
      internalCredit: -(customer as { balance: number }).balance || 0,
    };
  }
);
