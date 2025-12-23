-- Fix fx_rates INSERT policy to prevent rate manipulation
-- Only allow admin-level insertions or remove the open insert policy

-- Drop the permissive INSERT policy
DROP POLICY IF EXISTS "Users can insert fx_rates" ON public.fx_rates;

-- Create a more restrictive policy - only allow system/service role to insert
-- For now, we'll prevent all regular users from inserting rates
-- Rates should be managed by admin or automated systems only
CREATE POLICY "Service role can insert fx_rates" 
ON public.fx_rates 
FOR INSERT 
TO service_role
WITH CHECK (true);

-- Allow authenticated users to only view fx_rates (already exists but ensure it's correct)
DROP POLICY IF EXISTS "Users can view all fx_rates" ON public.fx_rates;
CREATE POLICY "Authenticated users can view fx_rates" 
ON public.fx_rates 
FOR SELECT 
TO authenticated
USING (true);