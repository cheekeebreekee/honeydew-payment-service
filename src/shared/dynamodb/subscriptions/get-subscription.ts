import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { SubscriptionItem } from "src/types/Subscription";

const dynamoDb = new DynamoDB({});

export const getSubscription = async (subscriptionId: string) => {
  const query = {
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    Key: marshall(subscriptionId),
  };

  const { Item } = await dynamoDb.getItem(query);

  if (!Item) {
    throw new Error(`Cannot get subscription item by ID ${subscriptionId}`);
  }

  return Item as unknown as SubscriptionItem;
};
