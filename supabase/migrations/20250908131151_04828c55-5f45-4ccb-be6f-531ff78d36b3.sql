-- Disable RLS temporarily to clear all issues
ALTER TABLE public.shared_expenses DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies completely
DROP POLICY IF EXISTS "Enable all operations for expense creators" ON public.shared_expenses;
DROP POLICY IF EXISTS "Enable all operations for expense participants" ON public.expense_participants;
DROP POLICY IF EXISTS "Users can view expenses they created" ON public.shared_expenses;
DROP POLICY IF EXISTS "Users can view expenses they participate in" ON public.shared_expenses;
DROP POLICY IF EXISTS "Users can view participants of their expenses" ON public.expense_participants;
DROP POLICY IF EXISTS "Expense creators can manage all participants" ON public.expense_participants;
DROP POLICY IF EXISTS "Users can manage their own participation" ON public.expense_participants;

-- Re-enable RLS
ALTER TABLE public.shared_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expense_participants ENABLE ROW LEVEL SECURITY;

-- Create the simplest possible policies with NO cross-table references
CREATE POLICY "Allow users to manage their own expenses" 
ON public.shared_expenses 
FOR ALL 
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

CREATE POLICY "Allow users to manage their own participants" 
ON public.expense_participants 
FOR ALL 
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());