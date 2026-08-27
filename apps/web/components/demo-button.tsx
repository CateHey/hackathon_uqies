"use client";

import { useRouter } from "next/navigation";
import { useLoadDemo } from "@free-me/api-client";
import type { DemoName } from "@free-me/core";
import { Button } from "./ui";

export function DemoButton({ name, label }: { name: DemoName; label: string }) {
  const router = useRouter();
  const load = useLoadDemo();
  return (
    <Button
      variant="secondary"
      disabled={load.isPending}
      onClick={() => load.mutate(name, { onSuccess: () => router.push("/map") })}
    >
      {load.isPending ? "Loading…" : label}
    </Button>
  );
}
