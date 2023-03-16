import { config } from "honeydew-shared";
import Stripe from "stripe";

export const StripeClient = new Stripe(config.getSecretValue("stripeApiKey"), {
  apiVersion: "2022-11-15",
});
export * as StripeUtils from "./methods";
