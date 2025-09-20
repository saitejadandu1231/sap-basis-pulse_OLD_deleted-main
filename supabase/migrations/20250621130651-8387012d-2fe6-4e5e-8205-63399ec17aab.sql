
-- 1. Add status column to denied_domains table
ALTER TABLE public.denied_domains 
ADD COLUMN status VARCHAR(10) NOT NULL DEFAULT 'enabled' 
CHECK (status IN ('enabled', 'disabled'));

-- 4. Create orders table for support requests with sequential numbering
CREATE TABLE public.orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) UNIQUE NOT NULL, -- e.g., R2400001, G2400002
    customer_choice_id UUID UNIQUE NOT NULL REFERENCES public.customer_choice(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id), -- Customer who created it
    consultant_id UUID REFERENCES public.user_master(user_id), -- Consultant assigned
    support_type_name VARCHAR(100), -- Denormalized for easier display
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER set_timestamp_orders 
BEFORE UPDATE ON public.orders 
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

CREATE INDEX idx_orders_user_id ON public.orders(user_id);
CREATE INDEX idx_orders_consultant_id ON public.orders(consultant_id);

-- Create number_sequences table for sequential order numbering
CREATE TABLE public.number_sequences (
    sequence_name VARCHAR(20) PRIMARY KEY, -- e.g., 'RISE_ORDER', 'GROW_ORDER'
    prefix VARCHAR(5) NOT NULL, -- e.g., 'R', 'G', 'O', 'M'
    current_value BIGINT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Seed initial sequences
INSERT INTO public.number_sequences (sequence_name, prefix, current_value) VALUES
('RISE_ORDER', 'R', 0),
('GROW_ORDER', 'G', 0),
('ONPREM_ORDER', 'O', 0),
('MIGRATION_ORDER', 'M', 0)
ON CONFLICT (sequence_name) DO NOTHING;

-- 6. Create SAP_RISE_RNR table for SR identifier validation
CREATE TABLE public.sap_rise_rnr (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(100) UNIQUE NOT NULL,
    task TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE TRIGGER set_timestamp_sap_rise_rnr 
BEFORE UPDATE ON public.sap_rise_rnr 
FOR EACH ROW EXECUTE FUNCTION trigger_set_timestamp();

-- Enable RLS on new tables
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.number_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sap_rise_rnr ENABLE ROW LEVEL SECURITY;

-- RLS Policies for orders table
CREATE POLICY "Customers can view their own orders" 
  ON public.orders 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view assigned orders" 
  ON public.orders 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = consultant_id);

CREATE POLICY "Admins can manage all orders" 
  ON public.orders 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can create orders" 
  ON public.orders 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for number_sequences table
CREATE POLICY "Admins can manage number sequences" 
  ON public.number_sequences 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can update sequences" 
  ON public.number_sequences 
  FOR UPDATE 
  TO authenticated
  USING (true);

CREATE POLICY "System can read sequences" 
  ON public.number_sequences 
  FOR SELECT 
  TO authenticated
  USING (true);

-- RLS Policies for sap_rise_rnr table
CREATE POLICY "Admins can manage SAP RISE RNR records" 
  ON public.sap_rise_rnr 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Authenticated users can read active SAP RISE RNR records" 
  ON public.sap_rise_rnr 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

-- Function to generate order number atomically
CREATE OR REPLACE FUNCTION public.generate_order_number(support_type_name TEXT)
RETURNS TEXT AS $$
DECLARE
    sequence_name_val TEXT;
    prefix_val TEXT;
    new_value BIGINT;
    year_suffix TEXT;
    order_number TEXT;
BEGIN
    -- Determine sequence name based on support type
    CASE support_type_name
        WHEN 'SAP RISE' THEN sequence_name_val := 'RISE_ORDER';
        WHEN 'SAP Grow' THEN sequence_name_val := 'GROW_ORDER';
        WHEN 'On-Prem/Non-Catalogue' THEN sequence_name_val := 'ONPREM_ORDER';
        WHEN 'Migration' THEN sequence_name_val := 'MIGRATION_ORDER';
        ELSE sequence_name_val := 'ONPREM_ORDER'; -- Default fallback
    END CASE;
    
    -- Get current year (last 2 digits)
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    year_suffix := RIGHT(year_suffix, 2);
    
    -- Atomically increment and get new value
    UPDATE public.number_sequences 
    SET current_value = current_value + 1, 
        last_updated = now() 
    WHERE sequence_name = sequence_name_val 
    RETURNING prefix, current_value INTO prefix_val, new_value;
    
    -- Construct order number: prefix + year + padded number
    order_number := prefix_val || year_suffix || LPAD(new_value::TEXT, 5, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Insert some sample SAP RISE RNR identifiers for testing
INSERT INTO public.sap_rise_rnr (identifier, task, is_active) VALUES
('SR-2024-001', 'Test Service Request 1', true),
('SR-2024-002', 'Test Service Request 2', true),
('SR-2024-003', 'Inactive Service Request', false)
ON CONFLICT (identifier) DO NOTHING;
