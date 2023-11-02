import { signOut } from "next-auth/react"
import Button from "./button";

export default () => {
 
    return (
        <Button onClick={() => signOut()}>Sign Out</Button>
    );
}