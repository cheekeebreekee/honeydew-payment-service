import { ENV } from "../../constants";

export const paymentConfig = {
  currency: "USD",
  membership: {
    year: {
      amount: 29900,
      priceId: process.env.YEAR_MEMBERSHIP_PRICE_ID,
    },
    month: {
      amount: 3900,
      priceId: process.env.MONTH_MEMBERSHIP_PRICE_ID,
    },
  },
  products: {
    [ENV.BENZOYL_PEROXIDE_PRICE_ID]: {
      title: "DewRx BP Wash",
      price: 1500,
    },
    [ENV.MOISTURIZER_PRICE_ID]: {
      title: "DewRx Moisturizer",
      price: 1500,
    },
    [ENV.PROBIOTICS_PRICE_ID]: {
      title: "DewPro Probiotics",
      price: 2500,
    },
  },
};
