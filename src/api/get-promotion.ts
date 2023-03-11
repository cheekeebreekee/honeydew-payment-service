import { StripeUtils } from "src/shared/stripeService";

type GetPromotionPayload = {
  promotionCode: string;
};

export const handler = async (event: GetPromotionPayload) => {
  const { promotionCode } = event;
  const result = await StripeUtils.getPromotionCodeIdByName(promotionCode);
  return result;
};
