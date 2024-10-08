import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, redirect, TypedResponse } from "@remix-run/node";

import { useLoaderData } from "@remix-run/react";

import { Bar, BarChart, CartesianGrid, XAxis } from "recharts";
import {
  ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
  ChartTooltipContent,
} from "~/components/ui/chart";

type UsageResponse = {
  id: string;
  createdAt: string;
  endpoint: string;
  method: string;
};

export async function loader(
  args: LoaderFunctionArgs
): Promise<UsageResponse[] | TypedResponse<never>> {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/login");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    cookie: args.request.headers.get("Cookie") ?? "",
  });

  const usage = await fetch(`${process.env.API_BASE_URL}/usage`, {
    headers,
  });

  return usage.json();
}

type ChartData = {
  timestamp: string;
  [key: string]: number | string; // count of requests to this endpoint
};

export default function Usage() {
  const data = useLoaderData<typeof loader>();

  const chartConfig: ChartConfig = {};
  const chartData: ChartData[] = [];

  data.forEach((usage) => {
    const endpointKey = usage.endpoint.replaceAll("/", "");

    const timestamp = usage.createdAt.slice(0, 13);

    const index = chartData.findIndex((data) => data.timestamp === timestamp);

    // an index of -1 means that the timestamp does not exist in the chartData array
    if (index === -1) {
      chartData.push({
        timestamp,
        [endpointKey]: 1,
      });
    } else {
      const count = chartData[index][endpointKey] ?? 0;

      if (typeof count === "string") {
        throw new Error(`count should be a number, it is a string: ${count}`);
      }

      chartData[index] = {
        ...chartData[index],
        [endpointKey]: count + 1,
      };
    }

    if (!chartConfig[endpointKey]) {
      chartConfig[endpointKey] = {
        label: usage.endpoint,
        // TODO: add additional colors to tailwind.css for more than 5 bars
        color: `hsl(var(--chart-${Object.keys(chartConfig).length + 1}))`,
      };
    }
  });

  return (
    <div>
      <h1>Usage</h1>
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickLine={false}
            tickMargin={10}
            axisLine={false}
            tickFormatter={(value) => value.slice(0, 3)}
          />
          <ChartTooltip content={<ChartTooltipContent hideLabel />} />
          <ChartLegend content={<ChartLegendContent />} />
          {Object.keys(chartConfig).map((endpointKey) => (
            <Bar
              key={endpointKey}
              dataKey={endpointKey}
              stackId="a"
              fill={`var(--color-${endpointKey})`}
              // radius={[0, 0, 4, 4]}
            />
          ))}
          {/* <Bar
            dataKey="comparerandom"
            stackId="a"
            fill="var(--color-comparerandom)"
            radius={[0, 0, 4, 4]}
          />
          <Bar
            dataKey="objects"
            stackId="a"
            fill="var(--color-objects)"
            radius={[4, 4, 0, 0]}
          /> */}
        </BarChart>
      </ChartContainer>
      <code>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </code>
    </div>
  );
}
