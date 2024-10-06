import { SignedIn, SignedOut, SignInButton, UserButton } from "@clerk/remix";
import { getAuth } from "@clerk/remix/ssr.server";
import {
  AlertDialogAction,
  AlertDialogCancel,
} from "@radix-ui/react-alert-dialog";
import type {
  ActionFunctionArgs,
  LoaderFunctionArgs,
  MetaFunction,
  TypedResponse,
} from "@remix-run/node";
import { redirect, useFetcher, useLoaderData } from "@remix-run/react";
import { EllipsisIcon, Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input, InputProps } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";

function VolumeNumberInput(props: InputProps) {
  return (
    <Input
      className="col-span-3"
      name="volume"
      type="number"
      step="0.01"
      {...props}
    />
  );
}

export const meta: MetaFunction = () => {
  return [
    { title: "Universal Converter Admin" },
    {
      name: "description",
      content: "An admin for managing objects in the universal converter",
    },
  ];
};

type ConversionObject = {
  id: string;
  name: string;
  volume: string;
};

export async function loader(
  args: LoaderFunctionArgs
): Promise<ConversionObject[] | TypedResponse<never>> {
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

  console.log("intent", intent);

  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  headers.append("cookie", request.headers.get("Cookie") ?? "");

  // TODO: handle errors
  if (intent === "delete") {
    const response = await fetch(
      `${process.env.API_BASE_URL}/objects/${body.get("id")}`,
      {
        method: "DELETE",
        headers,
      }
    );

    if (response.ok) {
      return { ok: true };
    }

    throw new Error("Failed to delete the object");
  }

  if (intent === "edit") {
    const response = await fetch(
      `${process.env.API_BASE_URL}/objects/${body.get("id")}`,
      {
        method: "PATCH",
        headers,
        body: JSON.stringify({
          name: body.get("name"),
          volume: body.get("volume"),
        }),
      }
    );

    if (response.ok) {
      const data = await response.json();
      return { ok: true, ...data };
    }

    throw new Error("Failed to update the object");
  }

  if (intent === "add") {
    const response = await fetch(`${process.env.API_BASE_URL}/objects`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        name: body.get("name"),
        volume: body.get("volume"),
      }),
    });

    if (response.ok) {
      const data = await response.json();
      return { ok: true, ...data };
    }

    throw new Error("Failed to add the object");
  }
}

function EditableRow({
  conversionObject,
}: {
  conversionObject: ConversionObject;
}) {
  const editFetcher = useFetcher<typeof action>({
    key: "edit",
  });
  const deleteFetcher = useFetcher<typeof action>({
    key: "delete",
  });
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (editFetcher.state === "idle" && editFetcher.data?.ok) {
      setIsEditing(false);
    }
  }, [editFetcher]);

  return (
    <>
      <TableRow>
        <TableCell className="max-w-12 text-nowrap">
          <div className="overflow-hidden overflow-ellipsis hover:overflow-visible">
            {conversionObject.id}
          </div>
        </TableCell>
        <TableCell>{conversionObject.name}</TableCell>
        <TableCell>{conversionObject.volume}</TableCell>
        <TableCell align="right">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm">
                <span className="sr-only">Menu</span>
                <EllipsisIcon />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsEditing(true)}>
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsDeleting(true)}>
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </TableCell>
      </TableRow>
      <Dialog
        onOpenChange={(open) => {
          if (!open) {
            setIsEditing(false);
          }
        }}
        open={isEditing}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update the {conversionObject.name}</DialogTitle>
          </DialogHeader>
          <editFetcher.Form method="PATCH">
            <input type="hidden" name="intent" value="edit" />
            <input type="hidden" name="id" value={conversionObject.id} />

            <div className="grid gap-6">
              <div className="grid grid-cols-4 items-center gap-5">
                <Label>Name</Label>
                <Input
                  defaultValue={conversionObject.name}
                  className="col-span-3"
                  name="name"
                  type="text"
                />
              </div>
              <div className="grid grid-cols-4 items-center gap-5">
                <Label>Volume</Label>
                <VolumeNumberInput defaultValue={conversionObject.volume} />
              </div>
            </div>
            <DialogFooter className="mt-6">
              <Button
                type="submit"
                disabled={editFetcher.state === "submitting"}
              >
                {editFetcher.state === "submitting" && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Update
              </Button>
            </DialogFooter>
          </editFetcher.Form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        onOpenChange={(open) => {
          if (!open) {
            setIsDeleting(false);
          }
        }}
        open={isDeleting}
      >
        <AlertDialogContent>
          <AlertDialogTitle>
            Delete the {conversionObject.name} object?
          </AlertDialogTitle>
          <AlertDialogDescription>
            This action cannot be undone, this will permanently delete the{" "}
            {conversionObject.name} object.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline" onClick={() => setIsDeleting(false)}>
                Cancel
              </Button>
            </AlertDialogCancel>
            <deleteFetcher.Form method="DELETE">
              <input type="hidden" name="intent" value="delete" />
              <input type="hidden" name="id" value={conversionObject.id} />
              <AlertDialogAction asChild>
                <Button
                  type="submit"
                  disabled={deleteFetcher.state === "submitting"}
                >
                  {deleteFetcher.state === "submitting" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Delete
                </Button>
              </AlertDialogAction>
            </deleteFetcher.Form>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default function Index() {
  const fetcher = useFetcher<typeof action>();
  const data = useLoaderData<typeof loader>();
  const [isAddingNewObject, setIsAddingNewObject] = useState(false);

  useEffect(() => {
    if (fetcher.state === "idle" && fetcher.data?.ok) {
      setIsAddingNewObject(false);
    }
  }, [fetcher]);

  return (
    <div className="grid auto-rows-max gap-4 p-4 w-full h-screen items-center">
      <div className="grid h-9">
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
              <TableHead>Volume (cm³)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((object) => (
              <EditableRow conversionObject={object} key={object.id} />
            ))}
            <TableRow className="hover:bg-white">
              <TableCell>
                <Button onClick={() => setIsAddingNewObject(true)}>
                  Add new
                </Button>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>

        <Dialog
          onOpenChange={(open) => {
            if (!open) {
              setIsAddingNewObject(false);
            }
          }}
          open={isAddingNewObject}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add a new Object</DialogTitle>
            </DialogHeader>
            <fetcher.Form method="POST">
              <input type="hidden" name="intent" value="add" />

              <div className="grid gap-6">
                <div className="grid grid-cols-4 items-center gap-5">
                  <Label>Name</Label>
                  <Input className="col-span-3" name="name" type="text" />
                </div>
                <div className="grid grid-cols-4 items-center gap-5">
                  <Label>Volume</Label>
                  <VolumeNumberInput />
                </div>
              </div>
              <DialogFooter className="mt-6">
                <Button type="submit" disabled={fetcher.state === "submitting"}>
                  {fetcher.state === "submitting" && (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  )}
                  Add
                </Button>
              </DialogFooter>
            </fetcher.Form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
