from typing import List, Dict, Any, Optional
from react_frontend_health_checker.parsers.tokenizer import Tokenizer, Token

class ASTNode:
    def __init__(self, type_: str, **kwargs):
        self.type = type_
        for key, value in kwargs.items():
            setattr(self, key, value)

    def __repr__(self):
        attrs = ", ".join(f"{k}={repr(v)}" for k, v in self.__dict__.items() if k != 'type')
        return f"ASTNode({self.type}, {attrs})"

class Parser:
    """
    A lightweight parser that converts tokens into an Intermediate Representation (AST).
    Focuses heavily on structural analysis for React static analysis (imports, exports, components, hooks).
    """
    def __init__(self):
        self.tokenizer = Tokenizer()

    def parse(self, code: str) -> ASTNode:
        tokens = self.tokenizer.tokenize(code)
        self.tokens = tokens
        self.pos = 0
        self.length = len(tokens)

        body = []
        while self.pos < self.length:
            statement = self._parse_statement()
            if statement:
                body.append(statement)
            else:
                self.pos += 1 # skip unknown tokens for now

        return ASTNode("Program", body=body)

    def _peek(self) -> Optional[Token]:
        if self.pos < self.length:
            return self.tokens[self.pos]
        return None

    def _consume(self, expected_type: Optional[str] = None, expected_value: Optional[str] = None) -> Optional[Token]:
        token = self._peek()
        if not token:
            return None

        if expected_type and token.type != expected_type:
            return None
        if expected_value and token.value != expected_value:
            return None

        self.pos += 1
        return token

    def _parse_statement(self) -> Optional[ASTNode]:
        token = self._peek()
        if not token:
            return None

        if token.type == 'KEYWORD' and token.value == 'import':
            return self._parse_import()
        elif token.type == 'KEYWORD' and token.value == 'export':
            return self._parse_export()
        elif token.type == 'KEYWORD' and token.value in ('const', 'let', 'var'):
            return self._parse_variable_declaration()
        elif token.type == 'KEYWORD' and token.value == 'function':
            return self._parse_function_declaration()

        return None

    def _parse_import(self) -> ASTNode:
        # Simplistic import parsing: import { a, b } from 'c'; or import a from 'c';
        start_token = self._consume('KEYWORD', 'import')
        specifiers = []
        source = None

        # parse specifiers
        token = self._peek()
        if token and token.type == 'PUNCTUATION' and token.value == '{':
            self._consume() # '{'
            while self._peek() and not (self._peek().type == 'PUNCTUATION' and self._peek().value == '}'):
                ident = self._consume('IDENTIFIER')
                if ident:
                    specifiers.append({"type": "ImportSpecifier", "local": ident.value, "imported": ident.value})
                if self._peek() and self._peek().type == 'PUNCTUATION' and self._peek().value == ',':
                    self._consume() # ','
            self._consume('PUNCTUATION', '}')
        elif token and token.type == 'IDENTIFIER':
            ident = self._consume()
            specifiers.append({"type": "ImportDefaultSpecifier", "local": ident.value})

        # from 'source'
        self._consume('KEYWORD', 'from')
        source_token = self._consume('STRING')
        if source_token:
            source = source_token.value.strip("'\"")

        self._consume('PUNCTUATION', ';') # optional semicolon

        return ASTNode("ImportDeclaration", specifiers=specifiers, source=source, line=start_token.line)

    def _parse_export(self) -> ASTNode:
        # simplistic export parsing
        start_token = self._consume('KEYWORD', 'export')

        is_default = False
        if self._peek() and self._peek().type == 'KEYWORD' and self._peek().value == 'default':
            self._consume()
            is_default = True

        declaration = self._parse_statement() # e.g. function or class
        # Add basic support for export { a, b }; and export * from 'c'; if needed
        # For now, just capture the declaration or advance
        if not declaration:
            while self._peek() and self._peek().type != 'PUNCTUATION' and self._peek().value != ';':
                self.pos += 1
            self._consume('PUNCTUATION', ';')

        return ASTNode("ExportDeclaration", is_default=is_default, declaration=declaration, line=start_token.line)

    def _parse_variable_declaration(self) -> ASTNode:
        kind_token = self._consume('KEYWORD') # const, let, var
        declarations = []

        while self._peek() and self._peek().type != 'PUNCTUATION' and self._peek().value != ';':
            id_token = self._consume('IDENTIFIER')
            if id_token:
                init = None
                if self._peek() and self._peek().type == 'OPERATOR' and self._peek().value == '=':
                    self._consume()
                    # simplistic init capture
                    init_tokens = []
                    while self._peek() and not (self._peek().type == 'PUNCTUATION' and self._peek().value in (';', ',')):
                        init_tokens.append(self._consume())
                    init = "".join(t.value for t in init_tokens if t)
                declarations.append({"id": id_token.value, "init": init})

            if self._peek() and self._peek().type == 'PUNCTUATION' and self._peek().value == ',':
                self._consume()
            else:
                break

        self._consume('PUNCTUATION', ';')
        return ASTNode("VariableDeclaration", kind=kind_token.value, declarations=declarations, line=kind_token.line)

    def _parse_function_declaration(self) -> ASTNode:
        start_token = self._consume('KEYWORD', 'function')
        id_token = self._consume('IDENTIFIER')
        name = id_token.value if id_token else None

        # skip args for now
        while self._peek() and not (self._peek().type == 'PUNCTUATION' and self._peek().value == '{'):
            self.pos += 1

        if self._peek() and self._peek().type == 'PUNCTUATION' and self._peek().value == '{':
            # very simplistic block parsing (just count braces)
            self._consume()
            brace_count = 1
            while self._peek() and brace_count > 0:
                t = self._consume()
                if t.type == 'PUNCTUATION' and t.value == '{':
                    brace_count += 1
                elif t.type == 'PUNCTUATION' and t.value == '}':
                    brace_count -= 1

        return ASTNode("FunctionDeclaration", name=name, line=start_token.line)
