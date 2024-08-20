@builtin "whitespace.ne"    # `_` means arbitrary amount of whitespace
@builtin "number.ne"        # `int`, `decimal`, and `percentage` number primitives

main -> statement:+         # `main` is the entry point of your grammar

statement -> 
    | "perm" _ id "=" _ value {% id %}      # Handle permanent variable declarations
    | "temp" _ id "=" _ value {% id %}      # Handle temporary variable declarations
    | "log" _ value {% id %}                # Handle log statements
    | "wait" _ value {% id %}               # Handle wait statements
    | id "=" _ value {% id %}               # Handle assignments

id -> [a-zA-Z_][a-zA-Z0-9_]* {% id %}       # Identifiers
value -> int                                # Numeric values for simplicity

_ -> " "                                    # Space (single space for simplicity)