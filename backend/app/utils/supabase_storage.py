import sys
try:
    from infrastructure.storage.supabase_storage import *
    import infrastructure.storage.supabase_storage as target
except ModuleNotFoundError:
    from app.infrastructure.storage.supabase_storage import *
    import app.infrastructure.storage.supabase_storage as target
sys.modules[__name__] = target
