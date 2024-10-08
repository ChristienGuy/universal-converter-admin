import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/remix";
import { Link, Outlet } from "@remix-run/react";

export default function Layout() {
  return (
    <div className="grid grid-cols-12 h-screen">
      <div className="col-span-2">
        <nav className="border-r h-full p-7">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/usage">Usage</Link>
            </li>
          </ul>
        </nav>
      </div>
      <div className="col-span-10 p-4">
        <div className="grid h-11">
          <div className="ml-auto">
            <SignedIn>
              <div>
                <UserButton />
              </div>
            </SignedIn>
            <SignedOut>
              <div>
                <SignInButton />
              </div>
            </SignedOut>
          </div>
        </div>
        <Outlet />
      </div>
    </div>
  );
}
