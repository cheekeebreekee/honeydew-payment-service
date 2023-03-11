import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { PriceItem } from "src/types/Price";

const dynamoDb = new DynamoDB({});

export const getAllPrices = async () => {
  const query = {
    TableName: process.env.PRICES_TABLE,
  };

  const { Items } = await dynamoDb.scan(query);

  if (!Items) {
    throw new Error(`Cannot get all prices`);
  }

  return Items as unknown as PriceItem;
};
