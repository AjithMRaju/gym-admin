"use client"

import { useEffect, useState } from "react"
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import axiosInstance from "@/lib/config/axiosConfig"

interface ChartPoint {
  month: string
  year: number
  revenue: number
  newMembers: number
}

const chartConfig = {
  revenue: {
    label: "Revenue ($)",
    color: "var(--brand)",
  },
  newMembers: {
    label: "New Members",
    color: "----brand",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const [chartData, setChartData] = useState<ChartPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [activeMetric, setActiveMetric] = useState<"revenue" | "newMembers">(
    "revenue"
  )

  useEffect(() => {
    axiosInstance
      .get("/analytics/dashboard")
      .then((res) => setChartData(res.data.data.chartData))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Performance Overview</CardTitle>
          <CardDescription>
            Last 6 months —{" "}
            {activeMetric === "revenue" ? "Revenue" : "New Members"}
          </CardDescription>
        </div>
        <Select
          value={activeMetric}
          onValueChange={(v) => setActiveMetric(v as "revenue" | "newMembers")}
        >
          <SelectTrigger className="w-40!" size="sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectItem value="revenue">Revenue</SelectItem>
              <SelectItem value="newMembers">New Members</SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
      </CardHeader>

      <CardContent>
        {loading ? (
          <div className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">
            Loading chart…
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="h-[250px] w-full">
            <AreaChart
              data={chartData}
              margin={{ left: 0, right: 12, top: 8, bottom: 0 }}
            >
              <defs>
                <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--brand)"
                    stopOpacity={0.3}
                  />
                  <stop offset="95%" stopColor="var(--brand)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="fillMembers" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor="var(--brand-soft)"
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor="var(--brand-soft)"
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} strokeDasharray="3 3" />
              <XAxis
                dataKey="month"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                tick={{ fontSize: 12 }}
              />
              <ChartTooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    // indicator="dot"
                    formatter={(value, name) =>
                      name === "revenue"
                        ? [`$${Number(value).toLocaleString()}`, "Revenue"]
                        : [value,  "New Members"]
                    }
                  />
                }
              />
              {activeMetric === "revenue" ? (
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  stroke="var(--brand-soft)"
                  strokeWidth={2}
                />
              ) : (
                <Area
                  dataKey="newMembers"
                  type="natural"
                  fill="url(#fillMembers)"
                  stroke="var(--brand)"
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
