import { signIn } from "next-auth/react"

export default () => {
    return (
        <button className="text-white" onClick={() => signIn("discord")}>Sign In</button>
    );
}