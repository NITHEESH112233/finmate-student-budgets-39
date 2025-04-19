
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { useState } from "react";
import { PlusCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const Goals = () => {
  // In a real app, these would come from an API
  const [goals, setGoals] = useState([
    {
      id: 1,
      name: "New Laptop",
      currentAmount: 650,
      targetAmount: 1000,
      targetDate: "2025-09-01",
    },
    {
      id: 2,
      name: "Summer Trip",
      currentAmount: 300,
      targetAmount: 1000,
      targetDate: "2025-07-15",
    },
    {
      id: 3,
      name: "Emergency Fund",
      currentAmount: 450,
      targetAmount: 1500,
      targetDate: "2025-12-31",
    },
  ]);

  const [newGoal, setNewGoal] = useState({
    name: "",
    targetAmount: "",
    targetDate: "",
  });

  const handleAddGoal = () => {
    if (!newGoal.name || !newGoal.targetAmount || !newGoal.targetDate) {
      return; // In a real app, show validation error
    }

    const goal = {
      id: goals.length + 1,
      name: newGoal.name,
      currentAmount: 0,
      targetAmount: parseFloat(newGoal.targetAmount),
      targetDate: newGoal.targetDate,
    };

    setGoals([...goals, goal]);
    setNewGoal({
      name: "",
      targetAmount: "",
      targetDate: "",
    });
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Savings Goals</h1>
            <p className="text-muted-foreground">Track progress towards financial targets</p>
          </div>

          <Dialog>
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

        <div className="grid gap-6 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
          {goals.map((goal) => {
            const progressPercentage = Math.round((goal.currentAmount / goal.targetAmount) * 100);
            const daysLeft = calculateDaysLeft(goal.targetDate);

            return (
              <Card key={goal.id}>
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <CardTitle>{goal.name}</CardTitle>
                    <div className="px-2 py-1 bg-finmate-light-purple text-finmate-purple text-xs font-medium rounded-full">
                      {progressPercentage}% Complete
                    </div>
                  </div>
                  <CardDescription>
                    Due by {formatDate(goal.targetDate)}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Progress value={progressPercentage} className="h-2" />

                  <div className="flex justify-between text-sm">
                    <div className="space-y-1">
                      <p className="text-muted-foreground">Current</p>
                      <p className="font-medium">${goal.currentAmount.toFixed(2)}</p>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-muted-foreground">Target</p>
                      <p className="font-medium">${goal.targetAmount.toFixed(2)}</p>
                    </div>
                  </div>

                  <div className="pt-2 border-t">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        {daysLeft} days left
                      </div>
                      <Button size="sm" variant="outline">
                        Add Funds
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {goals.length === 0 && (
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
