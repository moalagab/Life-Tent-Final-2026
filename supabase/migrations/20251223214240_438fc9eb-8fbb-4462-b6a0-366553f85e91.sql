-- Drop existing policies
DROP POLICY IF EXISTS "Authenticated users can view fx_rates" ON public.fx_rates;
DROP POLICY IF EXISTS "Service role can insert fx_rates" ON public.fx_rates;

-- Create a more secure INSERT policy that only allows edge functions/service role
-- and adds validation through a function
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT current_setting('request.jwt.claims', true)::json->>'role' = 'service_role'
$$;

-- Recreate SELECT policy - fx_rates are shared data, all authenticated users can view
CREATE POLICY "Authenticated users can view fx_rates" 
ON public.fx_rates 
FOR SELECT 
TO authenticated
USING (true);

-- Only allow INSERT through service role (edge functions/backend)
CREATE POLICY "Only service role can insert fx_rates" 
ON public.fx_rates 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Only allow UPDATE through service role
CREATE POLICY "Only service role can update fx_rates" 
ON public.fx_rates 
FOR UPDATE 
TO service_role
USING (true);

-- Only allow DELETE through service role  
CREATE POLICY "Only service role can delete fx_rates" 
ON public.fx_rates 
FOR DELETE 
TO service_role
USING (true);