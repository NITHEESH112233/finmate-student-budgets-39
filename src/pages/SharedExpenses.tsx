import { useState, useEffect } from "react";
import MainLayout from "@/layouts/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/hooks/use-toast";
import { Plus, Users, DollarSign, CheckCircle, Clock, User } from "lucide-react";

interface SharedExpense {
  id: string;
  title: string;
  description: string;
  total_amount: number;
  created_by: string;
  is_settled: boolean;
  category: string;
  created_at: string;
  participants?: ExpenseParticipant[];
}

interface ExpenseParticipant {
  id: string;
  user_id: string;
  amount_owed: number;
  amount_paid: number;
  is_settled: boolean;
}

const categories = [
  "Rent", "Utilities", "Groceries", "Dining", "Travel", 
  "Entertainment", "Shopping", "Bills", "Other"
];

export default function SharedExpenses() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<SharedExpense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newExpense, setNewExpense] = useState({
    title: "",
    description: "",
    total_amount: "",
    category: "Other",
    participants: [{ email: "", amount: "" }]
  });

  useEffect(() => {
    if (user) {
      fetchSharedExpenses();
    }
  }, [user]);

  const fetchSharedExpenses = async () => {
    try {
      const { data: expensesData, error } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          expense_participants (
            id, user_id, amount_owed, amount_paid, is_settled
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setExpenses(expensesData || []);
    } catch (error) {
      console.error('Error fetching shared expenses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch shared expenses",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async () => {
    if (!user || !newExpense.title || !newExpense.total_amount) return;

    try {
      const { data: expenseData, error: expenseError } = await supabase
        .from('shared_expenses')
        .insert({
          title: newExpense.title,
          description: newExpense.description,
          total_amount: parseFloat(newExpense.total_amount),
          created_by: user.id,
          category: newExpense.category
        })
        .select()
        .single();

      if (expenseError) throw expenseError;

      // Add participants
      const participantsData = newExpense.participants
        .filter(p => p.email && p.amount)
        .map(p => ({
          expense_id: expenseData.id,
          user_id: user.id, // In a real app, you'd resolve emails to user IDs
          amount_owed: parseFloat(p.amount)
        }));

      if (participantsData.length > 0) {
        const { error: participantsError } = await supabase
          .from('expense_participants')
          .insert(participantsData);

        if (participantsError) throw participantsError;
      }

      toast({
        title: "Success",
        description: "Shared expense created successfully",
      });

      setNewExpense({
        title: "",
        description: "",
        total_amount: "",
        category: "Other",
        participants: [{ email: "", amount: "" }]
      });
      setIsDialogOpen(false);
      fetchSharedExpenses();
    } catch (error) {
      console.error('Error creating expense:', error);
      toast({
        title: "Error",
        description: "Failed to create shared expense",
        variant: "destructive",
      });
    }
  };

  const handleSettleExpense = async (expenseId: string) => {
    try {
      const { error } = await supabase
        .from('shared_expenses')
        .update({ is_settled: true })
        .eq('id', expenseId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Expense marked as settled",
      });
      fetchSharedExpenses();
    } catch (error) {
      console.error('Error settling expense:', error);
      toast({
        title: "Error",
        description: "Failed to settle expense",
        variant: "destructive",
      });
    }
  };

  const addParticipant = () => {
    setNewExpense({
      ...newExpense,
      participants: [...newExpense.participants, { email: "", amount: "" }]
    });
  };

  const updateParticipant = (index: number, field: string, value: string) => {
    const updated = [...newExpense.participants];
    updated[index] = { ...updated[index], [field]: value };
    setNewExpense({ ...newExpense, participants: updated });
  };

  const removeParticipant = (index: number) => {
    setNewExpense({
      ...newExpense,
      participants: newExpense.participants.filter((_, i) => i !== index)
    });
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
            <h1 className="text-3xl font-bold tracking-tight">Shared Expenses</h1>
            <p className="text-muted-foreground">
              Split bills and track shared expenses with friends and roommates
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Expense
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Shared Expense</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      value={newExpense.title}
                      onChange={(e) => setNewExpense({ ...newExpense, title: e.target.value })}
                      placeholder="e.g., Dinner at Restaurant"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Total Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newExpense.total_amount}
                      onChange={(e) => setNewExpense({ ...newExpense, total_amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newExpense.description}
                    onChange={(e) => setNewExpense({ ...newExpense, description: e.target.value })}
                    placeholder="Optional description"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select value={newExpense.category} onValueChange={(value) => setNewExpense({ ...newExpense, category: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((category) => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Participants</Label>
                  {newExpense.participants.map((participant, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        placeholder="Email"
                        value={participant.email}
                        onChange={(e) => updateParticipant(index, 'email', e.target.value)}
                      />
                      <Input
                        type="number"
                        placeholder="Amount owed"
                        value={participant.amount}
                        onChange={(e) => updateParticipant(index, 'amount', e.target.value)}
                      />
                      {newExpense.participants.length > 1 && (
                        <Button variant="outline" size="sm" onClick={() => removeParticipant(index)}>
                          Remove
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button variant="outline" size="sm" onClick={addParticipant}>
                    Add Participant
                  </Button>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddExpense}>
                    Create Expense
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        <div className="grid gap-4">
          {expenses.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No shared expenses yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Create your first shared expense to start splitting bills with friends and roommates.
                </p>
              </CardContent>
            </Card>
          ) : (
            expenses.map((expense) => (
              <Card key={expense.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-xl">{expense.title}</CardTitle>
                      <CardDescription>{expense.description}</CardDescription>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold">
                        {formatCurrency(expense.total_amount, currency.symbol)}
                      </div>
                      <Badge variant={expense.is_settled ? "default" : "secondary"}>
                        {expense.is_settled ? "Settled" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <DollarSign className="h-4 w-4" />
                        <span>Category: {expense.category}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <User className="h-4 w-4" />
                        <span>{expense.participants?.length || 0} participants</span>
                      </div>
                    </div>
                    {!expense.is_settled && expense.created_by === user?.id && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSettleExpense(expense.id)}
                        className="gap-2"
                      >
                        <CheckCircle className="h-4 w-4" />
                        Mark as Settled
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </MainLayout>
  );
}