import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/remix";
import type { MetaFunction } from "@remix-run/node";
import { useLoaderData } from "@remix-run/react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

export const meta: MetaFunction = () => {
  return [
    { title: "Universal Converter Admin" },
    {
      name: "description",
      content: "An admin for managing objects in the universal converter",
    },
  ];
};

export async function loader(): Promise<
  {
    id: string;
    name: string;
    volume: string;
  }[]
> {
  const data = await fetch(`${process.env.API_BASE_URL}/objects`);

  return data.json();
}

export default function Index() {
  const data = useLoaderData<typeof loader>();

  return (
    <div className="flex flex-col h-screen items-center">
      <div className="flex gap-3">
        <SignedIn>
          <div>
            <p>View your profile here</p>
            <UserButton />
          </div>
          <div>
            <SignOutButton />
          </div>
        </SignedIn>
        <SignedOut>
          <div>
            <SignInButton />
          </div>
          <div>
            <SignUpButton />
          </div>
        </SignedOut>
      </div>
      <div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Id</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((object) => (
              <TableRow key={object.id}>
                <TableCell>{object.id}</TableCell>
                <TableCell>{object.name}</TableCell>
                <TableCell>{object.volume}</TableCell>
              </TableRow>
            ))}
            <TableRow>
              <TableCell>
                <button>Add new</button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
