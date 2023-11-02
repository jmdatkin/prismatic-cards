import { useSession } from "next-auth/react";
import SignIn from "./sign-in";
import SignOut from "./sign-out";
import Image from "next/image";


export default (props: any) => {

    const { data: session } = useSession();

    if (!session) {
        return (
            // <SignIn></SignIn>
            <></>
        )
    }

    // return (
    //     <div className="text-white">
    //         Hi {session.user.name}!
    //         <SignOut></SignOut>
    //     </div>
    // )
    return (
        <div>
            {session.user.image ?
            <Image className="rounded-full" width={56} height={56} alt={`${session.user.name}'s profile image`} src={session.user.image}></Image>
            : <span className="text-white">{session.user.name}</span>
            }
        </div>
    )
};