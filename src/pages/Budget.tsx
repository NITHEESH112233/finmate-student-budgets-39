
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
import { useState } from "react";
import { PieChart, AlertCircle, PlusCircle } from "lucide-react";
import { PieChart as RechartsChart, Pie, ResponsiveContainer, Cell, Tooltip, Legend } from "recharts";

const Budget = () => {
  // In a real app, these would come from a backend API
  const [monthlyIncome] = useState(850);
  
  const [budgetCategories, setBudgetCategories] = useState([
    { id: 1, name: "Rent", budget: 250, spent: 250, color: "#9b87f5" },
    { id: 2, name: "Groceries", budget: 200, spent: 180.50, color: "#F2FCE2" },
    { id: 3, name: "Transport", budget: 100, spent: 60, color: "#FEC6A1" },
    { id: 4, name: "Entertainment", budget: 90, spent: 82.95, color: "#FEF7CD" },
    { id: 5, name: "Utilities", budget: 80, spent: 65, color: "#D3E4FD" },
    { id: 6, name: "Eating Out", budget: 60, spent: 45, color: "#FFDEE2" },
    { id: 7, name: "Savings", budget: 70, spent: 70, color: "#E5DEFF" },
  ]);
  
  const [newCategory, setNewCategory] = useState({
    name: "",
    budget: "",
    color: "#9b87f5"
  });
  
  const [editingBudgets, setEditingBudgets] = useState(false);
  const [tempBudgets, setTempBudgets] = useState({});
  
  const totalBudgeted = budgetCategories.reduce((sum, cat) => sum + cat.budget, 0);
  const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);
  const unbudgeted = monthlyIncome - totalBudgeted;
  
  const handleAddCategory = () => {
    if (!newCategory.name || !newCategory.budget) {
      return; // In a real app, show validation error
    }
    
    const category = {
      id: budgetCategories.length + 1,
      name: newCategory.name,
      budget: parseFloat(newCategory.budget),
      spent: 0,
      color: newCategory.color
    };
    
    setBudgetCategories([...budgetCategories, category]);
    setNewCategory({
      name: "",
      budget: "",
      color: "#9b87f5"
    });
  };
  
  const handleBudgetEdit = (id, value) => {
    setTempBudgets({
      ...tempBudgets,
      [id]: parseFloat(value)
    });
  };
  
  const saveNewBudgets = () => {
    const updated = budgetCategories.map(cat => ({
      ...cat,
      budget: tempBudgets[cat.id] !== undefined ? tempBudgets[cat.id] : cat.budget
    }));
    
    setBudgetCategories(updated);
    setEditingBudgets(false);
    setTempBudgets({});
  };
  
  const cancelEditing = () => {
    setEditingBudgets(false);
    setTempBudgets({});
  };
  
  // Prepare data for pie chart
  const pieData = budgetCategories.map(cat => ({
    name: cat.name,
    value: cat.budget,
    color: cat.color
  }));
  
  if (unbudgeted > 0) {
    pieData.push({
      name: "Unbudgeted",
      value: unbudgeted,
      color: "#F1F0FB"
    });
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
          {/* Budget Overview */}
          <div className="col-span-1 lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Budget Overview</CardTitle>
                <CardDescription>
                  Monthly Income: ${monthlyIncome.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div>Total Budgeted</div>
                      <div className="font-medium">${totalBudgeted.toFixed(2)} of ${monthlyIncome.toFixed(2)}</div>
                    </div>
                    <Progress value={(totalBudgeted / monthlyIncome) * 100} className="h-2" />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <div>Total Spent</div>
                      <div className="font-medium">${totalSpent.toFixed(2)} of ${totalBudgeted.toFixed(2)}</div>
                    </div>
                    <Progress value={(totalSpent / totalBudgeted) * 100} className="h-2" />
                  </div>
                  
                  {unbudgeted > 0 && (
                    <div className="bg-finmate-light-purple p-4 rounded-md flex items-center gap-3 text-sm">
                      <AlertCircle className="h-4 w-4 text-finmate-purple" />
                      <div>
                        <p className="font-medium">You have ${unbudgeted.toFixed(2)} of unbudgeted income.</p>
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
                          <span className="font-medium">${category.spent.toFixed(2)}</span>
                          {' '}of{' '}
                          {editingBudgets ? (
                            <Input
                              className="w-20 h-6 inline-block"
                              type="number"
                              step="0.01"
                              min="0"
                              defaultValue={category.budget}
                              onChange={(e) => handleBudgetEdit(category.id, e.target.value)}
                            />
                          ) : (
                            <span className="font-medium">${category.budget.toFixed(2)}</span>
                          )}
                        </div>
                      </div>
                      <Progress 
                        value={(category.spent / category.budget) * 100} 
                        className="h-2"
                      />
                      <div className="flex justify-end text-xs text-muted-foreground">
                        {Math.round((category.spent / category.budget) * 100)}% used
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Budget Chart */}
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
            
            {/* Budget Tips */}
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
