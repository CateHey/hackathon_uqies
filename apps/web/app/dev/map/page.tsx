import { DemoName } from "@free-me/core";
import { demoBundle } from "@/lib/demo";
import { DevMaps } from "@/components/dev/dev-maps";

/** Renders every demo persona's map in both orientations — for eyeballing layout, not for users. */
export default function DevMapPage() {
  const bundles = DemoName.options.map((name) => ({ name, ...demoBundle(name) }));
  return (
    <div className="space-y-10">
      <h1 className="font-display text-3xl">Dev: all demo maps</h1>
      <DevMaps bundles={bundles} />
    </div>
  );
}
