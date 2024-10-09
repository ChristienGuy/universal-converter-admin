import { SignIn } from "@clerk/remix";

export default function Login() {
  return (
    <div className="h-dvh grid justify-center items-center">
      <SignIn />
    </div>
  );
}
