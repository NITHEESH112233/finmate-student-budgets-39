import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Slider } from "@/components/ui/slider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PieChart, AlertCircle, PlusCircle } from "lucide-react";
import { PieChart as RechartsChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

const Budget = () => {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const [monthlyIncome, setMonthlyIncome] = useState(850);
  const [budgetCategories, setBudgetCategories] = useState([]);
  
  const [newCategory, setNewCategory] = useState({
    name: "",
    budget: "",
    color: "#9b87f5"
  });
  
  const [editingBudgets, setEditingBudgets] = useState(false);
  const [tempBudgets, setTempBudgets] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!isLoading && !user) {
      navigate("/auth");
      return;
    }
    
    if (user) {
      fetchBudgetCategories();
      calculateMonthlyIncome();
      
      // Set up real-time transaction updates to recalculate spent amounts
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'transactions'
          },
          () => {
            fetchBudgetCategories(); // Refresh budget categories when transactions change
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, isLoading, navigate]);

  const fetchBudgetCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        toast.error('Failed to fetch budget categories');
        return;
      }

      // Calculate actual spent amounts from transactions for each category
      const categoriesWithSpent = await Promise.all(
        (data || []).map(async (category) => {
          const { data: transactions, error: txError } = await supabase
            .from('transactions')
            .select('amount')
            .eq('category', category.name)
            .eq('type', 'expense');
          
          if (txError) {
            console.error('Error fetching transactions for category:', txError);
            return category;
          }
          
          const actualSpent = (transactions || []).reduce((sum, tx) => sum + parseFloat(tx.amount.toString()), 0);
          
          // Update the database with the calculated spent amount
          await supabase
            .from('budget_categories')
            .update({ spent: actualSpent })
            .eq('id', category.id);
          
          return { ...category, spent: actualSpent };
        })
      );

      setBudgetCategories(categoriesWithSpent);
    } catch (error) {
      toast.error('Failed to fetch budget categories');
    }
  };

  const calculateMonthlyIncome = async () => {
    try {
      const { data, error } = await supabase
        .from('incomes')
        .select('*');

      if (error) return;

      const total = (data || []).reduce((sum, income) => {
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

      setMonthlyIncome(total);
    } catch (error) {
      console.error('Failed to calculate monthly income');
    }
  };
  
  
  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + parseFloat(cat.budget || 0), 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + parseFloat(cat.spent || 0), 0);
  const unbudgeted = monthlyIncome - totalBudgeted;
  
  const handleAddCategory = async () => {
    if (!newCategory.name || !newCategory.budget || !user) {
      toast.error("Please fill in all required fields");
      return;
    }
    
    try {
      const { data, error } = await supabase
        .from('budget_categories')
        .insert({
          user_id: user.id,
          name: newCategory.name,
          budget: parseFloat(newCategory.budget),
          color: newCategory.color
        })
        .select()
        .single();

      if (error) {
        toast.error("Failed to add category");
        return;
      }

      setBudgetCategories([...budgetCategories, data]);
      setNewCategory({
        name: "",
        budget: "",
        color: "#9b87f5"
      });
      toast.success("Category added successfully!");
    } catch (error) {
      toast.error("Failed to add category");
    }
  };
  
  const handleBudgetEdit = (id: string, value: string) => {
    setTempBudgets({
      ...tempBudgets,
      [id]: parseFloat(value)
    });
  };
  
  const saveNewBudgets = async () => {
    try {
      const updates = Object.entries(tempBudgets).map(([id, budget]) => ({
        id,
        budget: budget
      }));

      for (const update of updates) {
        await supabase
          .from('budget_categories')
          .update({ budget: parseFloat(update.budget.toString()) })
          .eq('id', update.id);
      }

      await fetchBudgetCategories();
      setEditingBudgets(false);
      setTempBudgets({});
      toast.success("Budgets updated successfully!");
    } catch (error) {
      toast.error("Failed to update budgets");
    }
  };
  
  const cancelEditing = () => {
    setEditingBudgets(false);
    setTempBudgets({});
  };
  
  const pieData = budgetCategories.map(cat => ({
    name: cat.name,
    value: parseFloat(cat.budget || 0),
    color: cat.color
  }));

  if (unbudgeted > 0) {
    pieData.push({
      name: "Unbudgeted",
      value: unbudgeted,
      color: "#F1F0FB"
    });
  }

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

  if (!user) {
    return null;
  }
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Budget Planner</h1>
            <p className="text-muted-foreground">Plan and track your monthly spending</p>
          </div>
          
          <div className="flex gap-2">
            {editingBudgets ? (
              <>
                <Button variant="outline" onClick={cancelEditing}>Cancel</Button>
                <Button onClick={saveNewBudgets}>Save Changes</Button>
              </>
            ) : (
              <>
                <Button variant="outline" onClick={() => setEditingBudgets(true)}>Edit Budgets</Button>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="bg-finmate-purple hover:bg-finmate-dark-purple">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      New Category
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Budget Category</DialogTitle>
                      <DialogDescription>
                        Create a new category for your budget.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="category-name">
                          Category Name
                        </Label>
                        <Input
                          id="category-name"
                          placeholder="E.g. Rent, Groceries"
                          value={newCategory.name}
                          onChange={(e) => setNewCategory({...newCategory, name: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="category-budget">
                          Monthly Budget Amount
                        </Label>
                        <Input
                          id="category-budget"
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={newCategory.budget}
                          onChange={(e) => setNewCategory({...newCategory, budget: e.target.value})}
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" onClick={handleAddCategory}>Add Category</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </>
            )}
          </div>
        </div>
        
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-3">
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>
                  Monthly Income: ₹{monthlyIncome.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div>Total Budgeted</div>
                      <div className="font-medium">₹{totalBudgeted.toFixed(2)} of ₹{monthlyIncome.toFixed(2)}</div>
                    </div>
                    <Progress value={(totalBudgeted / monthlyIncome) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div>Total Spent</div>
                      <div className="font-medium">₹{totalSpent.toFixed(2)} of ₹{totalBudgeted.toFixed(2)}</div>
                    </div>
                    <Progress value={(totalSpent / totalBudgeted) * 100} className="h-2" />
                  </div>
                  
                  {unbudgeted > 0 && (
                    <div className="bg-finmate-light-purple p-4 rounded-md flex items-center gap-3 text-sm">
                      <AlertCircle className="h-4 w-4 text-finmate-purple" />
                      <div>
                        <p className="font-medium">You have ₹{unbudgeted.toFixed(2)} of unbudgeted income.</p>
                        <p className="text-muted-foreground">Consider allocating these funds to savings or other categories.</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle>Budget Categories</CardTitle>
                <CardDescription>
                  Track spending for each category
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {budgetCategories.map((category) => (
                    <div key={category.id} className="space-y-2">
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: category.color }}
                          />
                          <span className="font-medium">{category.name}</span>
                        </div>
                        <div className="text-sm">
                          <span className="font-medium">₹{parseFloat(category.spent || 0).toFixed(2)}</span>
                          {' '}of{' '}
                          {editingBudgets ? (
                            <Input
                              className="w-20 h-6 inline-block"
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={parseFloat(category.budget || 0)}
                              onChange={(e) => handleBudgetEdit(category.id, e.target.value)}
                            />
                          ) : (
                            <span className="font-medium">₹{parseFloat(category.budget || 0).toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={((parseFloat(category.spent || 0)) / (parseFloat(category.budget || 1))) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-end text-xs text-muted-foreground">
                        {Math.round(((parseFloat(category.spent || 0)) / (parseFloat(category.budget || 1))) * 100)}% used
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="h-[400px]">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="h-4 w-4 mr-2" />
                  Budget Allocation
                </CardTitle>
                <CardDescription>
                  How your money is distributed
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={250}>
                  <RechartsChart>
                    <Pie
                      data={pieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `$${value}`} />
                    <Legend />
                  </RechartsChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Budgeting Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <p className="font-medium">Follow the 50/30/20 Rule</p>
                  <p className="text-muted-foreground">50% for needs, 30% for wants, and 20% for savings.</p>
                </div>
                <div>
                  <p className="font-medium">Track Every Expense</p>
                  <p className="text-muted-foreground">Keep a record of even small purchases to stay accountable.</p>
                </div>
                <div>
                  <p className="font-medium">Review Regularly</p>
                  <p className="text-muted-foreground">Adjust your budget monthly based on changing needs.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default Budget;
