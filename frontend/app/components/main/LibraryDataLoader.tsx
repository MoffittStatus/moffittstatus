import { loadLibraries } from "@/lib/loadLibraries";
import LibraryDataSection from "./LibraryDataSection";
// export const dynamic = 'force-dynamic';
// export const revalidate = 0;

export default async function LibraryDataLoader () {
    const data = await loadLibraries();
    return(
        <LibraryDataSection data={data}></LibraryDataSection>
    )
}