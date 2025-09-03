import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { PlusCircle, Search, Target, Calendar, TrendingUp, Sparkles } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Goals = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterProgress, setFilterProgress] = useState("all");
  const [sortBy, setSortBy] = useState("dueDate");
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    if (user) {
      fetchGoals();
      
      // Set up real-time updates
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'goals'
          },
          () => {
            fetchGoals();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  const fetchGoals = async () => {
    try {
      const { data, error } = await supabase
        .from('goals')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setGoals(data || []);
    } catch (error) {
      console.error('Error fetching goals:', error);
      toast({
        title: "Error",
        description: "Failed to fetch goals",
        variant: "destructive"
      });
    }
  };

  const handleAddGoal = async () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate || !user) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('goals')
        .insert([
          {
            name: newGoal.name,
            current_amount: 0,
            target_amount: parseFloat(newGoal.targetAmount),
            target_date: newGoal.targetDate,
            user_id: user.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Goal added successfully"
      });

      setNewGoal({
        name: "",
        targetAmount: "",
        targetDate: "",
      });
      
      setIsDialogOpen(false);
      fetchGoals();
    } catch (error) {
      console.error('Error adding goal:', error);
      toast({
        title: "Error",
        description: "Failed to add goal",
        variant: "destructive"
      });
    }
  };

  const calculateDaysLeft = (dateStr: string) => {
    const today = new Date();
    const targetDate = new Date(dateStr);
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  };

  const filteredAndSortedGoals = goals
    .filter(goal => {
      const matchesSearch = goal.name.toLowerCase().includes(searchTerm.toLowerCase());
      const progressPercentage = Math.round((parseFloat(goal.current_amount || '0') / parseFloat(goal.target_amount || '1')) * 100);
      
      if (filterProgress === "all") return matchesSearch;
      if (filterProgress === "low") return matchesSearch && progressPercentage < 33;
      if (filterProgress === "medium") return matchesSearch && progressPercentage >= 33 && progressPercentage < 66;
      if (filterProgress === "high") return matchesSearch && progressPercentage >= 66;
      
      return matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === "dueDate") {
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      }
      if (sortBy === "progress") {
        const progressA = (parseFloat(a.current_amount || '0') / parseFloat(a.target_amount || '1')) * 100;
        const progressB = (parseFloat(b.current_amount || '0') / parseFloat(b.target_amount || '1')) * 100;
        return progressB - progressA;
      }
      if (sortBy === "amount") {
        return parseFloat(b.target_amount || '0') - parseFloat(a.target_amount || '0');
      }
      return 0;
    });

  const handleAddFunds = async (goalId: string) => {
    const amount = prompt("Enter amount to add:");
    if (!amount) return;

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) return;

    try {
      const goal = goals.find(g => g.id === goalId);
      if (!goal) return;

      const newAmount = Math.min(goal.current_amount + numAmount, goal.target_amount);
      const wasCompleted = goal.current_amount >= goal.target_amount;
      const isNowCompleted = newAmount >= goal.target_amount;
      
      const { error } = await supabase
        .from('goals')
        .update({ current_amount: newAmount })
        .eq('id', goalId);

      if (error) throw error;

      // Show celebration if goal just completed
      if (!wasCompleted && isNowCompleted) {
        toast({
          title: "🎉 Goal Completed!",
          description: `Congratulations! You've reached your goal for ${goal.name}!`,
        });
      } else {
        toast({
          title: "Success",
          description: `Added $${numAmount.toFixed(2)} to ${goal.name}`
        });
      }

      fetchGoals();
    } catch (error) {
      console.error('Error adding funds:', error);
      toast({
        title: "Error",
        description: "Failed to add funds to goal",
        variant: "destructive"
      });
    }
  };

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Savings Goals</h1>
            <p className="text-muted-foreground">Track progress towards financial targets</p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-finmate-purple hover:bg-finmate-dark-purple">
                <PlusCircle className="mr-2 h-4 w-4" />
                New Goal
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Savings Goal</DialogTitle>
                <DialogDescription>
                  Set a new financial goal to work towards.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label htmlFor="goal-name" className="text-sm font-medium">
                    Goal Name
                  </label>
                  <Input
                    id="goal-name"
                    placeholder="E.g. New Laptop, Vacation"
                    value={newGoal.name}
                    onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="goal-amount" className="text-sm font-medium">
                    Target Amount ($)
                  </label>
                  <Input
                    id="goal-amount"
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newGoal.targetAmount}
                    onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label htmlFor="goal-date" className="text-sm font-medium">
                    Target Date
                  </label>
                  <Input
                    id="goal-date"
                    type="date"
                    value={newGoal.targetDate}
                    onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddGoal}>Save Goal</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="flex gap-4 items-center mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search goals..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
          
          <Select value={filterProgress} onValueChange={setFilterProgress}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by progress" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Progress</SelectItem>
              <SelectItem value="low">Low Progress (0-33%)</SelectItem>
              <SelectItem value="medium">Medium Progress (33-66%)</SelectItem>
              <SelectItem value="high">High Progress (66-100%)</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="dueDate">Due Date</SelectItem>
              <SelectItem value="progress">Progress</SelectItem>
              <SelectItem value="amount">Target Amount</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {filteredAndSortedGoals.map((goal) => {
            const progressPercentage = Math.round((goal.current_amount / goal.target_amount) * 100);
            const daysLeft = calculateDaysLeft(goal.target_date);
            const isCompleted = progressPercentage >= 100;
            const isNearCompletion = progressPercentage >= 90;
            const remaining = goal.target_amount - goal.current_amount;

            return (
              <Card key={goal.id} className={`transition-all duration-500 ${isCompleted ? 'bg-gradient-to-br from-green-50 to-emerald-50 border-green-200 shadow-lg animate-pulse' : 'hover:shadow-md'}`}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle className="flex items-center gap-2">
                      <Target className={`h-4 w-4 ${isCompleted ? 'text-green-600' : 'text-finmate-purple'}`} />
                      {goal.name}
                      {isCompleted && <Sparkles className="h-4 w-4 text-yellow-500 animate-bounce" />}
                    </CardTitle>
                    <div className={`px-2 py-1 text-xs font-medium rounded-full ${
                      isCompleted ? 'bg-green-100 text-green-700' : 
                      isNearCompletion ? 'bg-yellow-100 text-yellow-700' : 
                      'bg-finmate-light-purple text-finmate-purple'
                    }`}>
                      {progressPercentage}% Complete
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-2">
                    <Calendar className="h-3 w-3" />
                    Due by {formatDate(goal.target_date)}
                    {daysLeft < 30 && daysLeft > 0 && (
                      <span className="text-orange-600 text-xs font-medium">⚡ {daysLeft} days left</span>
                    )}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Progress 
                      value={progressPercentage} 
                      className={`h-3 transition-all duration-500 ${isCompleted ? 'animate-pulse' : ''}`}
                    />
                    <div className="text-center">
                      {isCompleted ? (
                        <div className="text-sm font-medium text-green-600 flex items-center justify-center gap-1">
                          🎉 Goal Completed! 🎉
                        </div>
                      ) : (
                        <div className="text-xs text-muted-foreground">
                          ${remaining.toFixed(2)} remaining to reach your goal
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex justify-between text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground flex items-center gap-1">
                        <TrendingUp className="h-3 w-3" />
                        Current
                      </p>
                      <p className="font-medium">${parseFloat(goal.current_amount || 0).toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-medium">${parseFloat(goal.target_amount || 0).toFixed(2)}</p>
                    </div>
                  </div>

                  {/* Visual progress indicators */}
                  <div className="grid grid-cols-4 gap-1">
                    {Array.from({ length: 4 }).map((_, index) => {
                      const quarterProgress = (progressPercentage / 25) - index;
                      const quarterFill = Math.min(Math.max(quarterProgress, 0), 1);
                      return (
                        <div 
                          key={index}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            quarterFill > 0 ? 'bg-finmate-purple' : 'bg-gray-200'
                          }`}
                          style={{ 
                            width: `${quarterFill * 100}%`,
                            minWidth: quarterFill > 0 ? '100%' : '100%',
                            backgroundColor: quarterFill > 0 ? 
                              (isCompleted ? '#10b981' : 
                               isNearCompletion ? '#f59e0b' : 
                               '#9b87f5') : '#e5e7eb'
                          }}
                        />
                      );
                    })}
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <div className={`text-sm ${daysLeft < 7 ? 'text-red-600 font-medium' : 'text-muted-foreground'}`}>
                        {daysLeft <= 0 ? 'Overdue!' : `${daysLeft} days left`}
                      </div>
                      <Button 
                        size="sm" 
                        variant={isCompleted ? "default" : "outline"}
                        onClick={() => handleAddFunds(goal.id)}
                        disabled={isCompleted}
                        className={isCompleted ? "bg-green-600 hover:bg-green-700" : ""}
                      >
                        {isCompleted ? "Completed" : "Add Funds"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {filteredAndSortedGoals.length === 0 && (
          <Card className="p-8 text-center">
            <div className="space-y-2">
              <h3 className="font-medium">No savings goals yet</h3>
              <p className="text-muted-foreground text-sm">
                Create your first goal to start tracking progress towards your financial targets.
              </p>
            </div>
          </Card>
        )}

        <Card className="bg-finmate-light-purple border-none mt-6">
          <CardHeader>
            <CardTitle>Saving Tips for Students</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <p className="font-medium">Start Small</p>
              <p className="text-muted-foreground">Even $5-10 per week can add up over time.</p>
            </div>
            <div>
              <p className="font-medium">Automate Your Savings</p>
              <p className="text-muted-foreground">Set up automatic transfers to your savings account.</p>
            </div>
            <div>
              <p className="font-medium">Use the 24-Hour Rule</p>
              <p className="text-muted-foreground">Wait 24 hours before making non-essential purchases.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
};

export default Goals;
