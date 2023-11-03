import { signIn, signOut, useSession } from "next-auth/react";
import { Libre_Baskerville } from "next/font/google";
import Head from "next/head";
import Link from "next/link";

import { api } from "@/utils/api";
import { useRef, useState } from "react";
import Card from "../components/card";
import ProfileIndicator from "@/components/profile-indicator";
import LoadingSpinner from "@/components/loading-spinner";
import SignOut from "@/components/sign-out";
import SignIn from "@/components/sign-in";

const libreBaskerville = Libre_Baskerville({ weight: ["400", "700"], subsets: ["latin"] });

const useGetCards = () => {
  return api.card.getAll.useQuery();
};

export default function Home() {
  const [prompt, setPrompt] = useState('')

  const { data: session } = useSession();

  const ctx = api.useUtils();

  const { data, isLoading: cardsLoading } = useGetCards();

  const { mutate: createCard, isLoading } = api.card.createPending.useMutation({
    onSuccess: () => {
      void ctx.card.invalidate();
    }
  });

  if (cardsLoading) {
    return <div>Loading...</div>
  };

  const inputComponent = () => {
    if (!session) {
      return <></>
    }
    else if (isLoading) {
      return <span className={libreBaskerville.className}>Generating... <LoadingSpinner></LoadingSpinner></span>
    } else {
      return <>
        <h2 className={`${libreBaskerville.className} text-[#9e5722] text-lg font-bold uppercase`}>Generate here sir ..</h2>
        {/* <h1 className="text-zinc-50">Prismatic Cards v1.0</h1> */}
        <div className="w-full flex space-x-2 mb-6">
          <input className="bg-white text-black p-2 rounded" onChange={(e: any) => { setPrompt(e.target.value) }}></input>
          <button className="bg-orange-400 rounded p-2 hover:bg-orange-300 active:bg-orange-500 active:ring ring-color-orange" onClick={(e) => createCard({ prompt })}>Submit</button>
        </div>
      </>
    }
  }

  return (
    <>
      <Head>
        <title>Prismatic Cards</title>
        <meta name="description" content="Generate you own cards..." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center p-12">

        <div className="w-full h-24 flex justify-between">
          <div></div>
          <div className="flex items-center space-x-2">
            {session ?
              (
                <>
                  <SignOut></SignOut>
                  <ProfileIndicator></ProfileIndicator>
                </>
              ) : (
                <SignIn></SignIn>
              )}
          </div>
        </div>

        <div className="flex flex-col">
          {inputComponent()}
          <div className="w-full h-full flex gap-6 flex-wrap">
            {data?.map((card: any, idx: number) => {
              return <Card value={card} key={idx}></Card>
            })}
          </div>
        </div>
      </main>
    </>
  );
}