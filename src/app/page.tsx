"use client";

import { SearchProvider } from "~/hooks/useSearchContext";
import { AppContent } from "~/components/AppContent";

export default function HomePage() {
  return (
    <SearchProvider>
      <AppContent />
    </SearchProvider>
  );
}
