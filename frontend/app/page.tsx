import LibraryStatusPage from './components/main/main';
export const revalidate = 30;
// export const dynamic = 'force-dynamic'; // runs load libraries on every request
export default async function Page() {


  // return (<DiscoverPage data={result}></DiscoverPage>)
  return (<LibraryStatusPage></LibraryStatusPage>)

}
