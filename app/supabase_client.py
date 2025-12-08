from supabase import create_client, Client
import os
from dotenv import load_dotenv
import logging

load_dotenv()
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_KEY = os.getenv("SUPABASE_KEY")
# If a service role key is available in the environment, prefer it for server-side operations
# Service role key bypasses Row Level Security (RLS) and should only be set on the backend
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

# Prefer service key for backend (if present), otherwise fall back to SUPABASE_KEY
_key_to_use = SUPABASE_SERVICE_KEY or SUPABASE_KEY

if SUPABASE_SERVICE_KEY:
	logging.getLogger().info("Supabase client: using SERVICE key (RLS bypass enabled)")
else:
	logging.getLogger().info("Supabase client: SERVICE key not found, using anon key (RLS applies)")

supabase: Client = create_client(SUPABASE_URL, _key_to_use)

