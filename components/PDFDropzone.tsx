"use client";

import React, { useCallback, useRef } from "react";
import {
  useSensor,
  DndContext,
  useSensors,
  PointerSensor,
} from "@dnd-kit/core";
import { useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useSchematicEntitlement } from "@schematichq/schematic-react";
import { set } from "@schematichq/schematic-typescript-node/core/schemas";
import { uploadPDF } from "@/actions/uploadPDF";

function PDFDropzone() {
  const [isUploading, setIsUploading] = React.useState(false);
  const [uploadedFiles, setUploadedFiles] = React.useState<string[]>([]);
  const [isDraggingOver, setIsDraggingOver] = React.useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const { user } = useUser();
  const {
    value: isFeatureEnabled,
    featureUsageExceeded,
    featureAllocation,
    featureUsage,
  } = useSchematicEntitlement("scans");

  console.log(isFeatureEnabled);
  console.log("Feature Usage", featureUsage);
  console.log("Feature Allocation", featureAllocation);
  console.log("Feature Usage Exceeded", featureUsageExceeded);

  const sensors = useSensors(useSensor(PointerSensor));

  const handleUpload = useCallback(
    async (files: FileList | File[]) => {
      if (!user) {
        alert("Please sign in to upload files");
        return;
      }

      const fileArray = Array.from(files);
      const pdfFiles = fileArray.filter(
        (file) =>
          file.type === "application/pdf" ||
          file.name.toLowerCase().endsWith(".pdf"),
      );

      if (pdfFiles.length === 0) {
        alert("Please upload a PDF file");
        return;
      }

      setIsUploading(true);

      try {
        const newUploadedFiles: string[] = [];

        for (const file of pdfFiles) {
          const formData = new FormData();
          formData.append("file", file);

          //   call the server action to handle upload
          const result = await uploadPDF(formData);

          if (!result.success) {
            throw new Error(result.error);
          }
          newUploadedFiles.push(file.name);
        }

        setUploadedFiles((prevFiles) => [...prevFiles, ...newUploadedFiles]);

        //   clear uploaded files list after 5 seconds
        setTimeout(() => {
          setUploadedFiles([]);
        }, 5000);

        router.push("/receipts");
      } catch (error) {
        console.error(error);
      } finally {
        setIsUploading(false);
      }
    },
    [user, router],
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDraggingOver(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDraggingOver(false);

      if (!user) {
        alert("Please sign in to upload files");
        return;
      }
      console.log("Dropped");

      if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        handleUpload(e.dataTransfer.files);
      }
    },
    [user, handleUpload],
  );

  //   const canUpload = isUserSignedIn && isFeatureEnabled;

  //   const canUpload = true;
  const isUserSignedIn = !!user;
  const canUpload = isUserSignedIn && isFeatureEnabled;

  return (
    <DndContext sensors={sensors}>
      <div className="w-full max-w-md mx-auto bg-red-400">
        <div
          onDragOver={canUpload ? handleDragOver : undefined}
          onDragLeave={canUpload ? handleDragLeave : undefined}
          onDrop={canUpload ? handleDrop : (e) => e.preventDefault()}
          className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors
          ${isDraggingOver ? "border-blue-500 bg-blue-50" : "border-gray-300"}
          ${!canUpload ? "opacity-70 cursor-not-allowed" : ""}`}
        >
          hi
        </div>
      </div>
    </DndContext>
  );
}

export default PDFDropzone;
