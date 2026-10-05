import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";

const Finance = () => {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Finance Management</h2>
        <p className="text-muted-foreground">
          Manage fees, expenses, and salaries
        </p>
      </div>

      <Tabs defaultValue="fees">
        <TabsList className="grid w-full max-w-md grid-cols-3">
          <TabsTrigger value="fees">Fees</TabsTrigger>
          <TabsTrigger value="expenses">Expenses</TabsTrigger>
          <TabsTrigger value="salary">Salary</TabsTrigger>
        </TabsList>
        <TabsContent value="fees">
          <Card>
            <CardHeader>
              <CardTitle>Fee Collection</CardTitle>
              <CardDescription>
                Manage student fees and payments
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Fee management interface coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="expenses">
          <Card>
            <CardHeader>
              <CardTitle>Expenses</CardTitle>
              <CardDescription>Track platform expenses</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Expense management interface coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="salary">
          <Card>
            <CardHeader>
              <CardTitle>Salary</CardTitle>
              <CardDescription>Manage employee salaries</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-center py-8">
                Salary management interface coming soon
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Finance;
