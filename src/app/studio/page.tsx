import { StudioPublicPage, studioMetadata } from "@/components/StudioPublicPage";
import { studioSurfaces } from "@/lib/studio-surfaces";
const surface = studioSurfaces[0];
export const metadata = studioMetadata(surface);
export default function Page() { return <StudioPublicPage surface={surface} />; }
