file_path = r"c:\Users\dheen\project\Sonikoma\frontend\src\components\ProfilePage.tsx"

with open(file_path, "r", encoding="utf-8") as f:
    content = f.read()

stack = []
unbalanced = []

in_string = None
escape = False
in_line_comment = False
in_block_comment = False

i = 0
n = len(content)

while i < n:
    char = content[i]
    
    if escape:
        escape = False
        i += 1
        continue
        
    if in_line_comment:
        if char == "\n":
            in_line_comment = False
        i += 1
        continue
        
    if in_block_comment:
        if char == "*" and i + 1 < n and content[i+1] == "/":
            in_block_comment = False
            i += 2
        else:
            i += 1
        continue
        
    if in_string:
        if char == "\\":
            escape = True
        elif char == in_string:
            in_string = None
        i += 1
        continue
        
    # Check for comment start
    if char == "/" and i + 1 < n:
        if content[i+1] == "/":
            in_line_comment = True
            i += 2
            continue
        elif content[i+1] == "*":
            in_block_comment = True
            i += 2
            continue
            
    # Handle string literal boundaries
    if char in ["'", '"', '`']:
        in_string = char
        i += 1
        continue

    # Balance brackets
    if char in ["(", "[", "{"]:
        stack.append((char, i))
    elif char in [")", "]", "}"]:
        if not stack:
            unbalanced.append(("extra_close", char, i))
        else:
            open_char, open_idx = stack.pop()
            if (open_char == "(" and char != ")") or \
               (open_char == "[" and char != "]") or \
               (open_char == "{" and char != "}"):
                unbalanced.append(("mismatch", open_char, char, open_idx, i))
    i += 1

def get_line_col(text, index):
    lines = text[:index].split("\n")
    return len(lines), len(lines[-1]) + 1

print("--- Unbalanced Brackets / Mismatches ---")
for item in unbalanced:
    if item[0] == "extra_close":
        line, col = get_line_col(content, item[2])
        print(f"Extra closing '{item[1]}' at line {line}, col {col}")
    elif item[0] == "mismatch":
        line_op, col_op = get_line_col(content, item[3])
        line_cl, col_cl = get_line_col(content, item[4])
        print(f"Mismatched bracket: opened '{item[1]}' at line {line_op}, col {col_op} but closed with '{item[2]}' at line {line_cl}, col {col_cl}")

if stack:
    print("\n--- Unclosed Brackets Remaining on Stack ---")
    for char, idx in stack:
        line, col = get_line_col(content, idx)
        print(f"Unclosed '{char}' opened at line {line}, col {col}")
else:
    print("\nNo unclosed brackets on stack.")
