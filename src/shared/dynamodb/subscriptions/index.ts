import { getSubscription } from "./get-subscription";
import { getSubscriptionsByPatientId } from "./get-subscription-by-patient-id";
import { createSubscription } from "./create-subscription";
import { setSubscriptionStatus } from "./set-subscription-status";

export const subscriptions = {
  getSubscription,
  getSubscriptionsByPatientId,
  createSubscription,
  setSubscriptionStatus,
};
