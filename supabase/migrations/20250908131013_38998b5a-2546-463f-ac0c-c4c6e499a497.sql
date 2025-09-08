-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can create shared expenses" ON public.shared_expenses;
DROP POLICY IF EXISTS "Expense creators can update their expenses" ON public.shared_expenses;
DROP POLICY IF EXISTS "Users can view expenses they created" ON public.shared_expenses;
DROP POLICY IF EXISTS "Users can view expenses they participate in" ON public.shared_expenses;

DROP POLICY IF EXISTS "Users can view participants of their expenses" ON public.expense_participants;
DROP POLICY IF EXISTS "Expense creators can manage all participants" ON public.expense_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON public.expense_participants;

-- Create very simple, non-recursive policies for shared_expenses
CREATE POLICY "Enable all operations for expense creators" 
ON public.shared_expenses 
FOR ALL 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Create simple policies for expense_participants  
CREATE POLICY "Enable all operations for expense participants" 
ON public.expense_participants 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());