-- Drop existing problematic policies
DROP POLICY IF EXISTS "Users can view shared expenses they participate in" ON public.shared_expenses;
DROP POLICY IF EXISTS "Expense creators can manage participants" ON public.expense_participants;
DROP POLICY IF EXISTS "Users can view their own participation" ON public.expense_participants;

-- Create simplified, non-recursive policies for shared_expenses
CREATE POLICY "Users can view expenses they created" 
ON public.shared_expenses 
FOR SELECT 
USING (created_by = auth.uid());

CREATE POLICY "Users can view expenses they participate in" 
ON public.shared_expenses 
FOR SELECT 
USING (
  created_by = auth.uid() OR 
  id IN (
    SELECT expense_id 
    FROM public.expense_participants 
    WHERE user_id = auth.uid()
  )
);

-- Create simplified policies for expense_participants
CREATE POLICY "Users can view participants of their expenses" 
ON public.expense_participants 
FOR SELECT 
USING (
  user_id = auth.uid() OR
  expense_id IN (
    SELECT id 
    FROM public.shared_expenses 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Expense creators can manage all participants" 
ON public.expense_participants 
FOR ALL 
USING (
  expense_id IN (
    SELECT id 
    FROM public.shared_expenses 
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can manage their own participation" 
ON public.expense_participants 
FOR ALL 
USING (user_id = auth.uid());