import MainLayout from "@/layouts/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useState, useEffect } from "react";
import { CreditCard, PlusCircle, Search, Wallet, ArrowUp, ArrowDown } from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { formatCurrency } from "@/utils/formatCurrency";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  
  const [newTransaction, setNewTransaction] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    category: "",
    type: "expense"
  });
  
  const [searchTerm, setSearchTerm] = useState("");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  
  const categories = [
    "Food", "Transport", "Entertainment", "Groceries", "Bills", "Education", 
    "Shopping", "Health", "Income", "Other"
  ];
  
  const { currency } = useCurrency();

  // Fetch transactions from Supabase
  useEffect(() => {
    fetchTransactions();
    
    // Set up real-time updates
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
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTransactions = async () => {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
      toast({
        title: "Error",
        description: "Failed to fetch transactions",
        variant: "destructive"
      });
    }
  };
  
  const filteredTransactions = transactions.filter(tx => 
    tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tx.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const handleAddTransaction = async () => {
    if (!newTransaction.description || !newTransaction.amount || !newTransaction.category) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    try {
      const amount = parseFloat(newTransaction.amount);
      
      const { error } = await supabase
        .from('transactions')
        .insert([
          {
            description: newTransaction.description,
            amount: amount,
            date: newTransaction.date,
            category: newTransaction.category,
            type: newTransaction.type,
            user_id: (await supabase.auth.getUser()).data.user?.id
          }
        ]);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Transaction added successfully"
      });

      setNewTransaction({
        description: "",
        amount: "",
        date: new Date().toISOString().split('T')[0],
        category: "",
        type: "expense"
      });
      
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Error adding transaction:', error);
      toast({
        title: "Error",
        description: "Failed to add transaction",
        variant: "destructive"
      });
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(date);
  };
  
  return (
    <MainLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">Transactions</h1>
            <p className="text-muted-foreground">Manage your income and expenses</p>
          </div>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-finmate-purple hover:bg-finmate-dark-purple">
                <PlusCircle className="mr-2 h-4 w-4" />
                Add Transaction
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Transaction</DialogTitle>
                <DialogDescription>
                  Enter the details of your transaction.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="flex gap-4">
                  <div className="flex-1">
                    <Label htmlFor="transaction-type" className="text-right">
                      Type
                    </Label>
                    <Select 
                      value={newTransaction.type}
                      onValueChange={(value) => setNewTransaction({...newTransaction, type: value})}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="expense">Expense</SelectItem>
                        <SelectItem value="income">Income</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1">
                    <Label htmlFor="transaction-amount" className="text-right">
                      Amount
                    </Label>
                    <Input
                      id="transaction-amount"
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={newTransaction.amount}
                      onChange={(e) => setNewTransaction({...newTransaction, amount: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-description">
                    Description
                  </Label>
                  <Input
                    id="transaction-description"
                    placeholder="E.g. Grocery shopping, Rent payment"
                    value={newTransaction.description}
                    onChange={(e) => setNewTransaction({...newTransaction, description: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-category">
                    Category
                  </Label>
                  <Select 
                    value={newTransaction.category}
                    onValueChange={(value) => setNewTransaction({...newTransaction, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="transaction-date">
                    Date
                  </Label>
                  <Input
                    id="transaction-date"
                    type="date"
                    value={newTransaction.date}
                    onChange={(e) => setNewTransaction({...newTransaction, date: e.target.value})}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" onClick={handleAddTransaction}>Save Transaction</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        
        <div className="rounded-md border">
          <div className="p-4 flex items-center gap-2">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search transactions..."
              className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <div className="ml-auto flex gap-2">
              <Tabs defaultValue="all" className="w-[300px]">
                <TabsList>
                  <TabsTrigger value="all">All</TabsTrigger>
                  <TabsTrigger value="income">Income</TabsTrigger>
                  <TabsTrigger value="expenses">Expenses</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </div>
          
          <div className="border-t">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-xs font-medium text-left p-4">Transaction</th>
                  <th className="text-xs font-medium text-left p-4">Category</th>
                  <th className="text-xs font-medium text-left p-4">Date</th>
                  <th className="text-xs font-medium text-right p-4">Amount</th>
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="p-4">
                      <div className="font-medium">{tx.description}</div>
                    </td>
                    <td className="p-4">
                      <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold">
                        {tx.category}
                      </div>
                    </td>
                    <td className="p-4 text-sm">
                      {formatDate(tx.date)}
                    </td>
                    <td className="p-4 text-right">
                      <div className={`font-medium flex items-center justify-end
                        ${tx.type === 'income' ? 'text-green-600' : 'text-red-500'}`}
                      >
                        {tx.type === 'income' ? (
                          <ArrowUp className="h-4 w-4 mr-1" />
                        ) : (
                          <ArrowDown className="h-4 w-4 mr-1" />
                        )}
                        {formatCurrency(Math.abs(tx.amount), currency.code)}
                      </div>
                    </td>
                  </tr>
                ))}
                
                {filteredTransactions.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-muted-foreground">
                      No transactions found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <Wallet className="h-4 w-4 mr-1 text-finmate-purple" /> Income Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(transactions.filter(tx => tx.type === 'income').reduce((sum, tx) => sum + parseFloat(tx.amount), 0), currency.code)}
              </div>
              <p className="text-xs text-muted-foreground">Total Income</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium flex items-center">
                <CreditCard className="h-4 w-4 mr-1 text-finmate-purple" /> Expense Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-500">
                {formatCurrency(transactions.filter(tx => tx.type === 'expense').reduce((sum, tx) => sum + parseFloat(tx.amount), 0), currency.code)}
              </div>
              <p className="text-xs text-muted-foreground">Total Expenses</p>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
};

export default Transactions;
