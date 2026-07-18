"""
backend/app/database/db.py
─────────────────────────────────────────────────────────────────────────────
Compatibility wrapper forwarding to the refactored infrastructure database
connection and repositories layers. Uses a custom ModuleType subclass to
intercept reads and writes (like DB_PATH) for runtime compatibility with tests.
─────────────────────────────────────────────────────────────────────────────
"""

import sys
import types
import database.connection as _conn
import repositories.user as _user
import repositories.project as _proj
import repositories.scraper as _scrape
import repositories.youtube as _yt
import repositories.system as _sys

_submodules = [_conn, _user, _proj, _scrape, _yt, _sys]

class CompatibilityDatabaseModule(types.ModuleType):
    def __getattr__(self, name):
        for mod in _submodules:
            if hasattr(mod, name):
                return getattr(mod, name)
        raise AttributeError(f"module '{__name__}' has no attribute '{name}'")

    def __setattr__(self, name, value):
        if name in ('_submodules', '__all__'):
            super().__setattr__(name, value)
            return

        written = False
        for mod in _submodules:
            if hasattr(mod, name):
                setattr(mod, name, value)
                written = True
        
        if not written:
            super().__setattr__(name, value)

# Override the class of this module to enable custom __getattr__ and __setattr__
sys.modules[__name__].__class__ = CompatibilityDatabaseModule
