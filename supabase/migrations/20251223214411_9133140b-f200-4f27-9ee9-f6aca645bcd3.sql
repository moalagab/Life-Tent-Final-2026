-- Add validation trigger to prevent unreasonable exchange rate values
CREATE OR REPLACE FUNCTION public.validate_fx_rate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Validate rate is positive and within reasonable bounds
  IF NEW.rate <= 0 THEN
    RAISE EXCEPTION 'Exchange rate must be positive';
  END IF;
  
  IF NEW.rate > 1000000 THEN
    RAISE EXCEPTION 'Exchange rate exceeds maximum allowed value';
  END IF;
  
  -- Validate currencies are valid 3-letter codes
  IF LENGTH(NEW.from_currency) != 3 OR LENGTH(NEW.to_currency) != 3 THEN
    RAISE EXCEPTION 'Currency codes must be exactly 3 characters';
  END IF;
  
  -- Validate date is not in the future
  IF NEW.date > CURRENT_DATE THEN
    RAISE EXCEPTION 'Exchange rate date cannot be in the future';
  END IF;
  
  -- Set source to identify the origin
  IF NEW.source IS NULL THEN
    NEW.source := 'system';
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for INSERT
DROP TRIGGER IF EXISTS validate_fx_rate_insert ON public.fx_rates;
CREATE TRIGGER validate_fx_rate_insert
  BEFORE INSERT ON public.fx_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_fx_rate();

-- Create trigger for UPDATE
DROP TRIGGER IF EXISTS validate_fx_rate_update ON public.fx_rates;
CREATE TRIGGER validate_fx_rate_update
  BEFORE UPDATE ON public.fx_rates
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_fx_rate();

-- Add constraint for unique rate per currency pair per date
ALTER TABLE public.fx_rates DROP CONSTRAINT IF EXISTS fx_rates_unique_pair_date;
ALTER TABLE public.fx_rates ADD CONSTRAINT fx_rates_unique_pair_date 
  UNIQUE (from_currency, to_currency, date);