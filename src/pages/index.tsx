import { signIn, signOut, useSession } from "next-auth/react";
import { Libre_Baskerville } from "next/font/google";
import Head from "next/head";
import Link from "next/link";

import { api } from "@/utils/api";
import { useRef, useState } from "react";
import Card from "../components/card";

const libreBaskerville = Libre_Baskerville({ weight: ["400", "700"], subsets: ["latin"] });

const useGetCards = () => {
  return api.card.getAll.useQuery();
};

export default function Home() {
  const [prompt, setPrompt] = useState('')

  const { data, isLoading: cardsLoading } = useGetCards();

  const { mutate: createCard, isLoading } = api.card.create.useMutation();

  if (cardsLoading) {
    return <div>Loading...</div>
  };

  return (
    <>
      <Head>
        <title>Prismatic Cards</title>
        <meta name="description" content="Generate you own cards..." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className="flex min-h-screen flex-col items-center justify-between p-24">

        <div className="flex flex-col">
          <h2 className={`${libreBaskerville.className} text-[#9e5722] text-lg font-bold uppercase`}>Generate here sir ..</h2>
          {/* <h1 className="text-zinc-50">Prismatic Cards v1.0</h1> */}
          <div className="w-full flex space-x-2 mb-6">
            <input className="bg-white text-black p-2 rounded" onChange={(e: any) => { setPrompt(e.target.value) }}></input>
            <button className="bg-orange-400 rounded p-2 hover:bg-orange-300 active:bg-orange-500 active:ring ring-color-orange" onClick={(e) => createCard({ prompt })}>Submit</button>
          </div>
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