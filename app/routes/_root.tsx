import {
  SignedIn,
  SignedOut,
  SignInButton,
  useAuth,
  UserButton,
  useUser,
} from "@clerk/remix";
import { NavLink, NavLinkProps, Outlet } from "@remix-run/react";

function UserData() {
  const { user } = useUser();

  return (
    <div className="flex">
      <div>{user?.firstName}</div>
      <div className="ml-auto">
        <UserButton />
      </div>
    </div>
  );
}

function SidebarLink(props: NavLinkProps) {
  return (
    <NavLink
      className="aria-[current='page']:bg-slate-100 w-full flex rounded-full py-2 px-4"
      {...props}
    />
  );
}

function SidebarItem({ children }: { children: React.ReactNode }) {
  return <li className="w-full">{children}</li>;
}

function Sidebar() {
  const {} = useAuth();
  return (
    <div className="h-full p-2">
      <nav className="h-full p-3 shadow-md border rounded-2xl flex flex-col gap-8">
        <div className="h-11 p-3">
          <SignedIn>
            <UserData />
          </SignedIn>
          <SignedOut>
            <div>
              <SignInButton />
            </div>
          </SignedOut>
        </div>
        <ul className="flex flex-col gap-2">
          <SidebarItem>
            <SidebarLink to="/">Home</SidebarLink>
          </SidebarItem>
          <SidebarItem>
            <SidebarLink to="/usage">Usage</SidebarLink>
          </SidebarItem>
        </ul>
      </nav>
    </div>
  );
}

export default function Layout() {
  return (
    <div className="grid grid-cols-12 h-screen">
      <div className="col-span-2">
        <Sidebar />
      </div>
      <div className="col-span-10 p-4 pt-24">
        <Outlet />
      </div>
    </div>
  );
}
