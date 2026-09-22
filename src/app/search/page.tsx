import Container from "@/components/container";
import React, { Suspense } from "react";
import SearchResults from "./search-results";

const page = () => {
  return (
    <Container>
      <Suspense fallback={<div className="py-20 text-center text-muted-foreground">Loading search...</div>}>
        <SearchResults />
      </Suspense>
    </Container>
  );
};

export default page;
