"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ApiProvider, createApi } from "@free-me/api-client";

export function Providers({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }));
  const [api] = useState(() => createApi());
  return (
    <QueryClientProvider client={queryClient}>
      <ApiProvider value={api}>{children}</ApiProvider>
    </QueryClientProvider>
  );
}
