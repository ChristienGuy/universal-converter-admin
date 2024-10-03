import { SignIn } from "@clerk/remix";

export default function Login() {
  return (
    <div>
      <h1>Login</h1>
      <SignIn />
    </div>
  );
}
