import os
import glob

skills_dir = r"c:\Users\dheen\project\Sonikoma\backend\python\skills"
md_files = glob.glob(os.path.join(skills_dir, "*.md"))

output_file = r"c:\Users\dheen\project\Sonikoma\scripts\skills_dump.txt"

with open(output_file, "w", encoding="utf-8") as out_f:
    out_f.write(f"Found {len(md_files)} skill files:\n")
    for filepath in sorted(md_files):
        filename = os.path.basename(filepath)
        with open(filepath, "r", encoding="utf-8") as f:
            content = f.read()
        out_f.write("=" * 60 + "\n")
        out_f.write(f"FILE: {filename}\n")
        out_f.write("=" * 60 + "\n")
        out_f.write(content.strip() + "\n\n")
print(f"Dumped all skills to {output_file}")

