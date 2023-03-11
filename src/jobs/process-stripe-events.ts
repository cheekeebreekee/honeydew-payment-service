import { enhancedSQSHandler } from "honeydew-shared";
import { DB } from "src/shared/dynamodb";
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TYPES,
} from "src/types/Subscription";
import Stripe from "stripe";

async function processSubscriptionDeletion(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const patientId = subscription.metadata.userId;

  if (!patientId) {
    throw new Error(
      "Cannot process subscription deletion event: no patient ID found in an event."
    );
  }

  await DB.subscriptions.setSubscriptionStatus(
    subscription.id,
    SUBSCRIPTION_STATUSES.CANCELLED
  );
}

async function processSubscriptionCreation(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const patientId = subscription.metadata.userId;

  if (!patientId) {
    throw new Error(
      "Cannot process subscription creation event: no patient ID found in an event."
    );
  }

  const priceId = subscription.items.data[0].price.id;
  const price = await DB.prices.getPrice(priceId);

  if (!price.subscriptionType) {
    throw new Error(`Subscription type not found for price ID ${priceId}`);
  }

  await DB.subscriptions.createSubscription({
    patientId,
    subscriptionId: subscription.id,
    status: SUBSCRIPTION_STATUSES.INCOMPLETE,
    type: price.subscriptionType,
  });
}

async function processPaidInvoice(event: Stripe.Event) {
  const invoice = event.data.object as Stripe.Invoice;
  const { subscription } = invoice;

  if (subscription) {
    await DB.subscriptions.setSubscriptionStatus(
      typeof subscription === "string" ? subscription : subscription.id,
      SUBSCRIPTION_STATUSES.ACTIVE
    );

    // TODO: send notification about membership to patient
    // TODO: engage referral factory flow
  }

  // TODO: consider processing of products by sending a notification to David
}

export const handler = enhancedSQSHandler(async (event) => {
  const body: Stripe.Event = JSON.parse(event.Records[0].body);

  switch (body.type) {
    case "customer.subscription.deleted":
      await processSubscriptionDeletion(body);
      break;
    case "customer.subscription.created":
      await processSubscriptionCreation(body);
      break;
    case "invoice.paid":
      await processPaidInvoice(body);
      break;
    default:
      throw new Error(`Unknown Stripe event type "${body.type}"`);
  }
});
