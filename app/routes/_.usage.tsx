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

type ChartData = {
  timestamp: string;
  [key: string]: number | string; // count of requests to this endpoint
};

const ONE_DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MILLISECONDS = 60 * 60 * 1000;

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

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  weekday: "short",
});

function getChartData(
  {
    length,
  }: {
    /**
     * Length of the chart data array in hours, defaults to 25 to show the last 24 hours including the current hour
     */
    length: number;
  } = {
    length: 25,
  }
): ChartData[] {
  const startDate = new Date(Date.now() - ONE_DAY_MILLISECONDS);
  startDate.setMinutes(0);
  startDate.setSeconds(0);
  return new Array(length).fill(0).map((_, index) => {
    const timestamp = new Date(
      startDate.getTime() + index * ONE_HOUR_MILLISECONDS
    );

    return {
      timestamp: timestamp.toString(),
    };
  });
}

export default function Usage() {
  const data = useLoaderData<typeof loader>();

  const chartConfig: ChartConfig = {};
  const chartData = getChartData();

  data.forEach((usage) => {
    // key is a function of the method and endpoint
    // e.g GET /compare/random -> GETcomparerandom
    const endpointKey = `${usage.method}${usage.endpoint.replaceAll("/", "")}`;

    const usageTimestamp = new Date(usage.createdAt);
    usageTimestamp.setMinutes(0);
    usageTimestamp.setSeconds(0);

    const index = chartData.findIndex((data) => {
      return data.timestamp === usageTimestamp.toString();
    });

    // an index of -1 means that the timestamp does not exist in the chartData array
    if (index !== -1) {
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
        label: `${usage.method} ${usage.endpoint}`,
        // TODO: add additional colors to tailwind.css for more than 5 bars
        color: `hsl(var(--chart-${Object.keys(chartConfig).length + 1}))`,
      };
    }
  });

  return (
    <div className="rounded-xl shadow-sm border border-gray-200 p-6">
      <ChartContainer config={chartConfig}>
        <BarChart accessibilityLayer data={chartData}>
          <CartesianGrid vertical={false} />
          <XAxis
            dataKey="timestamp"
            tickMargin={14}
            axisLine={false}
            tickFormatter={(timestamp) => {
              return dateFormatter.format(new Date(timestamp));
            }}
          />
          <ChartTooltip
            content={
              <ChartTooltipContent
                labelFormatter={(timestamp) => {
                  return dateFormatter.format(new Date(timestamp));
                }}
              />
            }
          />
          <ChartLegend content={<ChartLegendContent />} />
          {Object.keys(chartConfig).map((endpointKey) => (
            <Bar
              key={endpointKey}
              dataKey={endpointKey}
              stackId="a"
              fill={`var(--color-${endpointKey})`}
            />
          ))}
        </BarChart>
      </ChartContainer>
    </div>
  );
}
