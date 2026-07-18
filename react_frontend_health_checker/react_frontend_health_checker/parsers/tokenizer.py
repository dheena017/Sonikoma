import re
from typing import List, Dict, Any, Optional

class Token:
    def __init__(self, type_: str, value: str, line: int, column: int):
        self.type = type_
        self.value = value
        self.line = line
        self.column = column

    def __repr__(self):
        return f"Token({self.type}, {repr(self.value)}, {self.line}, {self.column})"

class Tokenizer:
    """
    A lightweight, regex-based tokenizer for JS/TS/JSX/TSX.
    This serves as the foundation for the parser.
    """
    # Simplified regex patterns for basic tokenization
    PATTERNS = [
        ('WHITESPACE', r'\s+'),
        ('COMMENT_MULTI', r'/\*[\s\S]*?\*/'),
        ('COMMENT_SINGLE', r'//.*'),
        ('KEYWORD', r'\b(import|export|from|const|let|var|function|class|return|if|else|for|while|switch|case|default|break|continue|try|catch|finally|throw|new|this|super|typeof|instanceof|async|await|yield)\b'),
        ('IDENTIFIER', r'[a-zA-Z_$][a-zA-Z0-9_$]*'),
        ('STRING', r'(["\'])(?:(?=(\\?))\2.)*?\1|`[^`]*`'),
        ('NUMBER', r'\b\d+(\.\d+)?([eE][+-]?\d+)?\b'),
        ('OPERATOR', r'===|!==|==|!=|<=|>=|<|>|\+|-|\*|/|%|\*\*|\+\+|--|&&|\|\||!|&|\||\^|~|<<|>>|>>>|\?|:|='),
        ('PUNCTUATION', r'[{}()\[\],.;]'),
        ('JSX_TAG_START', r'<\s*[a-zA-Z_$][a-zA-Z0-9_$]*'),
        ('JSX_TAG_END', r'</\s*[a-zA-Z_$][a-zA-Z0-9_$]*\s*>'),
        ('JSX_TAG_SELF_CLOSE', r'/>'),
        ('JSX_TAG_CLOSE', r'>'),
    ]

    def __init__(self):
        self.regex = re.compile('|'.join(f'(?P<{name}>{pattern})' for name, pattern in self.PATTERNS))

    def tokenize(self, code: str) -> List[Token]:
        tokens = []
        line = 1
        column = 1

        for match in self.regex.finditer(code):
            type_ = match.lastgroup
            value = match.group(type_)

            if type_ not in ('WHITESPACE', 'COMMENT_MULTI', 'COMMENT_SINGLE'):
                tokens.append(Token(type_, value, line, column))

            # Update line and column
            lines = value.split('\n')
            if len(lines) > 1:
                line += len(lines) - 1
                column = len(lines[-1]) + 1
            else:
                column += len(value)

        return tokens
