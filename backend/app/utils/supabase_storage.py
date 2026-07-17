import sys
try:
    from database.storage.supabase_storage import *
    import database.storage.supabase_storage as target
except ModuleNotFoundError:
    from database.storage.supabase_storage import *
    import database.storage.supabase_storage as target
sys.modules[__name__] = target
