
import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowUp, Plus } from "lucide-react";

const Income = () => {
  const [incomes, setIncomes] = useState([
    { id: 1, source: "Part-time Job", amount: 800, frequency: "Monthly", date: "2025-04-01" },
    { id: 2, source: "Freelancing", amount: 500, frequency: "Monthly", date: "2025-04-15" },
    { id: 3, source: "Tutoring", amount: 200, frequency: "Weekly", date: "2025-04-10" },
  ]);

  const [newIncome, setNewIncome] = useState({
    source: "",
    amount: "",
    frequency: "Monthly",
    date: new Date().toISOString().split('T')[0]
  });

  const handleAddIncome = () => {
    if (!newIncome.source || !newIncome.amount) {
      toast.error("Please fill in all required fields");
      return;
    }

    const income = {
      id: incomes.length + 1,
      source: newIncome.source,
      amount: parseFloat(newIncome.amount),
      frequency: newIncome.frequency,
      date: newIncome.date
    };

    setIncomes([income, ...incomes]);
    setNewIncome({
      source: "",
      amount: "",
      frequency: "Monthly",
      date: new Date().toISOString().split('T')[0]
    });
    toast.success("Income added successfully!");
  };

  const totalMonthlyIncome = incomes.reduce((sum, income) => {
    const amount = income.amount;
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

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Income Management</h1>
            <p className="text-muted-foreground">Track and manage your income sources</p>
          </div>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-finmate-purple hover:bg-finmate-dark-purple">
                <Plus className="mr-2 h-4 w-4" />
                Add Income
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Income</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Income Source</Label>
                  <Input
                    placeholder="E.g. Part-time Job, Freelancing"
                    value={newIncome.source}
                    onChange={(e) => setNewIncome({...newIncome, source: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Amount</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={newIncome.amount}
                    onChange={(e) => setNewIncome({...newIncome, amount: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Frequency</Label>
                  <Select 
                    value={newIncome.frequency}
                    onValueChange={(value) => setNewIncome({...newIncome, frequency: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Weekly">Weekly</SelectItem>
                      <SelectItem value="Bi-weekly">Bi-weekly</SelectItem>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                      <SelectItem value="Annually">Annually</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={newIncome.date}
                    onChange={(e) => setNewIncome({...newIncome, date: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button onClick={handleAddIncome}>Add Income</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4 grid-cols-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <ArrowUp className="mr-2 h-4 w-4 text-green-500" />
                Total Monthly Income
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                ${totalMonthlyIncome.toFixed(2)}
              </div>
              <p className="text-sm text-muted-foreground">
                Combined from all sources
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Income Sources</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incomes.map((income) => (
                  <div
                    key={income.id}
                    className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50"
                  >
                    <div>
                      <h3 className="font-medium">{income.source}</h3>
                      <p className="text-sm text-muted-foreground">
                        {income.frequency} • {new Date(income.date).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium text-green-600">
                        +${income.amount.toFixed(2)}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {income.frequency}
                      </p>
                    </div>
                  </div>
                ))}

                {incomes.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    No income sources added yet.
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Income;
