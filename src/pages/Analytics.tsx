import { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/hooks/use-toast";
import { CSVLink } from "react-csv";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Area, AreaChart
} from 'recharts';
import { 
  TrendingUp, TrendingDown, DollarSign, Calendar, Download, 
  BarChart3, PieChart as PieChartIcon, Activity 
} from "lucide-react";
import { subDays, subWeeks, subMonths, format, startOfWeek, startOfMonth, endOfWeek, endOfMonth } from "date-fns";

interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  type: 'income' | 'expense';
  date: string;
  created_at: string;
}

interface CategoryData {
  category: string;
  amount: number;
  count: number;
  percentage: number;
}

interface TrendData {
  period: string;
  income: number;
  expenses: number;
  net: number;
}

const COLORS = ['hsl(var(--primary))', 'hsl(var(--secondary))', 'hsl(var(--accent))', '#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];

export default function Analytics() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [period, setPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month');
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [insights, setInsights] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netSavings: 0,
    topCategory: '',
    avgDailySpend: 0,
    budgetUtilization: 0
  });

  useEffect(() => {
    if (user) {
      fetchAnalyticsData();
    }
  }, [user, period]);

  const fetchAnalyticsData = async () => {
    try {
      const endDate = new Date();
      let startDate = new Date();

      switch (period) {
        case 'week':
          startDate = subWeeks(endDate, 1);
          break;
        case 'month':
          startDate = subMonths(endDate, 1);
          break;
        case 'quarter':
          startDate = subMonths(endDate, 3);
          break;
        case 'year':
          startDate = subMonths(endDate, 12);
          break;
      }

      const { data: transactionsData, error } = await supabase
        .from('transactions')
        .select('*')
        .gte('date', format(startDate, 'yyyy-MM-dd'))
        .lte('date', format(endDate, 'yyyy-MM-dd'))
        .order('date', { ascending: true });

      if (error) throw error;

      setTransactions(transactionsData as Transaction[] || []);
      processAnalyticsData(transactionsData as Transaction[] || []);
    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const processAnalyticsData = (data: Transaction[]) => {
    // Process category data
    const categoryMap = new Map<string, { amount: number; count: number }>();
    let totalIncome = 0;
    let totalExpenses = 0;

    data.forEach(transaction => {
      if (transaction.type === 'expense') {
        totalExpenses += transaction.amount;
        const existing = categoryMap.get(transaction.category) || { amount: 0, count: 0 };
        categoryMap.set(transaction.category, {
          amount: existing.amount + transaction.amount,
          count: existing.count + 1
        });
      } else {
        totalIncome += transaction.amount;
      }
    });

    const categoryData = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      amount: data.amount,
      count: data.count,
      percentage: (data.amount / totalExpenses) * 100
    })).sort((a, b) => b.amount - a.amount);

    setCategoryData(categoryData);

    // Process trend data
    const trendMap = new Map<string, { income: number; expenses: number }>();
    
    data.forEach(transaction => {
      const date = new Date(transaction.date);
      let periodKey = '';
      
      if (period === 'week') {
        periodKey = format(date, 'EEE');
      } else if (period === 'month') {
        periodKey = format(date, 'MMM dd');
      } else {
        periodKey = format(date, 'MMM yyyy');
      }

      const existing = trendMap.get(periodKey) || { income: 0, expenses: 0 };
      
      if (transaction.type === 'income') {
        existing.income += transaction.amount;
      } else {
        existing.expenses += transaction.amount;
      }
      
      trendMap.set(periodKey, existing);
    });

    const trendData = Array.from(trendMap.entries()).map(([period, data]) => ({
      period,
      income: data.income,
      expenses: data.expenses,
      net: data.income - data.expenses
    }));

    setTrendData(trendData);

    // Calculate insights
    const netSavings = totalIncome - totalExpenses;
    const topCategory = categoryData[0]?.category || 'N/A';
    const daysInPeriod = period === 'week' ? 7 : period === 'month' ? 30 : period === 'quarter' ? 90 : 365;
    const avgDailySpend = totalExpenses / daysInPeriod;

    setInsights({
      totalIncome,
      totalExpenses,
      netSavings,
      topCategory,
      avgDailySpend,
      budgetUtilization: 0 // This would need budget data to calculate
    });
  };

  const exportData = () => {
    return transactions.map(t => ({
      Date: t.date,
      Description: t.description,
      Category: t.category,
      Type: t.type,
      Amount: t.amount
    }));
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-96">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Financial Analytics</h1>
            <p className="text-muted-foreground">
              Analyze your spending patterns and financial trends
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={period} onValueChange={(value: any) => setPeriod(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="week">Week</SelectItem>
                <SelectItem value="month">Month</SelectItem>
                <SelectItem value="quarter">Quarter</SelectItem>
                <SelectItem value="year">Year</SelectItem>
              </SelectContent>
            </Select>
            <CSVLink
              data={exportData()}
              filename={`financial-report-${format(new Date(), 'yyyy-MM-dd')}.csv`}
            >
              <Button variant="outline" className="gap-2">
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </CSVLink>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Income</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(insights.totalIncome, currency.symbol)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
              <TrendingDown className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(insights.totalExpenses, currency.symbol)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Net Savings</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${insights.netSavings >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatCurrency(insights.netSavings, currency.symbol)}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Daily Spend</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                        {formatCurrency(insights.avgDailySpend, currency.symbol)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <Tabs defaultValue="trends" className="space-y-4">
          <TabsList>
            <TabsTrigger value="trends" className="gap-2">
              <BarChart3 className="h-4 w-4" />
              Trends
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2">
              <PieChartIcon className="h-4 w-4" />
              Categories
            </TabsTrigger>
            <TabsTrigger value="patterns" className="gap-2">
              <Activity className="h-4 w-4" />
              Patterns
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="trends" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Income vs Expenses Trend</CardTitle>
                <CardDescription>
                  Track your financial flow over the selected period
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency.symbol)} />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="income" 
                      stackId="1"
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.6}
                      name="Income"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2"
                      stroke="hsl(var(--destructive))" 
                      fill="hsl(var(--destructive))" 
                      fillOpacity={0.6}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Net Savings Trend</CardTitle>
                <CardDescription>
                  Your savings progression over time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <LineChart data={trendData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="period" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatCurrency(Number(value), currency.symbol)} />
                    <Line 
                      type="monotone" 
                      dataKey="net" 
                      stroke="hsl(var(--primary))" 
                      strokeWidth={3}
                      name="Net Savings"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Spending by Category</CardTitle>
                  <CardDescription>
                    Distribution of your expenses
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ category, percentage }) => `${category} (${percentage.toFixed(1)}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="amount"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(Number(value), currency.symbol)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Category Breakdown</CardTitle>
                  <CardDescription>
                    Detailed spending analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {categoryData.slice(0, 5).map((category, index) => (
                      <div key={category.category} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <span className="font-medium">{category.category}</span>
                          <Badge variant="secondary">{category.count} transactions</Badge>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(category.amount, currency.symbol)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {category.percentage.toFixed(1)}%
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="patterns" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Spending Insights</CardTitle>
                <CardDescription>
                  AI-powered insights about your spending habits
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Top Spending Category</h4>
                    <p className="text-sm">
                      You spent the most on <strong>{insights.topCategory}</strong> this {period}.
                      Consider setting a budget limit for this category.
                    </p>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Savings Rate</h4>
                    <p className="text-sm">
                      {insights.netSavings > 0 
                        ? `Great job! You saved ${formatCurrency(insights.netSavings, currency.symbol)} this ${period}.`
                        : `You overspent by ${formatCurrency(Math.abs(insights.netSavings), currency.symbol)} this ${period}. Consider reviewing your expenses.`
                      }
                    </p>
                  </div>
                  
                  <div className="p-4 bg-muted rounded-lg">
                    <h4 className="font-semibold mb-2">Daily Average</h4>
                    <p className="text-sm">
                      Your average daily spending is {formatCurrency(insights.avgDailySpend, currency.symbol)}.
                      Try to keep daily expenses below this amount to maintain your budget.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </MainLayout>
  );
}