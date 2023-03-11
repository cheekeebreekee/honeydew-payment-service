export enum SUBSCRIPTION_STATUSES {
  INCOMPLETE = "incomplete",
  ACTIVE = "active",
  CANCELLED = "cancelled",
}

export enum SUBSCRIPTION_TYPES {
  MEMBERSHIP = "membership",
  ACCUTANE = "accutane",
}

export type SubscriptionItem = {
  id: string;
  patientId: string;
  status: SUBSCRIPTION_STATUSES;
  type: SUBSCRIPTION_TYPES;
};
