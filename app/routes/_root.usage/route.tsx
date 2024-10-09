import { getAuth } from "@clerk/remix/ssr.server";
import { LoaderFunctionArgs, redirect, SerializeFrom } from "@remix-run/node";

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
import { EndpointFilter } from "./endpoint-filter";
import { useState } from "react";

type UsageResponse = {
  id: string;
  createdAt: string;
  endpoint: string;
  method: string;
}[];

type ChartData = {
  timestamp: string;
  [key: string]: number | string; // count of requests to this endpoint
};

const ONE_DAY_MILLISECONDS = 24 * 60 * 60 * 1000;
const ONE_HOUR_MILLISECONDS = 60 * 60 * 1000;

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

export async function loader(args: LoaderFunctionArgs) {
  const { userId } = await getAuth(args);
  if (!userId) {
    return redirect("/login");
  }

  const headers = new Headers({
    "Content-Type": "application/json",
    cookie: args.request.headers.get("Cookie") ?? "",
  });

  const response = await fetch(`${process.env.API_BASE_URL}/usage`, {
    headers,
  });

  const chartConfig: ChartConfig = {};
  const chartData = getChartData();

  const usages = (await response.json()) as UsageResponse;

  usages.forEach((usage) => {
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

  return {
    usages,
    chartConfig,
    chartData,
  };
}

const getDerivedChartData = (
  initialChartConfig: ChartConfig,
  initialChartData: ChartData[],
  endpointFilter: EndpointFilter[]
) => {
  let chartData = initialChartData;
  let chartConfig = initialChartConfig;

  if (endpointFilter.some((filter) => filter.active)) {
    Object.keys(initialChartConfig).forEach((key) => {
      const matchingFilter = endpointFilter.find(
        (filter) => filter.value === key
      );
      if (matchingFilter?.active === false) {
        delete chartConfig[key];
      }
    });

    chartData = initialChartData.map((data) => {
      let newData: ChartData = { timestamp: data.timestamp };
      endpointFilter.forEach((filter) => {
        if (filter.active) {
          newData[filter.value] = data[filter.value];
        }
      });
      return newData;
    });
  }

  return { chartConfig, chartData };
};

export default function Usage() {
  const { chartConfig: initialChartConfig, chartData: initialChartData } =
    useLoaderData<typeof loader>();

  const [endpointFilter, setEndpointFilter] = useState<EndpointFilter[]>(
    Object.keys(initialChartConfig).map((endpointKey) => {
      return {
        label: <>{initialChartConfig[endpointKey].label}</>,
        value: endpointKey,
        active: false,
      };
    })
  );

  const { chartConfig, chartData } = getDerivedChartData(
    JSON.parse(JSON.stringify(initialChartConfig)),
    initialChartData,
    endpointFilter
  );

  const handleFilterChange = (selectedOption: EndpointFilter) => {
    setEndpointFilter((prevEndpointFilter) => {
      return prevEndpointFilter.map((option) => {
        if (option.value === selectedOption.value) {
          return {
            ...option,
            active: !option.active,
          };
        }

        return option;
      });
    });
  };

  return (
    <div className="grid gap-4">
      <div className="grid justify-end">
        <EndpointFilter
          options={endpointFilter}
          onSelect={handleFilterChange}
        />
      </div>
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
    </div>
  );
}
