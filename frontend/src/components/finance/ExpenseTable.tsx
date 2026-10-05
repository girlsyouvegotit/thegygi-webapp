import {
  MoreHorizontal,
  Loader2,
  Pencil,
  Trash2,
  Calendar,
  Tag,
} from "lucide-react";
import { format } from "date-fns";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import CustomPagination from "@/components/global/CustomPagination";
import type { Expense } from "@/types";

interface Props {
  expenses: Expense[];
  loading: boolean;
  onEdit: (expense: Expense) => void;
  onDelete: (id: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}

const categoryColors: Record<string, string> = {
  salary: "bg-blue-100 text-blue-700",
  utilities: "bg-yellow-100 text-yellow-700",
  maintenance: "bg-orange-100 text-orange-700",
  supplies: "bg-purple-100 text-purple-700",
  other: "bg-gray-100 text-gray-700",
};

const ExpenseTable = ({
  expenses,
  loading,
  onEdit,
  onDelete,
  page,
  setPage,
  totalPages,
}: Props) => {
  const getCategoryBadge = (category: string) => {
    const colorClass = categoryColors[category] || "bg-gray-100 text-gray-700";
    return (
      <Badge className={`${colorClass} hover:${colorClass} capitalize`}>
        <Tag className="h-3 w-3 mr-1" />
        {category}
      </Badge>
    );
  };

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={6} className="h-24 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </TableCell>
            </TableRow>
          ) : expenses.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-24 text-center text-muted-foreground"
              >
                No expense records found.
              </TableCell>
            </TableRow>
          ) : (
            expenses.map((expense) => (
              <TableRow key={expense._id}>
                <TableCell>
                  <div className="flex items-center gap-1 text-sm">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    {format(new Date(expense.date), "MMM d, yyyy")}
                  </div>
                </TableCell>
                <TableCell>{getCategoryBadge(expense.category)}</TableCell>
                <TableCell className="max-w-xs truncate">
                  {expense.description}
                </TableCell>
                <TableCell className="font-mono">
                ₦{expense.amount.toLocaleString()}
                </TableCell>
                <TableCell>{expense.academicYear?.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(expense)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(expense._id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" /> Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {expenses.length > 10 && (
        <CustomPagination
          loading={loading}
          page={page}
          setPage={setPage}
          totalPages={totalPages}
        />
      )}
    </div>
  );
};

export default ExpenseTable;