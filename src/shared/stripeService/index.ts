import Stripe from "stripe";
import { ENV } from "../../constants";

export const StripeClient = new Stripe(ENV.SECRET_KEY, {
  apiVersion: "2020-08-27",
});
export * as StripeUtils from "./methods";
export * as StripeConfig from "./config";
