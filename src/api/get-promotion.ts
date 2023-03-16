import { enhancedAppSyncHandler } from "honeydew-shared";
import { StripeUtils } from "src/shared/stripeService";

type GetPromotionPayload = {
  promotionCode: string;
};

type GetPromotionResponse = {
  id: string;
  percentOff: number | null;
  duration: string;
  appliesToProducts: string[] | null;
};

export const handler = enhancedAppSyncHandler<GetPromotionPayload, GetPromotionResponse>(
  async (event) => {
    const { promotionCode } = event.arguments;
    const result = await StripeUtils.getPromotionCodeIdByName(promotionCode);
    return {
      id: result.coupon.id,
      percentOff: result.coupon.percent_off,
      duration: result.coupon.duration,
      appliesToProducts: result.coupon.applies_to?.products || null,
    };
  }
);
