# ========== LEXER ==========
@{%
const moo = require("moo");

let lexer = moo.compile({
	ws: /[ \t]+/,
	nl: { match: /(?:\r\n|\r|\n)/, lineBreaks: true },

	comma: ",",
	lparen: "(",
	rparen: ")",
	lbrace: "{",
	rbrace: "}",

	comparison_operator: ["==", "!=", "<=", ">=", "<", ">"],
	assignment_operator: ["=", "+=", "-=", "*=", "/="],
	
	logical_operator: ["&&", "||"],
	arithmetic_operator: ["+", "-", "**", "*", "/", "%", "!"],
	
	comment: {
		match: /#[^\n]*/,
		value: (s) => s.substring(1).trimStart(),
	},

	string_literal: {
		match: /"(?:[^\n\\"]|\\["\\ntbfr])*"/,
		value: (s) => JSON.parse(s),
	},
	number_literal: {
		match: /[0-9]+(?:\.[0-9]+)?/,
		value: (s) => Number(s),
	},
	identifier: {
		match: /[a-zA-Z_][a-zA-Z0-9_]*/,
		type: moo.keywords({
			on: "on",
			fn: "fn",
			var: "var",
			if: "if",
			else: "else",
			return: "return",
			true: "true",
			false: "false",
			event: ["house_spawn", "chat"],

			command: "command",
			wait: "wait",
			log: "log",
		}),
	},
});
%}

# ========== PARSER ==========

@lexer lexer

main -> _nl top_levels _nl {% d => { return d[1] } %}

# ---------- Top level

top_levels -> top_level (__nl top_level):*
    {% d => {
        const first = d[0];
        const rest = d[1].map(item => item[1]);
        return [first, ...rest];
    } %}

top_level
    -> function_def {% id %}
    |  event_def {% id %}
    |  statement {% id %}

# ---------- Definitions

function_def -> "fn" __ identifier _ "(" function_args:? ")" _ code_block
    {% d => { return {
        type: "function_def",
        identifier: d[2],
        args: d[5],
        body: d[8]
    }} %}

event_def -> "on" __ event (__ "matches" __ criteria):? _ code_block
    {% d => { return {
        type: "event_def",
        event: d[2],
        criteria: d[3][3],
        body: d[5]
    }} %}

# ---------- Statements

statement
    -> if_statement {% id %}
    |  call_statement {% id %}
    |  var_statement {% id %}
    |  return_statement {% id %}
    |  command_statement {% id %}
    |  wait_statement {% id %}
    |  log_statement {% id %}
    |  comment {% id %}

# --

if_statement -> "if" _ "(" expression ")" _ code_block else_if_statement:* _ else_statement:?
    {% d => { return {
        type: "if_statement",
        condition: d[3],
        body: d[6],
        else_ifs: d[7],
        else: d[9]
    }} %}

else_if_statement -> _ "else" __ "if" _ "(" expression ")" _ code_block
    {% d => { return { 
        type: "else_if_statement",
        condition: d[6],
        body: d[9]
    }} %}
else_statement -> "else" _ code_block {% d => { return { type: "else_statement", body: d[2] } } %}

call_statement -> identifier "(" call_args:? ")"
    {% d => {
        return {
            type: "call_statement",
            callee: d[0],
            args: d[2]
        }
    } %}

var_statement
    -> "var" __ identifier _ %assignment_operator _ expression {% d => { return { type: "var_declaration", identifier: d[2], operator: d[4].value, value: d[6] } } %}
    |  identifier _ %assignment_operator _ expression {% d => { return { type: "var_assignment", identifier: d[0], operator: d[2].value, value: d[4] } } %}

return_statement -> "return" (__ expression):? {% d => { return {type: "return_statement", value: d[2] } } %}
command_statement -> "command" __ expression {% d => { return {type: "command_statement", command: d[2] } } %}
wait_statement -> "wait" __ expression {% d => { return {type: "wait_statement", duration: d[2] } } %}
log_statement -> "log" __ expression {% d => { return {type: "log_statement", message: d[2] } } %}

# # ---------- Components

code_block -> "{" _nl top_levels _nl "}" {% d => { return { type: "code_block", body: d[2] } } %}

function_args -> identifier ("," _ identifier):*
    {% d => {
        const first = d[0];
        const rest = d[1].map(item => item[2]);
        return [first, ...rest];
    } %}

call_args -> expression ("," _ expression):*
    {% d => {
        const first = d[0];
        const rest = d[1].map(item => item[2]);
        return [first, ...rest];
    } %}

criteria -> string {% id %}

# ---------- Expressions

expression -> infix_expr {% id %}

infix_expr
    -> infix_expr _ ("&&"|"||") _ infix_expr {% d => { return { type: "logical_expression", operator: d[2][0].value, left: d[0], right: d[4] } } %}
    |  comparison_expr {% id %}

comparison_expr
    -> comparison_expr _ ("=="|"!="|"<="|">="|"<"|">") _ comparison_expr {% d => { return { type: "binary_expression", operator: d[2][0].value, left: d[0], right: d[4] } } %}
    |  additive_expr {% id %}

additive_expr
    -> additive_expr _ ("+"|"-") _ additive_expr {% d => { return { type: "binary_expression", operator: d[2][0].value, left: d[0], right: d[4] } } %}
    |  multiplicative_expr {% id %}

multiplicative_expr
    -> multiplicative_expr _ ("**"|"*"|"/"|"%") _ multiplicative_expr {% d => { return { type: "logical_expression", operator: d[2][0].value, left: d[0], right: d[4] } } %}
    |  unary_expr {% id %}

unary_expr
    -> ("!"|"-"|"+") base_term {% d => { return { type: "unary_expression", operator: d[0][0].value, argument: d[1] } } %}
    |  base_term {% id %}

base_term
    -> string {% id %}
    |  number {% id %}
    |  boolean {% id %}
    |  identifier {% id %}
    |  call_statement {% id %}       # Function call
    |  "(" expression ")" {% d => { return d[1] } %}   # Parens

# ---------- Lexer Defs

_ -> %ws:* {% d => null %}              # Optional whitespace
__ -> %ws:+ {% d => null %}             # Mandatory whitespace
_nl -> nl_ws_char:* {% d => null %}     # Optional newline
__nl -> nl_ws_char:+ {% d => null %}    # Mandatory newline

nl_ws_char -> %ws | %nl {% id %}

comment -> %comment {% id %}
number -> %number_literal {% d => { return { type: "literal", value: Number(d.join("")), line: d[0].line, col: d[0].col } } %}
string -> %string_literal {% d => { return { type: "literal", value: d.join(""), line: d[0].line, col: d[0].col } } %}
boolean -> ("true"|"false") {% d => { return { type: "literal", value: d.join("") === "true", line: d[0].line, col: d[0].col } } %}
identifier -> %identifier {% d => { return { type: "identifier", value: d.join(""), line: d[0].line, col: d[0].col } } %}
event -> %event {% d => { return { type: "event", event: d[0].value,  } } %}