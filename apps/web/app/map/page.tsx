"use client";

import { ApiClientError, usePlan } from "@free-me/api-client";
import { DisclaimerBanner } from "@/components/disclaimer-banner";
import { PlanView } from "@/components/plan-view";
import { LinkButton, Spinner } from "@/components/ui";

export default function MapPage() {
  const plan = usePlan();

  if (plan.isPending) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Spinner label="Loading your map…" />
      </div>
    );
  }
  if (plan.isError) {
    const noPlan = plan.error instanceof ApiClientError && plan.error.status === 404;
    return (
      <div className="mx-auto max-w-md space-y-4 py-16 text-center">
        <h1 className="font-display text-3xl">{noPlan ? "No map yet." : "Couldn't load your map."}</h1>
        <p className="text-mist">{noPlan ? "Tell us what freedom means to you and we'll build it." : plan.error.message}</p>
        <LinkButton href="/onboarding/freedom">{noPlan ? "Start your journey" : "Start again"}</LinkButton>
      </div>
    );
  }
  return (
    <div>
      <DisclaimerBanner />
      <PlanView bundle={plan.data} />
    </div>
  );
}
