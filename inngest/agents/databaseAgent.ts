import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import convex from "@/lib/convexClient";
import { client } from "@/lib/schematic";
import { createAgent, createTool, openai } from "@inngest/agent-kit";
import { z, ZodType } from "zod";

const saveToDatabaseTool = createTool({
  name: "save-to-database",
  description: "Saves the given data to the convex database.",
  // @ts-expect-error — Type mismatch is safe to ignore here
  parameters: z.object({
    fileDisplayName: z
      .string()
      .describe(
        "The readable display name of the receipt to show in the UI. If the file name is not human readable, use this to give a more readable name.",
      ),
    receiptId: z.string().describe("The ID of the receipt to update"),
    merchantName: z.string(),
    merchantAddress: z.string(),
    merchantContact: z.string(),
    transactionDate: z.string(),
    transactionAmount: z
      .string()
      .describe(
        "The total amount of the transaction, summing all the items on the receipt.",
      ),
    receiptSummary: z
      .string()
      .describe(
        "A summary of the receipt, including the merchant name, address, contact, transaction date, transaction amount, and currency. Include a human readable summary of the receipt. Mention both invoice number and receipt number if both are present. Include some key details about the items on the receipt, this is a special featured summary so it should include some key details about the items on the receipt with some context.",
      ),
    currency: z.string(),
    items: z
      .array(
        z.object({
          name: z.string(),
          quantity: z.number(),
          unitPrice: z.number(),
          totalPrice: z.number(),
        }),
      )
      .describe(
        "An array of items on the receipt. Include the name, quantity, unit price, and total price of each item.",
      ),
  }) as ZodType,
  handler: async ({ params, context }) => {
    const {
      fileDisplayName,
      receiptId,
      merchantName,
      merchantAddress,
      merchantContact,
      transactionDate,
      transactionAmount,
      receiptSummary,
      currency,
      items,
    } = params;

    const result = await context.step?.run(
      "save-receipt-to-database",
      async () => {
        try {
          const { userId } = await convex.mutation(
            api.receipts.updateReceiptWithExtractedData,
            {
              id: receiptId as Id<"receipts">,
              fileDisplayName,
              merchantName,
              merchantAddress,
              merchantContact,
              transactionDate,
              transactionAmount,
              receiptSummary,
              currency,
              items,
            },
          );

          await client.track({
            event: "scan",
            company: {
              id: userId,
            },
            user: {
              id: userId,
            },
          });

          return {
            addedToDb: "Success",
            receiptId,
            fileDisplayName,
            merchantName,
            merchantAddress,
            merchantContact,
            transactionDate,
            transactionAmount,
            receiptSummary,
            currency,
            items,
          };
        } catch (error) {
          return {
            addedToDB: "Failed",
            error:
              error instanceof Error
                ? error.message
                : "An unknown error occurred",
          };
        }
      },
    );
    if (result?.addedToDB === "Success") {
      context.network?.state.kv.set("saved-to-database", true);
      context.network?.state.kv.set("receipt", receiptId);
    }

    return result;
  },
});

export const databaseAgent = createAgent({
  name: "Database Agent",
  description:
    "Responsible for taking key information regarding receipts and saving it to the convex database.",
  system:
    "You are a helpful assistant that takes key information regarding receipts and saves it to the convex database.",
  model: openai({
    model: "gpt-4o-mini",
    defaultParameters: {
      max_completion_tokens: 1000,
    },
  }),
  tools: [saveToDatabaseTool],
});
