import {
  MoreHorizontal,
  Loader2,
  Pencil,
  Trash2,
  CheckCircle,
  Clock,
  Calendar,
} from "lucide-react";

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
import type { Salary } from "@/types";
import { format } from "date-fns";

interface Props {
  salaries: Salary[];
  loading: boolean;
  onEdit: (salary: Salary) => void;
  onDelete: (id: string) => void;
  page: number;
  setPage: (page: number) => void;
  totalPages: number;
}

const monthNames = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December"
];

const SalaryTable = ({
  salaries,
  loading,
  onEdit,
  onDelete,
  page,
  setPage,
  totalPages,
}: Props) => {
  const getStatusBadge = (status: string) => {
    if (status === "paid") {
      return (
        <Badge className="bg-green-100 text-green-700 hover:bg-green-100 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" /> Paid
        </Badge>
      );
    }
    return (
      <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100 flex items-center gap-1">
        <Clock className="h-3 w-3" /> Pending
      </Badge>
    );
  };

  return (
    <div className="border border-border rounded-xl bg-card shadow-sm overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Employee</TableHead>
            <TableHead>Month/Year</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment Date</TableHead>
            <TableHead>Academic Year</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={7} className="h-24 text-center">
                <Loader2 className="h-6 w-6 animate-spin mx-auto text-primary" />
              </TableCell>
            </TableRow>
          ) : salaries.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={7}
                className="h-24 text-center text-muted-foreground"
              >
                No salary records found.
              </TableCell>
            </TableRow>
          ) : (
            salaries.map((salary) => (
              <TableRow key={salary._id}>
                <TableCell className="font-medium">
                  <div>
                    <p className="text-foreground">{salary.employee.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {salary.employee.email}
                    </p>
                  </div>
                </TableCell>
                <TableCell>
                  {monthNames[salary.month - 1]} {salary.year}
                </TableCell>
                <TableCell className="font-mono">
                  ₦{salary.amount.toLocaleString()}
                </TableCell>
                <TableCell>{getStatusBadge(salary.status)}</TableCell>
                <TableCell>
                  {salary.paymentDate ? (
                    <div className="flex items-center gap-1 text-sm">
                      <Calendar className="h-3 w-3 text-muted-foreground" />
                      {format(new Date(salary.paymentDate), "MMM d, yyyy")}
                    </div>
                  ) : (
                    <span className="text-muted-foreground text-sm">—</span>
                  )}
                </TableCell>
                <TableCell>{salary.academicYear?.name ?? "—"}</TableCell>
                <TableCell className="text-right">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onEdit(salary)}>
                        <Pencil className="mr-2 h-4 w-4" /> Edit
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        className="text-red-600"
                        onClick={() => onDelete(salary._id)}
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
      {salaries.length > 10 && (
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

export default SalaryTable;