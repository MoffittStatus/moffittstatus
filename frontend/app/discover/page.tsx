import DiscoverPage from "../components/main/discover/discover";
export const revalidate = 30;
export const dynamic = 'force-dynamic';

export default async function Page() {
  return (<DiscoverPage ></DiscoverPage>)
}
