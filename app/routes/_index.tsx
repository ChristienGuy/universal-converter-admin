import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  TypedResponse,
} from "@remix-run/node";
import { redirect, useFetcher, useLoaderData } from "@remix-run/react";

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

export async function loader(args: LoaderFunctionArgs): Promise<
  | {
      id: string;
      name: string;
      volume: string;
    }[]
  | TypedResponse<never>
> {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/login");
  }

  const data = await fetch(`${process.env.API_BASE_URL}/objects`);

  return data.json();
}

export async function action({ request }: ActionFunctionArgs) {
  const body = await request.formData();

  const intent = body.get("intent");

  // TODO: handle errors
  if (intent === "delete") {
    await fetch(`${process.env.API_BASE_URL}/objects/${body.get("id")}`, {
      method: "DELETE",
    });
  }

  if (intent === "add") {
    const response = await fetch(`${process.env.API_BASE_URL}/objects`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: body.get("name"),
        volume: body.get("volume"),
      }),
    });

    return response.json();
  }
}

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const data = useLoaderData<typeof loader>();

  return (
    <div className="grid auto-rows-max gap-4 p-4 w-full h-screen items-center">
      <div className="grid">
        <div className="ml-auto flex">
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
      <div className="rounded-xl shadow-sm border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Volume</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((object) => (
              <TableRow key={object.id}>
                <TableCell className="max-w-12 text-nowrap">
                  <div className="overflow-hidden overflow-ellipsis hover:overflow-visible">
                    {object.id}
                  </div>
                </TableCell>
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
