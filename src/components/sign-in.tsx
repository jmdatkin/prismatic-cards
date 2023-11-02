import { signIn } from "next-auth/react"
import Button from "./button";

export default () => {
    return (
        <Button className="text-white" onClick={() => signIn("discord")}>Sign In</Button>
    );
}