import { useState } from "react";
import {
    Pencil,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  ChevronDown,
  ArrowUpDown,
  Wallet,
  TrendingUp,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import NairaWatermark from "@/components/finance/NairaWatermark";
import { cn } from "@/lib/utils";
import type { Fee } from "@/types";

interface Props {
  fees: Fee[];
  loading: boolean;
  onEdit: (fee: Fee) => void;
  onDelete: (id: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
  externalSearch?: string;
  onExternalSearchChange?: (value: string) => void;
}

type SortField = "student" | "amount" | "dueDate" | "status";
type SortDirection = "asc" | "desc";

interface SortableHeaderProps {
  field: SortField;
  label: string;
  sortField: SortField;
  onToggleSort: (field: SortField) => void;
}

const SortableHeader = ({
  field,
  label,
  sortField,
  onToggleSort,
}: SortableHeaderProps) => (
  <button
    type="button"
    onClick={() => onToggleSort(field)}
    className="group flex items-center gap-1 text-xs font-semibold text-slate-500 transition-colors hover:text-slate-900"
  >
    {label}
    <ArrowUpDown
      className={cn(
        "h-3 w-3 text-slate-400 transition-colors group-hover:text-slate-600",
        sortField === field && "text-primary",
      )}
    />
  </button>
);

const glassCard =
  "rounded-[22px] border border-white/60 bg-white/70 backdrop-blur-xl shadow-[0_8px_28px_rgba(31,38,135,0.06)]";

const FeeTable = ({
  fees = [],
  loading,
  onEdit,
  onDelete,
  page,
  setPage,
  totalPages = 1,
  externalSearch,
  onExternalSearchChange,
}: Props) => {
  const [sortField, setSortField] = useState<SortField>("dueDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [localSearch, setLocalSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const searchQuery = externalSearch ?? localSearch;
  const setSearchQuery = onExternalSearchChange ?? setLocalSearch;

  const processedFees = fees
    .filter((fee) => {
      const q = searchQuery.toLowerCase();
      const matchesSearch =
        !q ||
        fee.student?.name?.toLowerCase().includes(q) ||
        fee.student?.email?.toLowerCase().includes(q) ||
        fee.description?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || fee.status === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => {
      const direction = sortDirection === "asc" ? 1 : -1;

      switch (sortField) {
        case "student":
          return (
            (a.student?.name || "").localeCompare(b.student?.name || "") *
            direction
          );
        case "amount":
          return ((a.amount || 0) - (b.amount || 0)) * direction;
        case "dueDate":
          return (
            (new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()) *
            direction
          );
        case "status":
          return a.status.localeCompare(b.status) * direction;
        default:
          return 0;
      }
    });

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "paid":
        return (
          <Badge className="gap-1 border border-emerald-200 bg-emerald-50 font-medium text-emerald-700">
            <CheckCircle className="h-3 w-3" /> Paid
          </Badge>
        );
      case "pending":
        return (
          <Badge className="gap-1 border border-amber-200 bg-amber-50 font-medium text-amber-700">
            <Clock className="h-3 w-3" /> Pending
          </Badge>
        );
      case "overdue":
        return (
          <Badge className="gap-1 border border-rose-200 bg-rose-50 font-medium text-rose-700">
            <XCircle className="h-3 w-3" /> Overdue
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return "?";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const totalAmount = fees.reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const paidAmount = fees
    .filter((fee) => fee.status === "paid")
    .reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const pendingAmount = fees
    .filter((fee) => fee.status === "pending")
    .reduce((sum, fee) => sum + (fee.amount || 0), 0);
  const overdueAmount = fees
    .filter((fee) => fee.status === "overdue")
    .reduce((sum, fee) => sum + (fee.amount || 0), 0);

  const collectionRate =
    totalAmount > 0 ? Math.round((paidAmount / totalAmount) * 100) : 0;

  return (
    <div className="space-y-4 sm:space-y-5">
      {/* KPI cards */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4 sm:gap-4">
        <div className="relative overflow-hidden rounded-[22px] bg-gradient-to-br from-primary via-[#b03ad4] to-[#8f148f] p-5 text-white shadow-lg shadow-primary/25 sm:col-span-2 lg:col-span-2 sm:p-6">
          <div className="pointer-events-none absolute -right-6 -bottom-6 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
          <NairaWatermark tone="light" className="right-2 bottom-0 text-white/25" />
          <div className="relative z-10">
            <div className="mb-2 flex items-center gap-2">
              <Wallet className="h-4 w-4 text-white/70" />
              <span className="text-xs font-medium text-white/70">
                Total Fees
              </span>
            </div>
            <p className="text-2xl font-bold tracking-tight sm:text-3xl">
              ₦{totalAmount.toLocaleString()}
            </p>
            <div className="mt-2 flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 px-2 py-0.5 text-xs font-semibold text-white">
                <TrendingUp className="h-3 w-3" /> {collectionRate}% collected
              </span>
            </div>
          </div>
        </div>

        <div className={cn(glassCard, "flex items-center justify-between p-4 sm:p-5")}>
          <div>
            <span className="text-xs font-medium text-slate-400">Paid</span>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              ₦{paidAmount.toLocaleString()}
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle className="h-5 w-5" />
          </div>
        </div>

        <div className={cn(glassCard, "flex items-center justify-between p-4 sm:p-5")}>
          <div>
            <span className="text-xs font-medium text-slate-400">Pending</span>
            <h3 className="mt-1 text-xl font-bold tracking-tight text-slate-900">
              ₦{pendingAmount.toLocaleString()}
            </h3>
          </div>
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
            <Clock className="h-5 w-5" />
          </div>
        </div>
      </div>

      {overdueAmount > 0 && (
        <div className="flex flex-col gap-3 rounded-[20px] border border-rose-200/80 bg-rose-50/60 p-4 sm:flex-row sm:items-center">
          <div className="flex min-w-0 flex-1 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-rose-100">
              <AlertTriangle className="h-4 w-4 text-rose-500" />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-semibold text-rose-700">
                ₦{overdueAmount.toLocaleString()} in overdue fees
              </p>
              <p className="text-xs text-rose-500">
                {fees.filter((f) => f.status === "overdue").length} students
                have overdue payments
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="h-9 shrink-0 rounded-xl border-rose-200 text-xs text-rose-600 hover:bg-rose-50"
            onClick={() => setStatusFilter("overdue")}
          >
            View Overdue
          </Button>
        </div>
      )}

      {/* Toolbar */}
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Search by student or description..."
            className="h-11 rounded-xl border-slate-200/80 bg-white/80 pl-10 text-sm backdrop-blur-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              className="h-11 shrink-0 gap-1.5 rounded-xl border-slate-200/80 bg-white/80 text-slate-600 hover:text-slate-900"
            >
              <Filter className="h-3.5 w-3.5 text-slate-400" />
              {statusFilter === "all" ? "All Status" : statusFilter}
              <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44 rounded-xl">
            <DropdownMenuItem onClick={() => setStatusFilter("all")}>
              All
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => setStatusFilter("paid")}>
              Paid
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("pending")}>
              Pending
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setStatusFilter("overdue")}>
              Overdue
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* List */}
      <div className={cn(glassCard, "overflow-hidden")}>
        <div className="hidden lg:block">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/70">
                <th className="px-5 py-3.5 text-left">
                  <SortableHeader
                    field="student"
                    label="Student"
                    sortField={sortField}
                    onToggleSort={toggleSort}
                  />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <SortableHeader
                    field="amount"
                    label="Amount"
                    sortField={sortField}
                    onToggleSort={toggleSort}
                  />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <SortableHeader
                    field="dueDate"
                    label="Due Date"
                    sortField={sortField}
                    onToggleSort={toggleSort}
                  />
                </th>
                <th className="px-5 py-3.5 text-left">
                  <SortableHeader
                    field="status"
                    label="Status"
                    sortField={sortField}
                    onToggleSort={toggleSort}
                  />
                </th>
                <th className="px-5 py-3.5 text-left text-xs font-semibold text-slate-500">
                  Academic Year
                </th>
                <th className="px-5 py-3.5 text-right text-xs font-semibold text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }, (_, i) => (
                  <tr key={`skel-${i}`}>
                    <td className="px-5 py-3.5" colSpan={6}>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200/80" />
                        <div className="min-w-0 flex-1 space-y-2">
                          <div className="h-3 w-1/3 animate-pulse rounded bg-slate-200/80" />
                          <div className="h-2.5 w-1/4 animate-pulse rounded bg-slate-100" />
                        </div>
                        <div className="h-6 w-16 animate-pulse rounded-full bg-slate-100" />
                      </div>
                    </td>
                  </tr>
                ))
              ) : processedFees.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-5 py-12 text-center text-slate-500"
                  >
                    No fee records found.
                  </td>
                </tr>
              ) : (
                processedFees.map((fee) => (
                  <tr
                    key={fee._id}
                    className="group transition-colors hover:bg-primary/[0.03]"
                  >
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8 border border-slate-200">
                          <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                            {getInitials(fee.student?.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-slate-900">
                            {fee.student?.name || "Unknown"}
                          </p>
                          <p className="truncate text-xs text-slate-400">
                            {fee.student?.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="font-mono text-sm font-semibold text-slate-900">
                        ₦{fee.amount?.toLocaleString() || "0"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-600">
                        {fee.dueDate
                          ? format(new Date(fee.dueDate), "MMM d, yyyy")
                          : "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      {getStatusBadge(fee.status)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="text-sm text-slate-500">
                        {fee.academicYear?.name || "—"}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => onEdit(fee)}
                          title="Edit"
                        >
                          <Pencil className="h-3.5 w-3.5 text-slate-500" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 rounded-lg"
                          onClick={() => onDelete(fee._id)}
                          title="Delete"
                        >
                          <Trash2 className="h-3.5 w-3.5 text-rose-500" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="divide-y divide-slate-100 lg:hidden">
          {loading ? (
            <div className="space-y-4 p-4">
              {Array.from({ length: 4 }, (_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="h-10 w-10 animate-pulse rounded-full bg-slate-200/80" />
                  <div className="min-w-0 flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-slate-200/80" />
                    <div className="h-2.5 w-1/3 animate-pulse rounded bg-slate-100" />
                  </div>
                </div>
              ))}
            </div>
          ) : processedFees.length === 0 ? (
            <div className="p-10 text-center text-sm text-slate-500">
              No fee records found.
            </div>
          ) : (
            processedFees.map((fee) => (
              <div key={fee._id} className="space-y-3.5 p-4 sm:p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-center gap-3">
                    <Avatar className="h-10 w-10 shrink-0 border border-slate-200">
                      <AvatarFallback className="bg-primary/10 text-xs font-bold text-primary">
                        {getInitials(fee.student?.name)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-slate-900">
                        {fee.student?.name || "Unknown"}
                      </p>
                      <p className="truncate text-xs text-slate-400">
                        {fee.student?.email || "—"}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(fee.status)}
                </div>

                <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50/80 p-3.5">
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Amount
                    </p>
                    <p className="mt-0.5 font-mono text-sm font-semibold text-slate-900">
                      ₦{fee.amount?.toLocaleString() || "0"}
                    </p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium uppercase tracking-wide text-slate-400">
                      Due Date
                    </p>
                    <p className="mt-0.5 text-sm text-slate-700">
                      {fee.dueDate
                        ? format(new Date(fee.dueDate), "MMM d, yyyy")
                        : "—"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2.5">
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 rounded-xl text-xs"
                    onClick={() => onEdit(fee)}
                  >
                    <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-10 flex-1 rounded-xl text-xs text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                    onClick={() => onDelete(fee._id)}
                  >
                    <Trash2 className="mr-1.5 h-3.5 w-3.5" /> Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-3">
          <p className="text-xs text-slate-400">
            Page {page} of {totalPages}
          </p>
          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-xl p-0"
              disabled={page === 1 || loading}
              onClick={() => setPage(Math.max(1, page - 1))}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-9 w-9 rounded-xl p-0"
              disabled={page === totalPages || loading}
              onClick={() => setPage(Math.min(totalPages, page + 1))}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default FeeTable;
