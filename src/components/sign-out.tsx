import { signOut } from "next-auth/react"

export default () => {
 
    return (
        <button onClick={() => signOut()}>Sign Out</button>
    );
}