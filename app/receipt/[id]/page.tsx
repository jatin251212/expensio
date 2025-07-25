"use client";

import { useParams } from "next/navigation";

function page() {
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const params = useParams();

  return <div>Invidual receipt page : {params.id}</div>;
}

export default page;
