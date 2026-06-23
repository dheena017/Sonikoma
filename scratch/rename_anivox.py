import os

def rename_sonikoma(root_dir):
    ignore_dirs = {'.git', 'node_modules', 'dist', '.venv', '__pycache__', '.pytest_cache'}
    ignore_extensions = {'.bin', '.mp4', '.mp3', '.wav', '.png', '.jpg', '.jpeg', '.webp', '.ico', '.sqlite', '.sqlite3', '.pyc'}
    
    replacements = [
        ("Sonikoma", "Sonikoma"),
        ("sonikoma", "sonikoma"),
        ("SONIKOMA", "SONIKOMA"),
        ("sonikoma", "sonikoma"),
        ("sonikoma", "sonikoma")
    ]
    
    modified_files = 0
    
    for dirpath, dirnames, filenames in os.walk(root_dir):
        # Exclude ignored directories
        dirnames[:] = [d for d in dirnames if d not in ignore_dirs]
        
        for filename in filenames:
            ext = os.path.splitext(filename)[1].lower()
            if ext in ignore_extensions:
                continue
                
            filepath = os.path.join(dirpath, filename)
            
            try:
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                    
                new_content = content
                for old, new in replacements:
                    new_content = new_content.replace(old, new)
                    
                if new_content != content:
                    with open(filepath, 'w', encoding='utf-8') as f:
                        f.write(new_content)
                    print(f"Modified: {filepath}")
                    modified_files += 1
            except UnicodeDecodeError:
                # Likely a binary file that wasn't excluded
                pass
            except Exception as e:
                print(f"Error processing {filepath}: {e}")
                
    print(f"\nDone! Modified {modified_files} files.")

if __name__ == "__main__":
    repo_root = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
    rename_sonikoma(repo_root)
