import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { PriceItem } from "src/types/Price";
import { SubscriptionItem } from "src/types/Subscription";

const dynamoDb = new DynamoDB({});

export const getPrice = async (priceId: string) => {
  const query = {
    TableName: process.env.PRICES_TABLE,
    Key: marshall(priceId),
  };

  const { Item } = await dynamoDb.getItem(query);

  if (!Item) {
    throw new Error(`Cannot get price by ID ${priceId}`);
  }

  return Item as unknown as PriceItem;
};
