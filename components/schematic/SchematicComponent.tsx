import { getTemporaryAccessToken } from "@/actions/getTemporaryAccessToken";
import React from "react";
import SchematicEmbed from "./SchematicEmbed";

async function SchematicComponent({ componentId }: { componentId?: string }) {
  console.log(componentId);
  if (!componentId) return null;

  const accessToken = await getTemporaryAccessToken();

  if (!accessToken) {
    throw new Error("Access token not found");
  }
  return <SchematicEmbed accessToken={accessToken} componentId={componentId} />
}

export default SchematicComponent;
