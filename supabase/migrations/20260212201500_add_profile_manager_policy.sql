-- Allow managers (admin/ceo) to inserir/atualizar perfis pelo app

DROP POLICY IF EXISTS "Managers can view all profiles" ON public.profiles;

CREATE POLICY "Managers can manage profiles"
  ON public.profiles
  FOR ALL
  USING (public.is_manager(auth.uid()))
  WITH CHECK (public.is_manager(auth.uid()));

-- (Opcional) manter leitura própria, caso exista em migrações antigas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'profiles'
      AND policyname = 'Users can view own profile'
  ) THEN
    CREATE POLICY "Users can view own profile"
      ON public.profiles
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;
END$$;
