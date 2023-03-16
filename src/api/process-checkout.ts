import {
  config,
  enhancedAppSyncHandler,
  logDebug,
  logInfo,
  PatientsService,
  ShippingInfo,
} from "honeydew-shared";
import { StripeClient, StripeUtils } from "src/shared/stripeService";
import Stripe from "stripe";

type ProductItem = {
  quantity: number;
  price: string;
};

type CheckoutPayload = {
  customerId: string;
  patientId: string;
  paymentMethodId: string;
  isPaymentMethodExists?: boolean;
  subscriptionPrice?: string;
  shippingInfo?: ShippingInfo;
  promotionCode?: string;
  productItems?: ProductItem[];
};

const addPaymentMethod = async (paymentMethodId: string, customerId: string) => {
  logInfo("Atatching payment method to customer");
  await StripeClient.paymentMethods.attach(paymentMethodId, {
    customer: customerId,
  });
  logDebug("Payment method attached successfully");
};

const updateDefaultPaymentMethod = async (
  customerId: string,
  paymentMethodId: string,
  patientFullName: string,
  shippingInfo: ShippingInfo | undefined
) => {
  logInfo("Updating default payment method of customer");
  await StripeClient.customers.update(customerId, {
    invoice_settings: {
      default_payment_method: paymentMethodId,
    },
    shipping: shippingInfo
      ? {
          address: {
            city: shippingInfo.city,
            country: "US",
            line1: shippingInfo.addressLine1,
            line2: shippingInfo.addressLine2 || "",
            postal_code: shippingInfo.zipCode,
            state: shippingInfo.state,
          },
          name: patientFullName,
        }
      : undefined,
  });
  logDebug("Default method updated successfully");
};

const createSubscription = async (
  customerId: string,
  patientId: string,
  subscriptionPrice: string,
  promotionCodeId?: string
) => {
  const createSubscriptionPayload: Stripe.SubscriptionCreateParams = {
    customer: customerId,
    metadata: {
      userId: patientId,
    },
    items: [{ price: subscriptionPrice }],
    expand: ["latest_invoice.payment_intent"],
    transfer_data: {
      destination: config.getSecretValue("remoteDermatologyAccountId"),
      amount_percent: 100,
    },
    promotion_code: promotionCodeId,
    payment_behavior: "default_incomplete", // will require waiting for paid invoice
  };

  // Create the subscription
  logInfo("Creating subscription", createSubscriptionPayload);
  const subscription = await StripeClient.subscriptions.create(createSubscriptionPayload);
  logDebug("Subscription successfully created", subscription);
};

const checkoutProducts = async (
  customerId: string,
  productItems: ProductItem[],
  promotionCode: Stripe.PromotionCode | null
) => {
  const isPromotionCodeShouldBeAppoliedToProducts =
    promotionCode && promotionCode.coupon.duration !== "repeating";

  if (productItems?.length) {
    logInfo("Processing product items", productItems);
    const invoiceItems = await Promise.all(
      productItems.map((el) =>
        StripeClient.invoiceItems.create({
          customer: customerId,
          price: el.price,
          quantity: el.quantity,
          discounts:
            promotionCode && isPromotionCodeShouldBeAppoliedToProducts
              ? [{ coupon: promotionCode.coupon.id }]
              : [],
        })
      )
    );
    logDebug("Invoice items successfully created", invoiceItems);

    logInfo("Creating draft invoice");
    const draftInvoice = await StripeClient.invoices.create({
      customer: customerId,
    });
    logDebug("Draft invoice successfully created", draftInvoice);

    logInfo("Finalizing invoice");
    const finalizedInvoice = await StripeClient.invoices.finalizeInvoice(draftInvoice.id);
    logDebug("Invoice successfully finalized", finalizedInvoice);

    if (!finalizedInvoice.paid) {
      logInfo("Charging payment");
      const payedInvoice = await StripeClient.invoices.pay(finalizedInvoice.id);
      logDebug("Payment successfully charged", JSON.stringify(payedInvoice));
    } else {
      logInfo("Invoice already paid using internal credit");
    }
  }
};

export const handler = enhancedAppSyncHandler<CheckoutPayload, null>(async (event) => {
  const {
    customerId,
    paymentMethodId,
    productItems,
    isPaymentMethodExists,
    subscriptionPrice,
    shippingInfo,
    promotionCode: promotionCodeName,
    patientId,
  } = event.arguments;

  const patient = await PatientsService.getPatient(patientId);
  const subscriptionIncluded = !!subscriptionPrice;
  const productsIncluded = productItems && productItems?.length > 0;

  if (!subscriptionIncluded && !productsIncluded) {
    throw new Error("Nothing to checkout");
  }

  if (!isPaymentMethodExists) {
    await addPaymentMethod(paymentMethodId, customerId);
  }

  await updateDefaultPaymentMethod(customerId, paymentMethodId, patient.fullName, shippingInfo);

  const promotionCode = promotionCodeName
    ? await StripeUtils.getPromotionCodeIdByName(promotionCodeName)
    : null;

  if (subscriptionIncluded) {
    await createSubscription(customerId, patientId, subscriptionPrice, promotionCode?.id);
  }

  if (productsIncluded) {
    await checkoutProducts(customerId, productItems, promotionCode);
  }
  return null;
});
