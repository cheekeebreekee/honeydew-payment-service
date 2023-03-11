import { SUBSCRIPTION_TYPES } from "./Subscription";

export enum PRICE_TYPES {
  PRODUCT = "product",
  SUBSCRIPTION = "subscription",
}

export type PriceItem = {
  id: string;
  type: PRICE_TYPES;
  title: string;
  amount: number;
  subscriptionType?: SUBSCRIPTION_TYPES;
  medicineId?: string;
};
