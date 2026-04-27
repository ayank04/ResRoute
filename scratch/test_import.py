import sys
import os
backend_path = os.path.abspath(os.path.join(os.getcwd(), "backend"))
sys.path.insert(0, backend_path)
print(f"Path: {sys.path[0]}")
try:
    import app.core.config
    print("Import successful")
except ImportError as e:
    print(f"Import failed: {e}")
