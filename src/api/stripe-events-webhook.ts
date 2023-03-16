import { enhancedWebhookHandler, sqs } from "honeydew-shared";

export const handler = enhancedWebhookHandler<{ body: string }>(async ({ body }) => {
  const bodyObject = JSON.parse(body);
  await sqs.sendMessage(bodyObject, process.env.SUBSCRIPTIONS_SQS_NAME as string);
});
