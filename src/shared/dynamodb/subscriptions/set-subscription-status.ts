import {
  DynamoDB,
  QueryCommandInput,
  UpdateItemCommandInput,
} from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import {
  SubscriptionItem,
  SUBSCRIPTION_STATUSES,
} from "src/types/Subscription";

const dynamoDb = new DynamoDB({});

export const setSubscriptionStatus = async (
  subscriptionId: string,
  status: SUBSCRIPTION_STATUSES
) => {
  const query: UpdateItemCommandInput = {
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    Key: marshall({
      subscriptionId,
    }),
    UpdateExpression: "set #ttl=:TTL",
    ExpressionAttributeNames: {
      "#status": "status",
    },
    ExpressionAttributeValues: marshall({
      ":STATUS": status as string,
    }),
  };

  await dynamoDb.updateItem(query);
};
