"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendUpIcon, TrendDownIcon } from "@phosphor-icons/react"
import axiosInstance from "@/lib/config/axiosConfig"

interface CardData {
  value: number
  previousValue?: number
  change: number
  trend: "up" | "down"
}

interface DashboardCards {
  totalRevenue: CardData
  newCustomers: CardData
  activeAccounts: CardData
  growthRate: { value: number; trend: "up" | "down" }
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("en-US").format(value)
}

function TrendBadge({ trend, change }: { trend: "up" | "down"; change: number }) {
  const isUp = trend === "up"
  return (
    <Badge variant="outline">
      {isUp ? <TrendUpIcon /> : <TrendDownIcon />}
      {isUp ? "+" : ""}
      {change}%
    </Badge>
  )
}

export function SectionCards() {
  const [cards, setCards] = useState<DashboardCards | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axiosInstance
      .get("/analytics/dashboard")
      .then((res) => setCards(res.data.data.cards))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="grid grid-cols-1 gap-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse @container/card">
            <CardHeader>
              <div className="h-4 w-24 rounded bg-muted" />
              <div className="h-8 w-32 rounded bg-muted" />
            </CardHeader>
            <CardFooter className="flex-col items-start gap-1.5">
              <div className="h-4 w-40 rounded bg-muted" />
              <div className="h-3 w-28 rounded bg-muted" />
            </CardFooter>
          </Card>
        ))}
      </div>
    )
  }

  if (!cards) return null

  return (
    <div className="grid grid-cols-1 gap-4 *:data-[slot=card]:bg-linear-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card *:data-[slot=card]:shadow-xs @xl/main:grid-cols-2 @5xl/main:grid-cols-4 dark:*:data-[slot=card]:bg-card">

      {/* Total Revenue */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Total Revenue</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatCurrency(cards.totalRevenue.value)}
          </CardTitle>
          <CardAction>
            <TrendBadge trend={cards.totalRevenue.trend} change={cards.totalRevenue.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {cards.totalRevenue.trend === "up" ? "Trending up this month" : "Down this month"}
            {cards.totalRevenue.trend === "up"
              ? <TrendUpIcon className="size-4" />
              : <TrendDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            Compared to last month ({formatCurrency(cards.totalRevenue.previousValue ?? 0)})
          </div>
        </CardFooter>
      </Card>

      {/* New Customers */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>New Customers</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(cards.newCustomers.value)}
          </CardTitle>
          <CardAction>
            <TrendBadge trend={cards.newCustomers.trend} change={cards.newCustomers.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {cards.newCustomers.trend === "up"
              ? "Growing this period"
              : `Down ${Math.abs(cards.newCustomers.change)}% this period`}
            {cards.newCustomers.trend === "up"
              ? <TrendUpIcon className="size-4" />
              : <TrendDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {cards.newCustomers.trend === "up"
              ? "Acquisition is on track"
              : "Acquisition needs attention"}
          </div>
        </CardFooter>
      </Card>

      {/* Active Accounts */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Active Accounts</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {formatNumber(cards.activeAccounts.value)}
          </CardTitle>
          <CardAction>
            <TrendBadge trend={cards.activeAccounts.trend} change={cards.activeAccounts.change} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {cards.activeAccounts.trend === "up"
              ? "Strong user retention"
              : "Retention declining"}
            {cards.activeAccounts.trend === "up"
              ? <TrendUpIcon className="size-4" />
              : <TrendDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {cards.activeAccounts.trend === "up"
              ? "Engagement exceeds targets"
              : "Review inactive accounts"}
          </div>
        </CardFooter>
      </Card>

      {/* Growth Rate */}
      <Card className="@container/card">
        <CardHeader>
          <CardDescription>Growth Rate</CardDescription>
          <CardTitle className="text-2xl font-semibold tabular-nums @[250px]/card:text-3xl">
            {cards.growthRate.value > 0 ? "+" : ""}
            {cards.growthRate.value}%
          </CardTitle>
          <CardAction>
            <TrendBadge trend={cards.growthRate.trend} change={Math.abs(cards.growthRate.value)} />
          </CardAction>
        </CardHeader>
        <CardFooter className="flex-col items-start gap-1.5 text-sm">
          <div className="line-clamp-1 flex gap-2 font-medium">
            {cards.growthRate.trend === "up"
              ? "Steady performance increase"
              : "Growth rate declining"}
            {cards.growthRate.trend === "up"
              ? <TrendUpIcon className="size-4" />
              : <TrendDownIcon className="size-4" />}
          </div>
          <div className="text-muted-foreground">
            {cards.growthRate.trend === "up"
              ? "Meets growth projections"
              : "Review strategy"}
          </div>
        </CardFooter>
      </Card>

    </div>
  )
}