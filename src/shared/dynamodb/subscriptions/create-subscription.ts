import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  SUBSCRIPTION_STATUSES,
  SUBSCRIPTION_TYPES,
} from "src/types/Subscription";

const dynamoDb = new DynamoDB({});

interface CreateSubscriptionPayload {
  patientId: string;
  subscriptionId: string;
  status: SUBSCRIPTION_STATUSES;
  type: SUBSCRIPTION_TYPES;
}

export const createSubscription = async ({
  patientId,
  subscriptionId,
  status,
  type,
}: CreateSubscriptionPayload) => {
  const query = {
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    Item: marshall({
      id: subscriptionId,
      patientId,
      status,
      type,
    }),
  };

  await dynamoDb.putItem(query);
};
