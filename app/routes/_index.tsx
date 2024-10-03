import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  SignUpButton,
  UserButton,
} from "@clerk/remix";
import type { ActionFunctionArgs, MetaFunction } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
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

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();

  const intent = body.get("intent");

  if (intent === "delete") {
    return fetch(`${process.env.API_BASE_URL}/objects/${body.get("id")}`, {
      method: "DELETE",
    });
  }

  if (intent === "add") {
    const Object = await fetch(`${process.env.API_BASE_URL}/objects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: body.get("name"),
        volume: body.get("volume"),
      }),
    });

    return Object.json();
  }
}

export default function Index() {
  const fetcher = useFetcher();
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
                <TableCell>
                  <fetcher.Form method="DELETE">
                    <input type="hidden" name="intent" value="delete" />
                    <input type="hidden" name="id" value={object.id} />
                    <Button type="submit">Delete</Button>
                  </fetcher.Form>
                </TableCell>
              </TableRow>
            ))}
            <TableRow className="hover:bg-white">
              <TableCell>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button>Add new</Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add a new Object</DialogTitle>
                    </DialogHeader>
                    <fetcher.Form method="POST">
                      <input type="hidden" name="intent" value="add" />

                      <div className="grid gap-6">
                        <div className="grid grid-cols-4 items-center gap-5">
                          <Label>Name:</Label>
                          <Input
                            className="col-span-3"
                            name="name"
                            type="text"
                          />
                        </div>
                        <div className="grid grid-cols-4 items-center gap-5">
                          <Label>Volume:</Label>
                          <Input
                            className="col-span-3"
                            name="volume"
                            type="number"
                          />
                        </div>
                      </div>
                      <DialogFooter className="mt-6">
                        <Button type="submit">Add</Button>
                      </DialogFooter>
                    </fetcher.Form>
                  </DialogContent>
                </Dialog>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
