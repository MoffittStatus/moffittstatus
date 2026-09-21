import { loadLibraries } from "@/lib/loadLibraries";
import DiscoveryLibraryDataSection from "./DiscoveryLibraryDataSection";
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

export default async function DiscoveryLibraryDataLoader ({onLibrarySelect}) {
    const data = await loadLibraries();
    return(
        <DiscoveryLibraryDataSection data={data} onLibrarySelect={onLibrarySelect}></DiscoveryLibraryDataSection>
    )
}