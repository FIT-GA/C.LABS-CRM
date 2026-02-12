-- Remove the policy that allows users to insert their own role (security vulnerability)
DROP POLICY IF EXISTS "Users can insert their own role" ON public.user_roles;

-- Ensure admins can still manage roles
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;

CREATE POLICY "Admins can manage roles" 
ON public.user_roles 
FOR ALL 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add policy for inserting colaborador role only (not admin)
CREATE POLICY "Users can insert colaborador role for themselves" 
ON public.user_roles 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND role = 'colaborador'::app_role
);