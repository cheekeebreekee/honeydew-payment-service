import {
  enhancedSQSHandler,
  EventMappers,
  Notify,
  PatientsService,
  publishEvent,
} from "honeydew-shared";
import { DynamoDBService } from "src/shared/dynamodb";
import { SUBSCRIPTION_STATUSES } from "src/types/Subscription";
import Stripe from "stripe";

async function processSubscriptionDeletion(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const patientId = subscription.metadata.userId;

  if (!patientId) {
    throw new Error("Cannot process subscription deletion event: no patient ID found in an event.");
  }

  await DynamoDBService.subscriptions.setSubscriptionStatus(
    subscription.id,
    SUBSCRIPTION_STATUSES.CANCELLED
  );
}

async function processSubscriptionCreation(event: Stripe.Event) {
  const subscription = event.data.object as Stripe.Subscription;
  const patientId = subscription.metadata.userId;

  if (!patientId) {
    throw new Error("Cannot process subscription creation event: no patient ID found in an event.");
  }

  const priceId = subscription.items.data[0].price.id;
  const price = await DynamoDBService.prices.getPrice(priceId);

  if (!price.subscriptionType) {
    throw new Error(`Subscription type not found for price ID ${priceId}`);
  }

  await DynamoDBService.subscriptions.createSubscription({
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
    const subscriptionId = typeof subscription === "string" ? subscription : subscription.id;
    await DynamoDBService.subscriptions.setSubscriptionStatus(
      subscriptionId,
      SUBSCRIPTION_STATUSES.ACTIVE
    );
    const { patientId } = await DynamoDBService.subscriptions.getSubscription(subscriptionId);
    const patient = await PatientsService.getPatient(patientId);
    const patientsInAccount = await PatientsService.getPatientsCountByAccountId(patient.accountId);
    const subscriptionTitle = (
      invoice.lines.data.find(
        (lineItem) => lineItem.subscription === subscriptionId
      ) as Stripe.InvoiceLineItem
    ).description;

    await Notify.Email.Patient.membershipConfirmation({
      patient: {
        email: patient.email,
        parentsEmail: patient.parentsInfo?.email,
      },
      amount: invoice.amount_paid,
      discount: invoice.discount?.coupon.percent_off || 0,
      subscriptionType: subscriptionTitle || "N/A",
      isMultiaccount: patientsInAccount > 1,
    });
    const { payload, eventType } = EventMappers.referral.rewardReferralsEvent(patientId);
    await publishEvent(JSON.stringify(payload), eventType);
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
