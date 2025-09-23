
-- Fix the array literal error by correcting the number_sequences table structure
-- and the generate_order_number function

-- First, let's ensure we have a proper global sequence
INSERT INTO public.number_sequences (sequence_name, current_value) VALUES
('GLOBAL_ORDER_SEQUENCE', 0)
ON CONFLICT (sequence_name) DO NOTHING;

-- Update the generate_order_number function to handle prefix building correctly
CREATE OR REPLACE FUNCTION public.generate_order_number(
    support_type_name text, 
    support_category_name text DEFAULT '', 
    support_sub_option_name text DEFAULT '', 
    priority_level text DEFAULT 'Medium'
)
RETURNS text AS $$
DECLARE
    prefix_parts TEXT;
    final_prefix TEXT;
    new_value BIGINT;
    year_suffix TEXT;
    order_number TEXT;
BEGIN
    -- Initialize prefix parts as empty string
    prefix_parts := '';
    
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
    
    final_prefix := prefix_parts;
    
    -- Get current year (last 2 digits)
    year_suffix := EXTRACT(YEAR FROM CURRENT_DATE)::TEXT;
    year_suffix := RIGHT(year_suffix, 2);
    
    -- Atomically increment and get new value using the global sequence
    UPDATE public.number_sequences 
    SET current_value = current_value + 1, 
        last_updated = now() 
    WHERE sequence_name = 'GLOBAL_ORDER_SEQUENCE' 
    RETURNING current_value INTO new_value;
    
    -- If no row was updated, initialize the sequence
    IF new_value IS NULL THEN
        INSERT INTO public.number_sequences (sequence_name, current_value) 
        VALUES ('GLOBAL_ORDER_SEQUENCE', 1)
        ON CONFLICT (sequence_name) DO UPDATE SET current_value = number_sequences.current_value + 1
        RETURNING current_value INTO new_value;
    END IF;
    
    -- Construct order number: prefix + year + padded number
    order_number := final_prefix || year_suffix || LPAD(new_value::TEXT, 5, '0');
    
    RETURN order_number;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
