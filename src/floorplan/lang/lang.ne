@{%
const { lexer, tokenStart, tokenEnd, convertToken, convertTokenId } = require("../lexer.js");

function toNumber(d) {
    return parseFloat(d[0]);
}
%}

@lexer lexer

main -> top_levels

# ---------- Top level

top_levels -> top_level (__nl top_level):*

top_level
    -> function_def
    |  event_def
    |  statement

# ---------- Definitions

function_def -> "fn" __ identifier _ "(" args:? ")" _ code_block
event_def -> "on" __ %event (__ "matches" __ criteria):? _ code_block

# ---------- Statements

statement
    -> if_statement
    |  call_statement
    |  var_statement
    |  return_statement
    |  command_statement
    |  wait_statement
    |  log_statement
    |  comment

# --

if_statement -> "if" _ "(" expression ")" _ code_block (_nl "else" __ "if" _ "(" expression ")" _ code_block):* (_nl "else" _ code_block):?
call_statement -> identifier "(" (expression ("," _ expression):*):? ")"
var_statement
    -> "var" __ identifier _ "=" _ expression
     | identifier _ ["=" "+=" "-=" "**=" "*=" "/=" "%="] _ expression

return_statement -> "return" (__ expression):?
command_statement -> "command" __ expression
wait_statement -> "wait" __ expression
log_statement -> "log" __ expression

# # ---------- Components

code_block -> "{" _nl top_levels _nl "}"
args -> identifier ("," _ identifier):*
criteria -> string

# ---------- Expressions

expression -> infix_expr

infix_expr
    -> infix_expr _ "||" _ infix_expr
     | infix_expr _ "&&" _ infix_expr
     | comparison_expr

comparison_expr
    -> comparison_expr _ "==" _ comparison_expr
     | comparison_expr _ "!=" _ comparison_expr
     | additive_expr

additive_expr
    -> additive_expr _ "+" _ additive_expr
     | additive_expr _ "-" _ additive_expr
     | multiplicative_expr

multiplicative_expr
    -> multiplicative_expr _ "**" _ multiplicative_expr
     | multiplicative_expr _ "*" _ multiplicative_expr
     | multiplicative_expr _ "/" _ multiplicative_expr
     | multiplicative_expr _ "%" _ multiplicative_expr
     | base_term

base_term
    -> "!" base_term        # Unary not
     | "-" base_term        # Unary negation
     | call_statement       # Function call
     | "(" expression ")"   # Factoring
     | identifier
     | number
     | string

# ---------- Lexer Defs

_ -> %ws:*              # Optional whitespace
__ -> %ws:+             # Mandatory whitespace
_nl -> nl_ws_char:*     # Optional newline
__nl -> nl_ws_char:+    # Mandatory newline

nl_ws_char -> %ws | %nl

comment -> %comment
number -> %number_literal
string -> %string_literal
identifier -> %identifier