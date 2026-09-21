import DiscoverPage from "../components/main/discover/discover";
export const revalidate = 30;

export default async function Page() {
  return (<DiscoverPage ></DiscoverPage>)
}
