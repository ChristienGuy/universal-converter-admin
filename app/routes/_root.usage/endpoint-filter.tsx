import { CommandList } from "cmdk";
import { Check, CheckIcon } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";

export type EndpointFilter = {
  label: ReactNode;
  value: string;
  active: boolean;
};

export function EndpointFilter({
  options,
  onSelect,
}: {
  options: EndpointFilter[];
  onSelect: (option: EndpointFilter) => void;
}) {
  const isAnyOptionSelected = options.some((option) => option.active);
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          className={cn("shadow-sm gap-2", {
            "bg-primary text-white": isAnyOptionSelected,
          })}
          variant="outline"
          size="sm"
        >
          Endpoints
          {isAnyOptionSelected && <CheckIcon className="size-3" />}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="p-0">
        <Command>
          <CommandInput />
          <CommandList>
            <CommandEmpty>No endpoints found</CommandEmpty>
            <CommandGroup>
              {options.map((option) => {
                const isSelected = option.active;

                return (
                  <CommandItem
                    key={option.value}
                    onSelect={() => {
                      onSelect({ ...option, active: !option.active });
                    }}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        "shadow-sm flex items-center justify-center border rounded-full size-5 [&_svg]:invisible",
                        {
                          "bg-primary [&_svg]:visible": isSelected,
                        }
                      )}
                    >
                      <CheckIcon className="size-3 text-white" />
                    </div>
                    <span>{option.label}</span>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
