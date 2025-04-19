
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, BarChart, CreditCard, Wallet } from "lucide-react";

const Dashboard = () => {
  // Mock data - in a real app, this would come from API/backend
  const balanceSummary = {
    totalBalance: 1250.75,
    income: 850.00,
    expenses: 623.45,
    savings: 227.30,
  };

  const spendingCategories = [
    { name: "Groceries", amount: 180.50, percentage: 29, color: "bg-finmate-green" },
    { name: "Rent", amount: 250.00, percentage: 40, color: "bg-finmate-purple" },
    { name: "Entertainment", amount: 82.95, percentage: 13, color: "bg-finmate-yellow" },
    { name: "Transport", amount: 60.00, percentage: 10, color: "bg-finmate-orange" },
    { name: "Other", amount: 50.00, percentage: 8, color: "bg-finmate-blue" },
  ];

  const recentTransactions = [
    { id: 1, description: "Grocery Store", amount: -45.23, date: "Apr 18", category: "Groceries" },
    { id: 2, description: "Part-time Job", amount: 250.00, date: "Apr 15", category: "Income" },
    { id: 3, description: "Coffee Shop", amount: -4.50, date: "Apr 14", category: "Food" },
    { id: 4, description: "Bus Pass", amount: -30.00, date: "Apr 12", category: "Transport" },
  ];

  const upcomingBills = [
    { id: 1, description: "Rent", amount: 250.00, dueDate: "Apr 30" },
    { id: 2, description: "Phone Bill", amount: 35.00, dueDate: "Apr 25" },
    { id: 3, description: "Internet", amount: 45.00, dueDate: "May 2" },
  ];

  const budgetProgress = 72; // percentage

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Welcome Back!</h1>
          <p className="text-muted-foreground">Here's an overview of your finances</p>
        </div>

        {/* Balance summary */}
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${balanceSummary.totalBalance.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">Available funds</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <Wallet className="h-4 w-4 mr-1 text-finmate-purple" /> Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                +${balanceSummary.income.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center">
                <CreditCard className="h-4 w-4 mr-1 text-finmate-purple" /> Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                -${balanceSummary.expenses.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Savings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-finmate-purple">
                ${balanceSummary.savings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        {/* Main content */}
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          {/* Left side */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            {/* Budget overview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Budget Overview</CardTitle>
                  <p className="text-muted-foreground">Monthly budget progress</p>
                </div>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <PieChart className="h-4 w-4" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <div>Monthly Budget</div>
                    <div className="font-medium">${balanceSummary.income.toFixed(2)}</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>Spent</div>
                    <div className="font-medium">${balanceSummary.expenses.toFixed(2)}</div>
                  </div>
                  <Progress value={budgetProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div>{budgetProgress}% used</div>
                    <div>28% remaining</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Spending by Category</h4>
                  <div className="space-y-4">
                    {spendingCategories.map((category) => (
                      <div key={category.name} className="flex items-center">
                        <div className={`w-3 h-3 rounded-full ${category.color} mr-2`} />
                        <div className="flex-1 flex justify-between items-center">
                          <div className="text-sm">{category.name}</div>
                          <div className="text-sm font-medium">${category.amount.toFixed(2)}</div>
                        </div>
                        <div className="ml-4 w-16 text-right text-xs text-muted-foreground">
                          {category.percentage}%
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Tabs defaultValue="recent">
              <div className="flex justify-between items-center">
                <TabsList>
                  <TabsTrigger value="recent">Recent Transactions</TabsTrigger>
                  <TabsTrigger value="upcoming">Upcoming Bills</TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="recent" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{tx.description}</p>
                            <p className="text-xs text-muted-foreground">{tx.date} · {tx.category}</p>
                          </div>
                          <div className={`font-medium ${tx.amount > 0 ? 'text-green-600' : 'text-red-500'}`}>
                            {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="upcoming" className="mt-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="space-y-4">
                      {upcomingBills.map((bill) => (
                        <div key={bill.id} className="flex items-center justify-between py-2 border-b last:border-0">
                          <div>
                            <p className="font-medium">{bill.description}</p>
                            <p className="text-xs text-muted-foreground">Due: {bill.dueDate}</p>
                          </div>
                          <div className="font-medium text-red-500">
                            -{bill.amount.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Right side */}
          <div className="space-y-6">
            {/* Savings Goals */}
            <Card>
              <CardHeader>
                <CardTitle>Savings Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium">New Laptop</h3>
                    <span className="text-sm text-muted-foreground">65%</span>
                  </div>
                  <Progress value={65} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$650 saved</span>
                    <span>$1000 goal</span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <h3 className="font-medium">Summer Trip</h3>
                    <span className="text-sm text-muted-foreground">30%</span>
                  </div>
                  <Progress value={30} className="h-2" />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>$300 saved</span>
                    <span>$1000 goal</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Tips */}
            <Card className="bg-finmate-light-purple border-none">
              <CardHeader className="pb-2">
                <CardTitle>Financial Tip</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm">
                  Consider using the 50/30/20 rule: 50% for needs, 30% for wants, and 20% for savings and debt repayment.
                </p>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <div className="text-sm">Biggest expense category</div>
                  <div className="font-medium">Rent</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm">Savings rate</div>
                  <div className="font-medium text-green-600">15%</div>
                </div>
                <div className="flex justify-between items-center">
                  <div className="text-sm">Budget adherence</div>
                  <div className="font-medium text-finmate-purple">Good</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Dashboard;
