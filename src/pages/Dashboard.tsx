import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart, BarChart, CreditCard, Wallet } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, profile, isLoading } = useAuth();
  const { currency } = useCurrency();
  
  const [balanceSummary, setBalanceSummary] = useState({
    totalBalance: 0,
    income: 0,
    expenses: 0,
    savings: 0,
  });

  const [recentTransactions, setRecentTransactions] = useState([]);
  const [goals, setGoals] = useState([]);
  
  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user) {
      fetchDashboardData();
    }
  }, [user, isLoading, navigate]);

  const fetchDashboardData = async () => {
    try {
      // Fetch transactions
      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(4);

      setRecentTransactions(transactions || []);

      // Calculate balance summary
      const income = (transactions || [])
        .filter(tx => tx.type === 'income')
        .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
      
      const expenses = Math.abs((transactions || [])
        .filter(tx => tx.type === 'expense')
        .reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0));

      const savings = income - expenses;
      const totalBalance = savings;

      setBalanceSummary({
        totalBalance,
        income,
        expenses,
        savings: Math.max(0, savings)
      });

      // Fetch goals
      const { data: goalsData } = await supabase
        .from('goals')
        .select('*')
        .limit(2);

      setGoals(goalsData || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-finmate-purple mx-auto mb-4"></div>
            <p>Loading...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  const getCurrentGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">{getCurrentGreeting()}, {profile.name.split(' ')[0]}!</h1>
          <p className="text-muted-foreground">Here's an overview of your finances</p>
        </div>

        <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Balance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(balanceSummary.totalBalance, currency.code)}</div>
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
                {formatCurrency(balanceSummary.income, currency.code)}
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
                {formatCurrency(balanceSummary.expenses, currency.code)}
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
                {formatCurrency(balanceSummary.savings, currency.code)}
              </div>
              <p className="text-xs text-muted-foreground">This month</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2 space-y-6">
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
                    <div className="font-medium">{formatCurrency(balanceSummary.income, currency.code)}</div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <div>Spent</div>
                    <div className="font-medium">{formatCurrency(balanceSummary.expenses, currency.code)}</div>
                  </div>
                  <Progress value={balanceSummary.income > 0 ? Math.round((balanceSummary.expenses / balanceSummary.income) * 100) : 0} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <div>{balanceSummary.income > 0 ? Math.round((balanceSummary.expenses / balanceSummary.income) * 100) : 0}% used</div>
                    <div>{balanceSummary.income > 0 ? 100 - Math.round((balanceSummary.expenses / balanceSummary.income) * 100) : 100}% remaining</div>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-medium mb-3">Recent Activity</h4>
                  <div className="text-sm text-muted-foreground">
                    View detailed spending breakdown in the Budget section.
                  </div>
                </div>
              </CardContent>
            </Card>

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
                      <p className="text-xs text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()} · {tx.category}
                      </p>
                    </div>
                    <div className={`font-medium ${parseFloat(tx.amount) > 0 ? 'text-green-600' : 'text-red-500'}`}>
                      {parseFloat(tx.amount) > 0 ? currency.symbol : `-${currency.symbol}`}
                      {Math.abs(parseFloat(tx.amount)).toFixed(2)}
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
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No upcoming bills configured yet.</p>
                      <p className="text-sm">Add recurring expenses in Settings.</p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Account Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-col items-center space-y-2 pb-4 border-b">
                  <div className="w-16 h-16 rounded-full bg-finmate-light-purple flex items-center justify-center text-finmate-purple text-xl font-bold">
                    {profile.name.charAt(0)}
                  </div>
                  <h3 className="font-medium">{profile.name}</h3>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
                
                <div className="space-y-2">
                  {profile.university && (
                    <div className="flex justify-between text-sm">
                      <span>University:</span>
                      <span className="font-medium">{profile.university}</span>
                    </div>
                  )}
                  {profile.student_id && (
                    <div className="flex justify-between text-sm">
                      <span>Student ID:</span>
                      <span className="font-medium">{profile.student_id}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span>Member Since:</span>
                    <span className="font-medium">{new Date(profile.created_at).toLocaleDateString()}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Savings Goals</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {goals.map((goal, index) => (
                  <div key={goal.id} className="space-y-2">
                    <div className="flex justify-between">
                      <h3 className="font-medium">{goal.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        {Math.round((parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100)}%
                      </span>
                    </div>
                    <Progress 
                      value={(parseFloat(goal.current_amount) / parseFloat(goal.target_amount)) * 100} 
                      className="h-2" 
                    />
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>{formatCurrency(parseFloat(goal.current_amount), currency.code)} saved</span>
                      <span>{formatCurrency(parseFloat(goal.target_amount), currency.code)} goal</span>
                    </div>
                  </div>
                ))}
                
                {goals.length === 0 && (
                  <div className="text-center py-4 text-muted-foreground">
                    <p>No savings goals yet.</p>
                    <p className="text-sm">Create your first goal to start saving!</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
