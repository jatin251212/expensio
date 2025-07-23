import SchematicComponent from "@/components/schematic/SchematicComponent";
import React from "react";

function page() {
  return (
    <div>
      <SchematicComponent
        componentId={
          process.env.NEXT_PUBLIC_SCHEMATIC_CUSTOMER_PORTAL_COMPONENT_ID
        }
      />
    </div>
  );
}

export default page;
