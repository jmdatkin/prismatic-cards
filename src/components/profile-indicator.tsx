import { useSession } from "next-auth/react";
import SignIn from "./sign-in";
import SignOut from "./sign-out";


export default (props: any) => {

    const { data: session } = useSession();

    if (!session) {
        return (
            <SignIn></SignIn>
        )
    }

    return (
        <div className="text-white">
            Hi {session.user.name}!
            <SignOut></SignOut>
        </div>
    )
};