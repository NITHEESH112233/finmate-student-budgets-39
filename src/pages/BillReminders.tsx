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
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, Bell, Calendar, CreditCard, CheckCircle2, AlertTriangle, 
  Clock, Settings, Repeat 
} from "lucide-react";
import { format, addDays, parseISO, isBefore, isToday } from "date-fns";

interface BillReminder {
  id: string;
  title: string;
  description: string;
  amount: number;
  due_date: string;
  frequency: 'one-time' | 'weekly' | 'monthly' | 'yearly';
  category: string;
  is_paid: boolean;
  auto_pay: boolean;
  reminder_days: number;
  next_due_date: string;
  created_at: string;
}

const categories = [
  "Rent", "Utilities", "Insurance", "Subscriptions", "Loans", 
  "Credit Cards", "Phone", "Internet", "Groceries", "Other"
];

const frequencies = [
  { value: "one-time", label: "One-time" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
  { value: "yearly", label: "Yearly" }
];

export default function BillReminders() {
  const { user } = useAuth();
  const { currency } = useCurrency();
  const { toast } = useToast();
  const [bills, setBills] = useState<BillReminder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newBill, setNewBill] = useState({
    title: "",
    description: "",
    amount: "",
    due_date: "",
    frequency: "monthly" as const,
    category: "Other",
    auto_pay: false,
    reminder_days: 3
  });

  useEffect(() => {
    if (user) {
      fetchBillReminders();
    }
  }, [user]);

  const fetchBillReminders = async () => {
    try {
      const { data, error } = await supabase
        .from('bill_reminders')
        .select('*')
        .order('next_due_date', { ascending: true });

      if (error) throw error;
      setBills(data as BillReminder[] || []);
    } catch (error) {
      console.error('Error fetching bill reminders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch bill reminders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddBill = async () => {
    if (!user || !newBill.title || !newBill.amount || !newBill.due_date) return;

    try {
      const { error } = await supabase
        .from('bill_reminders')
        .insert({
          title: newBill.title,
          description: newBill.description,
          amount: parseFloat(newBill.amount),
          due_date: newBill.due_date,
          frequency: newBill.frequency,
          category: newBill.category,
          auto_pay: newBill.auto_pay,
          reminder_days: newBill.reminder_days,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Bill reminder created successfully",
      });

      setNewBill({
        title: "",
        description: "",
        amount: "",
        due_date: "",
        frequency: "monthly",
        category: "Other",
        auto_pay: false,
        reminder_days: 3
      });
      setIsDialogOpen(false);
      fetchBillReminders();
    } catch (error) {
      console.error('Error creating bill reminder:', error);
      toast({
        title: "Error",
        description: "Failed to create bill reminder",
        variant: "destructive",
      });
    }
  };

  const handleMarkAsPaid = async (billId: string, bill: BillReminder) => {
    try {
      const { error } = await supabase
        .from('bill_reminders')
        .update({ is_paid: true })
        .eq('id', billId);

      if (error) throw error;

      // Also create a transaction for this payment
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          description: `Bill Payment: ${bill.title}`,
          amount: bill.amount,
          category: bill.category,
          type: 'expense',
          date: new Date().toISOString().split('T')[0],
          user_id: user?.id
        });

      if (transactionError) console.error('Error creating transaction:', transactionError);

      toast({
        title: "Success",
        description: "Bill marked as paid and transaction recorded",
      });
      fetchBillReminders();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      toast({
        title: "Error",
        description: "Failed to mark bill as paid",
        variant: "destructive",
      });
    }
  };

  const getBillStatus = (bill: BillReminder) => {
    if (bill.is_paid) return 'paid';
    
    const dueDate = parseISO(bill.next_due_date || bill.due_date);
    const reminderDate = addDays(dueDate, -bill.reminder_days);
    const today = new Date();
    
    if (isBefore(dueDate, today)) return 'overdue';
    if (isToday(dueDate)) return 'due-today';
    if (isBefore(reminderDate, today)) return 'reminder';
    return 'upcoming';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return <Badge className="bg-green-100 text-green-800">Paid</Badge>;
      case 'overdue':
        return <Badge variant="destructive">Overdue</Badge>;
      case 'due-today':
        return <Badge className="bg-orange-100 text-orange-800">Due Today</Badge>;
      case 'reminder':
        return <Badge className="bg-yellow-100 text-yellow-800">Reminder</Badge>;
      default:
        return <Badge variant="secondary">Upcoming</Badge>;
    }
  };

  const getUpcomingBills = () => {
    const today = new Date();
    const upcomingDate = addDays(today, 7);
    
    return bills.filter(bill => {
      const dueDate = parseISO(bill.next_due_date || bill.due_date);
      return !bill.is_paid && dueDate <= upcomingDate;
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

  const upcomingBills = getUpcomingBills();
  const totalUpcoming = upcomingBills.reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Bill Reminders</h1>
            <p className="text-muted-foreground">
              Track and manage your recurring bills and subscriptions
            </p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                Add Bill
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Add Bill Reminder</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Bill Name *</Label>
                    <Input
                      id="title"
                      value={newBill.title}
                      onChange={(e) => setNewBill({ ...newBill, title: e.target.value })}
                      placeholder="e.g., Electric Bill"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="amount">Amount *</Label>
                    <Input
                      id="amount"
                      type="number"
                      value={newBill.amount}
                      onChange={(e) => setNewBill({ ...newBill, amount: e.target.value })}
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="due_date">Due Date *</Label>
                    <Input
                      id="due_date"
                      type="date"
                      value={newBill.due_date}
                      onChange={(e) => setNewBill({ ...newBill, due_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="frequency">Frequency</Label>
                    <Select value={newBill.frequency} onValueChange={(value: any) => setNewBill({ ...newBill, frequency: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {frequencies.map((freq) => (
                          <SelectItem key={freq.value} value={freq.value}>{freq.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="category">Category</Label>
                    <Select value={newBill.category} onValueChange={(value) => setNewBill({ ...newBill, category: value })}>
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
                    <Label htmlFor="reminder_days">Remind Me (days before)</Label>
                    <Input
                      id="reminder_days"
                      type="number"
                      min="1"
                      max="30"
                      value={newBill.reminder_days}
                      onChange={(e) => setNewBill({ ...newBill, reminder_days: parseInt(e.target.value) || 3 })}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={newBill.description}
                    onChange={(e) => setNewBill({ ...newBill, description: e.target.value })}
                    placeholder="Optional notes about this bill"
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="auto_pay"
                    checked={newBill.auto_pay}
                    onCheckedChange={(checked) => setNewBill({ ...newBill, auto_pay: checked })}
                  />
                  <Label htmlFor="auto_pay">Auto-pay enabled</Label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddBill}>
                    Add Bill Reminder
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Alert Summary */}
        {upcomingBills.length > 0 && (
          <Card className="border-yellow-200 bg-yellow-50">
            <CardHeader>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-600" />
                <CardTitle className="text-yellow-800">Upcoming Bills Alert</CardTitle>
              </div>
              <CardDescription className="text-yellow-700">
                You have {upcomingBills.length} bills due in the next 7 days totaling {formatCurrency(totalUpcoming, currency.symbol)}
              </CardDescription>
            </CardHeader>
          </Card>
        )}

        {/* Bills List */}
        <div className="grid gap-4">
          {bills.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No bill reminders yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first bill reminder to start tracking your recurring payments.
                </p>
              </CardContent>
            </Card>
          ) : (
            bills.map((bill) => {
              const status = getBillStatus(bill);
              return (
                <Card key={bill.id} className={`hover:shadow-md transition-shadow ${
                  status === 'overdue' ? 'border-red-200 bg-red-50' :
                  status === 'due-today' ? 'border-orange-200 bg-orange-50' :
                  status === 'reminder' ? 'border-yellow-200 bg-yellow-50' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          {bill.title}
                          {bill.auto_pay && <Settings className="h-4 w-4 text-muted-foreground" />}
                        </CardTitle>
                        <CardDescription>{bill.description}</CardDescription>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold">
                          {formatCurrency(bill.amount, currency.symbol)}
                        </div>
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          <span>Due: {format(parseISO(bill.next_due_date || bill.due_date), 'MMM dd, yyyy')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Repeat className="h-4 w-4" />
                          <span className="capitalize">{bill.frequency}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>{bill.category}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4" />
                          <span>Remind {bill.reminder_days} days before</span>
                        </div>
                      </div>
                      {!bill.is_paid && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleMarkAsPaid(bill.id, bill)}
                          className="gap-2"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Mark as Paid
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </MainLayout>
  );
}