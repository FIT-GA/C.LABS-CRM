-- Fix SECURITY DEFINER functions to add access control checks
-- and add missing DELETE policy for profiles

-- 1. Update has_role function with access control
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own role or if caller is admin
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN false;
  END IF;
  
  RETURN EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
END;
$$;

-- 2. Update get_user_role function with access control
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only allow checking own role or if caller is admin
  IF _user_id != auth.uid() AND NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RETURN NULL;
  END IF;
  
  RETURN (
    SELECT role
    FROM public.user_roles
    WHERE user_id = _user_id
    LIMIT 1
  );
END;
$$;

-- 3. Add DELETE policy for profiles table
CREATE POLICY "Users can delete their own profile"
ON public.profiles
FOR DELETE
USING (auth.uid() = user_id);