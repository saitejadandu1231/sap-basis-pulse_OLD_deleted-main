
-- First, temporarily drop the constraint to allow updates
ALTER TABLE public.customer_choice 
DROP CONSTRAINT IF EXISTS customer_choice_status_check;

-- Update all existing status values to 'New' for safety
UPDATE public.customer_choice 
SET status = 'New'
WHERE status NOT IN ('New', 'InProgress', 'PendingCustomerAction', 'TopicClosed', 'Closed', 'ReOpened');

-- Now add the constraint back
ALTER TABLE public.customer_choice 
ADD CONSTRAINT customer_choice_status_check 
CHECK (status IN ('New', 'InProgress', 'PendingCustomerAction', 'TopicClosed', 'Closed', 'ReOpened'));

-- Update default status to 'New'
ALTER TABLE public.customer_choice 
ALTER COLUMN status SET DEFAULT 'New';

-- Add status tracking columns to customer_choice if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_choice' AND column_name = 'status_updated_by_user_id') THEN
        ALTER TABLE public.customer_choice 
        ADD COLUMN status_updated_by_user_id UUID REFERENCES auth.users(id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'customer_choice' AND column_name = 'status_updated_at') THEN
        ALTER TABLE public.customer_choice 
        ADD COLUMN status_updated_at TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Add first_name and last_name to user_master if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_master' AND column_name = 'first_name') THEN
        ALTER TABLE public.user_master 
        ADD COLUMN first_name VARCHAR(100);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_master' AND column_name = 'last_name') THEN
        ALTER TABLE public.user_master 
        ADD COLUMN last_name VARCHAR(100);
    END IF;
END $$;

-- Drop and recreate number_sequences table
DROP TABLE IF EXISTS public.number_sequences;
CREATE TABLE public.number_sequences (
    sequence_name VARCHAR(50) PRIMARY KEY DEFAULT 'GLOBAL_ORDER_SEQUENCE',
    current_value BIGINT NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT now()
);

INSERT INTO public.number_sequences (sequence_name, current_value) 
VALUES ('GLOBAL_ORDER_SEQUENCE', 0);

-- Create ticket_ratings table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.ticket_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    rated_by_user_id UUID NOT NULL REFERENCES auth.users(id),
    rated_user_id UUID NOT NULL REFERENCES auth.users(id),
    rating_for_role VARCHAR(20) NOT NULL CHECK (rating_for_role IN ('customer', 'consultant')),
    resolution_quality INTEGER CHECK (resolution_quality BETWEEN 1 AND 5),
    response_time INTEGER CHECK (response_time BETWEEN 1 AND 5),
    communication_professionalism INTEGER CHECK (communication_professionalism BETWEEN 1 AND 5),
    comments TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (order_id, rated_by_user_id, rated_user_id)
);

-- Create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_tr_order_id ON public.ticket_ratings(order_id);
CREATE INDEX IF NOT EXISTS idx_tr_rated_user_id ON public.ticket_ratings(rated_user_id);

-- Enable RLS on ticket_ratings
ALTER TABLE public.ticket_ratings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Users can create ratings for their tickets" ON public.ticket_ratings;
DROP POLICY IF EXISTS "Users can view ratings they gave or received" ON public.ticket_ratings;
DROP POLICY IF EXISTS "Admins can manage all ratings" ON public.ticket_ratings;

-- Create RLS policies for ticket_ratings
CREATE POLICY "Users can create ratings for their tickets" 
  ON public.ticket_ratings 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = rated_by_user_id);

CREATE POLICY "Users can view ratings they gave or received" 
  ON public.ticket_ratings 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = rated_by_user_id OR auth.uid() = rated_user_id);

CREATE POLICY "Admins can manage all ratings" 
  ON public.ticket_ratings 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Update RLS policies for customer_choice
DROP POLICY IF EXISTS "Users can update status of their own tickets" ON public.customer_choice;
CREATE POLICY "Users can update status of their own tickets" 
  ON public.customer_choice 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id OR auth.uid() = consultant_id);

-- Update handle_new_user function
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.user_master (
    user_id, 
    role, 
    status, 
    first_name, 
    last_name
  )
  VALUES (
    NEW.id, 
    'customer', 
    'pending_verification',
    NEW.raw_user_meta_data ->> 'first_name',
    NEW.raw_user_meta_data ->> 'last_name'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = '';

-- Update generate_order_number function
CREATE OR REPLACE FUNCTION public.generate_order_number(
  support_type_name TEXT,
  support_category_name TEXT DEFAULT '',
  support_sub_option_name TEXT DEFAULT '',
  priority_level TEXT DEFAULT 'Medium'
)
RETURNS TEXT AS $$
DECLARE
    prefix_parts TEXT[];
    final_prefix TEXT;
    new_value BIGINT;
    year_suffix TEXT;
    order_number TEXT;
BEGIN
    prefix_parts := ARRAY[]::TEXT[];
    
    -- Support Type mapping
    CASE support_type_name
        WHEN 'SAP RISE' THEN prefix_parts := prefix_parts || 'R';
        WHEN 'SAP Grow' THEN prefix_parts := prefix_parts || 'G';
        WHEN 'On-Prem/Non-Catalogue' THEN prefix_parts := prefix_parts || 'O';
        WHEN 'Migration' THEN prefix_parts := prefix_parts || 'M';
        ELSE prefix_parts := prefix_parts || 'O';
    END CASE;
    
    -- Category mapping (first letter)
    IF support_category_name != '' THEN
        prefix_parts := prefix_parts || LEFT(UPPER(support_category_name), 1);
    END IF;
    
    -- Sub-option mapping
    CASE support_sub_option_name
        WHEN 'Incident' THEN prefix_parts := prefix_parts || 'I';
        WHEN 'Service Request' THEN prefix_parts := prefix_parts || 'S';
        WHEN 'Change Request' THEN prefix_parts := prefix_parts || 'C';
        ELSE 
            IF support_sub_option_name != '' THEN
                prefix_parts := prefix_parts || LEFT(UPPER(support_sub_option_name), 1);
            END IF;
    END CASE;
    
    -- Priority mapping
    CASE priority_level
        WHEN 'VeryHigh' THEN prefix_parts := prefix_parts || 'V';
        WHEN 'High' THEN prefix_parts := prefix_parts || 'H';
        WHEN 'Medium' THEN prefix_parts := prefix_parts || 'M';
        WHEN 'Low' THEN prefix_parts := prefix_parts || 'L';
        ELSE prefix_parts := prefix_parts || 'M';
    END CASE;
    
    final_prefix := array_to_string(prefix_parts, '');
    
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    year_suffix := RIGHT(year_suffix, 2);
    
    UPDATE public.number_sequences 
    SET current_value = current_value + 1, 
        last_updated = now() 
    WHERE sequence_name = 'GLOBAL_ORDER_SEQUENCE' 
    RETURNING current_value INTO new_value;
    
    order_number := final_prefix || year_suffix || LPAD(new_value::TEXT, 5, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
