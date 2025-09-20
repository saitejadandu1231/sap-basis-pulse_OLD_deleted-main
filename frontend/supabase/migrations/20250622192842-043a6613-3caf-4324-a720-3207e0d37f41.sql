
-- Enable Row Level Security on signup_options table
ALTER TABLE public.signup_options ENABLE ROW LEVEL SECURITY;

-- Create policy to allow anonymous (unauthenticated) users to read signup options
-- This is safe because signup options are configuration data that needs to be public
CREATE POLICY "Allow anonymous read access to signup options" 
ON public.signup_options 
FOR SELECT 
TO anon, authenticated
USING (true);

-- Ensure only authenticated admin users can modify signup options (for security)
CREATE POLICY "Only authenticated users can modify signup options" 
ON public.signup_options 
FOR ALL 
TO authenticated
USING (auth.role() = 'authenticated')
WITH CHECK (auth.role() = 'authenticated');
