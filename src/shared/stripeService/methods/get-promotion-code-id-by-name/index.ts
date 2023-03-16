import { logInfo } from "honeydew-shared";
import { StripeClient } from "../..";

export async function getPromotionCodeIdByName(name: string) {
  logInfo("Getting promotion code by name", { name });
  const { data } = await StripeClient.promotionCodes.list({
    code: name,
    limit: 1,
    expand: ["data.coupon.applies_to"],
  });

  if (!data.length) {
    throw new Error("Invalid promotion code");
  }

  const promotionCode = data[0];
  logInfo("Promotion code found", promotionCode);

  if (promotionCode.coupon.applies_to?.products) {
    const relatedProductIDs = promotionCode.coupon.applies_to.products;

    const allPriceIDs = await StripeClient.prices.list();
    const relatedPriceIDs = relatedProductIDs
      .map((productId) => {
        const priceIds = allPriceIDs.data.filter((price) => price.product === productId);
        if (!priceIds.length)
          throw new Error(`Such product ID does not exist in Stripe: ${productId}`);
        return priceIds.map(({ id }) => id);
      })
      .flat();
    const uniquePriceIDs = Array.from(new Set(relatedPriceIDs));

    logInfo("Price IDs mapped", uniquePriceIDs);

    promotionCode.coupon.applies_to.products = uniquePriceIDs;
  }

  return promotionCode;
}
