import { getAdRotationPool, getConfiguredAdSlots } from "@/lib/ad-config";
import { RotatingAdSlotClient } from "@/components/RotatingAdSlotClient";

export async function AdSlot({ slotId }: { slotId: string }) {
  const slots = await getConfiguredAdSlots();
  const rotationPool = getAdRotationPool(slots, slotId);

  if (!rotationPool.length) return null;

  return <RotatingAdSlotClient slotId={slotId} slots={rotationPool} />;
}
