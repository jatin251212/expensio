"use server";

import { currentUser } from "@clerk/nextjs/server";

import { SchematicClient } from "@schematichq/schematic-typescript-node";

const apiKey = process.env.SCHEMATIC_API_KEY;

const client = new SchematicClient({ apiKey });

export async function getTemporaryAccessToken() {
  console.log("Getting temporary Access Token");
  const user = await currentUser();
  if (!user) {
    console.log("No user found");
    return null;
  }

  console.log(`Issuing temporary Access token to ${user.id}`);

  const resp = await client.accesstokens.issueTemporaryAccessToken({
    resourceType: "company",
    lookup: { id: user.id },
  });

  console.log(resp.data);
  console.log(
    "Token response recieved:",
    resp.data ? "Token recieved" : "Token not received",
  );

  return resp.data?.token;
}
