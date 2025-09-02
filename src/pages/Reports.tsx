
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, PieChart, BarChart } from "lucide-react";
import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/formatCurrency";

const Reports = () => {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [reportData, setReportData] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    totalSavings: 0,
    goalContributions: 0,
    topCategories: []
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchReportData();
    }
  }, [user]);

  const fetchReportData = async () => {
    try {
      setIsLoading(true);
      
      // Get current month dates
      const now = new Date();
      const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      
      // Fetch transactions
      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', firstDay.toISOString().split('T')[0])
        .lte('date', lastDay.toISOString().split('T')[0]);

      if (transError) throw transError;

      // Fetch incomes
      const { data: incomes, error: incomeError } = await supabase
        .from('incomes')
        .select('*');

      if (incomeError) throw incomeError;

      // Fetch goals for contributions calculation
      const { data: goals, error: goalsError } = await supabase
        .from('goals')
        .select('*');

      if (goalsError) throw goalsError;

      // Calculate totals
      const totalExpenses = (transactions || [])
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);

      const totalIncomeFromTransactions = (transactions || [])
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + (typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount), 0);

      // Calculate monthly income from income sources
      const monthlyIncomeFromSources = (incomes || []).reduce((sum, income) => {
        const amount = parseFloat(income.amount.toString());
        switch (income.frequency) {
          case "Weekly":
            return sum + (amount * 4);
          case "Bi-weekly":
            return sum + (amount * 2);
          case "Monthly":
            return sum + amount;
          case "Annually":
            return sum + (amount / 12);
          default:
            return sum + amount;
        }
      }, 0);

      const totalIncome = monthlyIncomeFromSources + totalIncomeFromTransactions;
      const goalContributions = (goals || []).reduce((sum, goal) => sum + (typeof goal.current_amount === 'string' ? parseFloat(goal.current_amount || '0') : Number(goal.current_amount || 0)), 0);
      const totalSavings = totalIncome - totalExpenses - goalContributions;

      // Calculate category spending
      const categorySpending: Record<string, number> = {};
      (transactions || [])
        .filter(t => t.type === 'expense')
        .forEach(t => {
          const amount = typeof t.amount === 'string' ? parseFloat(t.amount) : t.amount;
          categorySpending[t.category] = (categorySpending[t.category] || 0) + amount;
        });

      const topCategories = Object.entries(categorySpending)
        .map(([name, amount]) => ({ name, amount: amount as number }))
        .sort((a, b) => (b.amount as number) - (a.amount as number))
        .slice(0, 5);

      setReportData({
        totalIncome,
        totalExpenses,
        totalSavings,
        goalContributions,
        topCategories
      });
      
    } catch (error) {
      console.error('Error fetching report data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Financial Reports</h1>
          <p className="text-muted-foreground">
            View detailed reports and analytics of your finances
          </p>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="spending">Spending Analysis</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Income
                  </CardTitle>
                  <LineChart className="h-4 w-4 text-finmate-purple" />
                </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {isLoading ? "Loading..." : formatCurrency(reportData.totalIncome, currency.code)}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     This month's total income
                   </p>
                 </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">
                    Total Expenses
                  </CardTitle>
                  <BarChart className="h-4 w-4 text-finmate-purple" />
                </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {isLoading ? "Loading..." : formatCurrency(reportData.totalExpenses, currency.code)}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     This month's total expenses
                   </p>
                 </CardContent>
              </Card>

               <Card>
                 <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                   <CardTitle className="text-sm font-medium">
                     Available Balance
                   </CardTitle>
                   <PieChart className="h-4 w-4 text-finmate-purple" />
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {isLoading ? "Loading..." : formatCurrency(reportData.totalSavings, currency.code)}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     After expenses and goal contributions
                   </p>
                 </CardContent>
               </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Top Spending Categories</CardTitle>
              </CardHeader>
               <CardContent>
                 <div className="space-y-4">
                   {isLoading ? (
                     <p className="text-muted-foreground text-center">Loading categories...</p>
                   ) : reportData.topCategories.length > 0 ? (
                     reportData.topCategories.map((category) => (
                       <div
                         key={category.name}
                         className="flex items-center justify-between"
                       >
                         <div className="space-y-1">
                           <p className="text-sm font-medium leading-none">
                             {category.name}
                           </p>
                         </div>
                         <div className="text-sm text-muted-foreground">
                           {formatCurrency(category.amount, currency.code)}
                         </div>
                       </div>
                     ))
                   ) : (
                     <p className="text-muted-foreground text-center">No spending data available</p>
                   )}
                 </div>
               </CardContent>
            </Card>
          </TabsContent>

           <TabsContent value="spending" className="space-y-4">
             <div className="grid gap-4 md:grid-cols-2">
               <Card>
                 <CardHeader>
                   <CardTitle>Goal Contributions</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {isLoading ? "Loading..." : formatCurrency(reportData.goalContributions, currency.code)}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Total saved towards goals
                   </p>
                 </CardContent>
               </Card>
               <Card>
                 <CardHeader>
                   <CardTitle>Expense Ratio</CardTitle>
                 </CardHeader>
                 <CardContent>
                   <div className="text-2xl font-bold">
                     {isLoading ? "Loading..." : `${reportData.totalIncome > 0 ? Math.round((reportData.totalExpenses / reportData.totalIncome) * 100) : 0}%`}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Of income spent on expenses
                   </p>
                 </CardContent>
               </Card>
             </div>
           </TabsContent>

          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Financial Trends</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px] flex items-center justify-center">
                <p className="text-muted-foreground">Trend analysis charts will be implemented here</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
};

export default Reports;
