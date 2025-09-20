
-- First, let's drop the previous policies to replace them with more granular ones
DROP POLICY IF EXISTS "Anyone can view available slots" ON public.consultant_availability_slots;
DROP POLICY IF EXISTS "Consultants can manage their slots" ON public.consultant_availability_slots;
DROP POLICY IF EXISTS "Users can view their own choices" ON public.customer_choice;
DROP POLICY IF EXISTS "Users can create their own choices" ON public.customer_choice;
DROP POLICY IF EXISTS "Users can update their own choices" ON public.customer_choice;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.user_master;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.user_master;
DROP POLICY IF EXISTS "Anyone can read support types" ON public.support_types;
DROP POLICY IF EXISTS "Anyone can read support categories" ON public.support_categories;
DROP POLICY IF EXISTS "Anyone can read support sub options" ON public.support_sub_options;

-- Drop the previous constraint to replace with better overlap prevention
ALTER TABLE public.consultant_availability_slots DROP CONSTRAINT IF EXISTS unique_unbooked_slot;

-- Create security definer function to check user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
  SELECT role FROM public.user_master WHERE user_id = auth.uid();
$$ LANGUAGE SQL SECURITY DEFINER STABLE;

-- Enable RLS on remaining tables
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.login_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.denied_domains ENABLE ROW LEVEL SECURITY;

-- Install btree_gist extension for overlap constraints (if not already installed)
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Better slot overlap prevention constraint
ALTER TABLE public.consultant_availability_slots 
ADD CONSTRAINT prevent_consultant_slot_overlap 
EXCLUDE USING GIST (
  consultant_user_id WITH =, 
  TSTZRANGE(slot_start_time, slot_end_time, '[)') WITH &&
);

-- Refined RLS Policies for consultant_availability_slots
CREATE POLICY "Authenticated users can view unbooked future slots" 
  ON public.consultant_availability_slots 
  FOR SELECT 
  TO authenticated
  USING (booked_by_customer_choice_id IS NULL AND slot_start_time > now());

CREATE POLICY "Consultants can manage their own slots" 
  ON public.consultant_availability_slots 
  FOR ALL 
  TO authenticated
  USING (auth.uid() = consultant_user_id);

CREATE POLICY "Admins can manage all slots" 
  ON public.consultant_availability_slots 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Refined RLS Policies for customer_choice
CREATE POLICY "Customers can view their own choices" 
  ON public.customer_choice 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Customers can create their own choices" 
  ON public.customer_choice 
  FOR INSERT 
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Customers can update their own choices" 
  ON public.customer_choice 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Consultants can view assigned choices" 
  ON public.customer_choice 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = consultant_id);

CREATE POLICY "Consultants can update assigned choices" 
  ON public.customer_choice 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = consultant_id);

CREATE POLICY "Admins can manage all customer choices" 
  ON public.customer_choice 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Refined RLS Policies for user_master
CREATE POLICY "Users can view their own profile" 
  ON public.user_master 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_master 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all user profiles" 
  ON public.user_master 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscriptions" 
  ON public.user_subscriptions 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own subscriptions" 
  ON public.user_subscriptions 
  FOR UPDATE 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions" 
  ON public.user_subscriptions 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- RLS Policies for subscription_plans (public read, admin write)
CREATE POLICY "Anyone can view active subscription plans" 
  ON public.subscription_plans 
  FOR SELECT 
  USING (is_active = true);

CREATE POLICY "Admins can manage subscription plans" 
  ON public.subscription_plans 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- RLS Policies for login_activity
CREATE POLICY "Users can view their own login activity" 
  ON public.login_activity 
  FOR SELECT 
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all login activity" 
  ON public.login_activity 
  FOR SELECT 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert login activity" 
  ON public.login_activity 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for audit_log
CREATE POLICY "Admins can view all audit logs" 
  ON public.audit_log 
  FOR SELECT 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can insert audit logs" 
  ON public.audit_log 
  FOR INSERT 
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for denied_domains
CREATE POLICY "Admins can manage denied domains" 
  ON public.denied_domains 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "System can check denied domains" 
  ON public.denied_domains 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Public read access for support configuration tables
CREATE POLICY "Authenticated users can read active support types" 
  ON public.support_types 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage support types" 
  ON public.support_types 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Authenticated users can read active support categories" 
  ON public.support_categories 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage support categories" 
  ON public.support_categories 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

CREATE POLICY "Authenticated users can read active support sub options" 
  ON public.support_sub_options 
  FOR SELECT 
  TO authenticated
  USING (is_active = true);

CREATE POLICY "Admins can manage support sub options" 
  ON public.support_sub_options 
  FOR ALL 
  TO authenticated
  USING (public.get_current_user_role() = 'admin');

-- Update handle_new_user function with correct default status
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.user_master (user_id, role, status)
  VALUES (NEW.id, 'customer', 'pending_verification');
  RETURN NEW;
END;
$$;

-- Add some initial admin user (you'll need to update this with actual admin user ID after signup)
-- This is commented out - you'll need to manually set admin role for your first admin user
-- UPDATE public.user_master SET role = 'admin' WHERE user_id = 'YOUR_ADMIN_USER_ID';
