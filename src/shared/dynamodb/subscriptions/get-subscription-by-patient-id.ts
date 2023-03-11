import { DynamoDB, QueryCommandInput } from "@aws-sdk/client-dynamodb";
import { marshall } from "@aws-sdk/util-dynamodb";
import { SubscriptionItem } from "src/types/Subscription";

const dynamoDb = new DynamoDB({});

export const getSubscriptionsByPatientId = async (patientId: string) => {
  const query: QueryCommandInput = {
    TableName: process.env.SUBSCRIPTIONS_TABLE,
    KeyConditionExpression: "#patientId = :ID",
    ExpressionAttributeNames: {
      "#patientId": "patientId",
    },
    ExpressionAttributeValues: marshall({
      ":ID": patientId,
    }),
    IndexName: "patientIdIndex",
  };

  const { Items } = await dynamoDb.query(query);

  if (!Items) {
    throw new Error(`Cannot get subscription items by patient ID ${patientId}`);
  }

  return Items as unknown as SubscriptionItem[];
};
