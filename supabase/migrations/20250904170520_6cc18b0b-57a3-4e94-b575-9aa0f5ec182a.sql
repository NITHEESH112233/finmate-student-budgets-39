-- Create shared expenses tables first
CREATE TABLE public.shared_expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  total_amount NUMERIC NOT NULL,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_settled BOOLEAN NOT NULL DEFAULT false,
  category TEXT NOT NULL DEFAULT 'General'
);

-- Create expense participants table
CREATE TABLE public.expense_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  amount_owed NUMERIC NOT NULL,
  amount_paid NUMERIC NOT NULL DEFAULT 0,
  is_settled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(expense_id, user_id)
);

-- Create settlements table
CREATE TABLE public.settlements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.shared_expenses(id) ON DELETE CASCADE,
  from_user_id UUID NOT NULL,
  to_user_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  settled_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create bill reminders table
CREATE TABLE public.bill_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  amount NUMERIC NOT NULL,
  due_date DATE NOT NULL,
  frequency TEXT NOT NULL CHECK (frequency IN ('one-time', 'weekly', 'monthly', 'yearly')),
  category TEXT NOT NULL DEFAULT 'Bills',
  is_paid BOOLEAN NOT NULL DEFAULT false,
  auto_pay BOOLEAN NOT NULL DEFAULT false,
  reminder_days INTEGER NOT NULL DEFAULT 3,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  next_due_date DATE
);

-- Create notification preferences table
CREATE TABLE public.notification_preferences (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  email_notifications BOOLEAN NOT NULL DEFAULT true,
  push_notifications BOOLEAN NOT NULL DEFAULT true,
  in_app_notifications BOOLEAN NOT NULL DEFAULT true,
  bill_reminders BOOLEAN NOT NULL DEFAULT true,
  budget_alerts BOOLEAN NOT NULL DEFAULT true,
  goal_updates BOOLEAN NOT NULL DEFAULT true,
  expense_updates BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for all tables
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settlements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bill_reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

-- Create policies for shared_expenses
CREATE POLICY "Users can view shared expenses they participate in" 
ON public.shared_expenses 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.expense_participants 
    WHERE expense_id = shared_expenses.id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can create shared expenses" 
ON public.shared_expenses 
FOR INSERT 
WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Expense creators can update their expenses" 
ON public.shared_expenses 
FOR UPDATE 
USING (auth.uid() = created_by);

-- Create policies for expense_participants
CREATE POLICY "Users can view their own participation" 
ON public.expense_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR 
  EXISTS (
    SELECT 1 FROM public.shared_expenses 
    WHERE id = expense_participants.expense_id AND created_by = auth.uid()
  )
);

CREATE POLICY "Expense creators can manage participants" 
ON public.expense_participants 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.shared_expenses 
    WHERE id = expense_participants.expense_id AND created_by = auth.uid()
  )
);

-- Create policies for settlements
CREATE POLICY "Users can view their settlements" 
ON public.settlements 
FOR SELECT 
USING (from_user_id = auth.uid() OR to_user_id = auth.uid());

CREATE POLICY "Users can create settlements for their debts" 
ON public.settlements 
FOR INSERT 
WITH CHECK (from_user_id = auth.uid());

-- Create policies for bill_reminders
CREATE POLICY "Users can manage their own bill reminders" 
ON public.bill_reminders 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create policies for notification_preferences
CREATE POLICY "Users can manage their own notification preferences" 
ON public.notification_preferences 
FOR ALL 
USING (auth.uid() = user_id) 
WITH CHECK (auth.uid() = user_id);

-- Create triggers for updated_at
CREATE TRIGGER update_shared_expenses_updated_at
BEFORE UPDATE ON public.shared_expenses
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_expense_participants_updated_at
BEFORE UPDATE ON public.expense_participants
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bill_reminders_updated_at
BEFORE UPDATE ON public.bill_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_notification_preferences_updated_at
BEFORE UPDATE ON public.notification_preferences
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to update next due date for recurring bills
CREATE OR REPLACE FUNCTION public.update_next_due_date()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.frequency = 'weekly' THEN
    NEW.next_due_date = NEW.due_date + INTERVAL '7 days';
  ELSIF NEW.frequency = 'monthly' THEN
    NEW.next_due_date = NEW.due_date + INTERVAL '1 month';
  ELSIF NEW.frequency = 'yearly' THEN
    NEW.next_due_date = NEW.due_date + INTERVAL '1 year';
  ELSE
    NEW.next_due_date = NEW.due_date;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for next due date calculation
CREATE TRIGGER calculate_next_due_date
BEFORE INSERT OR UPDATE ON public.bill_reminders
FOR EACH ROW
EXECUTE FUNCTION public.update_next_due_date();