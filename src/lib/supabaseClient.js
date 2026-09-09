import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://fvggxnpmkflwmfbssope.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ2Z2d4bnBta2Zsd21mYnNzb3BlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODg5ODQ3OTEsImV4cCI6MjEwNDU2MDc5MX0.v-yLqA71YU_IPHOhDKzX-GghYP75loBprzMpLn-DoC0";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
