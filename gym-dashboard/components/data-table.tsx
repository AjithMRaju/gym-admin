"use client"

import { useEffect, useState } from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  CheckCircleIcon,
  SpinnerIcon,
  DotsThreeVerticalIcon,
  ColumnsIcon,
  CaretDownIcon,
  CaretDoubleLeftIcon,
  CaretLeftIcon,
  CaretRightIcon,
  CaretDoubleRightIcon,
} from "@phosphor-icons/react"
import axiosInstance from "@/lib/config/axiosConfig"

interface SubscriptionRow {
  id: number
  subscriptionId: string
  header: string      // client name
  email: string
  type: string        // plan name
  status: "Done" | "In Progress"
  subscriptionStatus: string
  target: string      // end date
  limit: string       // amount paid
  reviewer: string    // payment method
}

const columns: ColumnDef<SubscriptionRow>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
          aria-label="Select all"
        />
      </div>
    ),
    cell: ({ row }) => (
      <div className="flex items-center justify-center">
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(v) => row.toggleSelected(!!v)}
          aria-label="Select row"
        />
      </div>
    ),
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "header",
    header: "Client",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.header}</p>
        <p className="text-xs text-muted-foreground">{row.original.email}</p>
      </div>
    ),
    enableHiding: false,
  },
  {
    accessorKey: "type",
    header: "Plan",
    cell: ({ row }) => (
      <Badge variant="outline" className="px-1.5 text-muted-foreground">
        {row.original.type}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge variant="outline" className="gap-1 px-1.5 text-muted-foreground">
        {row.original.status === "Done" ? (
          <CheckCircleIcon className="fill-green-500 dark:fill-green-400" />
        ) : (
          <SpinnerIcon className="animate-spin" />
        )}
        {row.original.subscriptionStatus}
      </Badge>
    ),
  },
  {
    accessorKey: "target",
    header: "Expires",
    cell: ({ row }) => (
      <span className="text-sm tabular-nums">{row.original.target}</span>
    ),
  },
  {
    accessorKey: "limit",
    header: () => <div className="text-right">Amount Paid</div>,
    cell: ({ row }) => (
      <div className="text-right font-medium tabular-nums">{row.original.limit}</div>
    ),
  },
  {
    accessorKey: "reviewer",
    header: "Payment Method",
    cell: ({ row }) => (
      <span className="capitalize text-sm">{row.original.reviewer}</span>
    ),
  },
  {
    id: "actions",
    cell: () => (
      <DropdownMenu>
        <DropdownMenuTrigger >
          <Button
            variant="ghost"
            size="icon"
            className="flex size-8 text-muted-foreground"
          >
            <DotsThreeVerticalIcon />
            <span className="sr-only">Open menu</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-32">
          <DropdownMenuItem>View</DropdownMenuItem>
          <DropdownMenuItem>Edit</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem variant="destructive">Cancel</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
]

export function DataTable() {
  const [data, setData] = useState<SubscriptionRow[]>([])
  const [loading, setLoading] = useState(true)
  const [globalFilter, setGlobalFilter] = useState("")
  const [rowSelection, setRowSelection] = useState({})
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])
  const [sorting, setSorting] = useState<SortingState>([])
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 })

  useEffect(() => {
    axiosInstance
      .get("/analytics/dashboard")
      .then((res) => setData(res.data.data.tableData))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const table = useReactTable({
    data,
    columns,
    state: { sorting, columnVisibility, rowSelection, columnFilters, pagination, globalFilter },
    getRowId: (row) => String(row.id),
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: setPagination,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
  })

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-2">
        <Input
          placeholder="Search clients or plans…"
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-xs"
        />
        <DropdownMenu>
          <DropdownMenuTrigger >
            <Button variant="outline" size="sm">
              <ColumnsIcon className="mr-1" />
              Columns
              <CaretDownIcon className="ml-1" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            {table
              .getAllColumns()
              .filter((col) => col.getCanHide())
              .map((col) => (
                <DropdownMenuCheckboxItem
                  key={col.id}
                  className="capitalize"
                  checked={col.getIsVisible()}
                  onCheckedChange={(v) => col.toggleVisibility(!!v)}
                >
                  {col.id}
                </DropdownMenuCheckboxItem>
              ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded border">
        <Table>
          <TableHeader className="sticky top-0 z-10 bg-muted">
            {table.getHeaderGroups().map((hg) => (
              <TableRow key={hg.id}>
                {hg.headers.map((h) => (
                  <TableHead key={h.id} colSpan={h.colSpan}>
                    {h.isPlaceholder
                      ? null
                      : flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-32 text-center text-muted-foreground">
                  Loading subscriptions…
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center text-muted-foreground">
                  No subscriptions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-2">
        <div className="hidden text-sm text-muted-foreground lg:block">
          {table.getFilteredSelectedRowModel().rows.length} of{" "}
          {table.getFilteredRowModel().rows.length} row(s) selected.
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            {/* <Label htmlFor="rows-per-page" className="text-sm font-medium">
              Rows per page
            </Label> */}
            <Select
              value={`${table.getState().pagination.pageSize}`}
              onValueChange={(v) => table.setPageSize(Number(v))}
            >
              <SelectTrigger size="sm" className="w-16" id="rows-per-page">
                <SelectValue />
              </SelectTrigger>
              <SelectContent side="top">
                <SelectGroup>
                  {[10, 20, 30, 50].map((ps) => (
                    <SelectItem key={ps} value={`${ps}`}>{ps}</SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <span className="text-sm font-medium">
            Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()}
          </span>
          <div className="flex items-center gap-1">
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
              <CaretDoubleLeftIcon />
            </Button>
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>
              <CaretLeftIcon />
            </Button>
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>
              <CaretRightIcon />
            </Button>
            <Button variant="outline" size="icon" className="size-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)} disabled={!table.getCanNextPage()}>
              <CaretDoubleRightIcon />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}