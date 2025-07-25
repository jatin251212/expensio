"use server";

import { api } from "@/convex/_generated/api";
import convex from "@/lib/convexClient";
import { currentUser } from "@clerk/nextjs/server";
import { getFileDownloadUrl } from "./getFileDownloadUrl";
import { inngest } from "@/inngest/client";
import Events from "@/inngest/constants";

/**
 * Server action to upload a PDF file to Convex storage
 */
export async function uploadPDF(formData: FormData) {
  const user = await currentUser();

  if (!user) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Get the file from the form data
    const file = formData.get("file") as File;

    if (!file) {
      return { success: false, error: "No file provided" };
    }

    if (
      !file.type.includes("pdf") &&
      !file.name.toLowerCase().endsWith(".pdf")
    ) {
      return { success: false, error: "Only pdf file are allowed" };
    }

    // File handling/upload logic should go here

    const uploadUrl = await convex.mutation(api.receipts.generateUploadUrl, {});

    const arrayBuffer = await file.arrayBuffer();

    //Upload the file to convex storage

    const uploadResponse = await fetch(uploadUrl, {
      method: "POST",
      headers: {
        "Content-Type": file.type,
      },
      body: new Uint8Array(arrayBuffer),
    });

    if (!uploadResponse.ok) {
      throw new Error("Failed to upload file to convex storage");
    }

    const { storageId } = await uploadResponse.json();

    const receiptId = await convex.mutation(api.receipts.storeReceipt, {
      fileId: storageId,
      userId: user.id,
      fileName: file.name,
      size: file.size,
      mimeType: file.type,
    });

    const fileUrl = await getFileDownloadUrl(storageId);

    // Trigger Inngest Agent flow here Later
    await inngest.send({
      name: Events.EXTRACT_DATA_FROM_PDF_AND_SAVE_TO_DATABASE,
      data: {
        url: fileUrl.downloadUrl,
        receiptId,
      },
    });

    return {
      success: true,
      data: { receiptId, fileUrl, fileName: file.name },
    };
  } catch (error) {
    console.error("Server action upload error:", error);
    return {
      success: false,
      error:
        error instanceof Error ? error.message : "An unknown error occurred",
    };
  }
}
