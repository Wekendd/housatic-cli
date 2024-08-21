@{%
const { lexer, tokenStart, tokenEnd, convertToken, convertTokenId } = require("./lexer.js");

function toNumber(d) {
    return parseFloat(d[0]);
}
%}

@lexer lexer

main -> _ml top_level_definitions _ml

top_level_definitions
    -> top_level_definition _ml top_level_definitions
        {%
            d => [d[0], ...d[2]]
        %}
    | top_level_definition
        {%
            d => [d[0]]
        %}

top_level_definition
    -> function_def {% id %}
    |  event_def    {% id %}
    |  executable_statements

# --------------------------------------------------- #

function_def
    -> "fn" _ identifier _ "(" _ parameter_list _ ")" _ code_block
        {%
            d => ({
                type: "function_def",
                name: d[2],
                parameters: d[6],
                body: d[10],
                start: tokenStart(d[0]),
                end: d[10].end
            })
        %}

event_def
    -> "on" _ identifier _ "(" _ parameter_list _ ")" _ code_block
        {%
            d => ({
                type: "event_def",
                name: d[2],
                parameters: d[6],
                body: d[10],
                start: tokenStart(d[0]),
                end: d[10].end
            })
        %}

# --------------------------------------------------- #

parameter_list
    -> null        {% () => [] %}
    | identifier   {% d => [d[0]] %}
    | identifier _ "," _ parameter_list
        {%
            d => [d[0], ...d[4]]
        %}

code_block -> "{" _ml executable_statements _ml "}"
    {%
        (d) => ({
            type: "code_block",
            statements: d[2],
            start: tokenStart(d[0]),
            end: tokenEnd(d[4])
        })
    %}

# --------------------------------------------------- #

executable_statements
    -> executable_statement _ml executable_statements {% d => [d[0], ...d[2]] %}
    |  executable_statement {% d => [d[0]] %}

executable_statement
   -> return_statement     {% id %}
   |  var_assignment       {% id %}
   |  line_comment         {% id %}

# --------------------------------------------------- #

return_statement
   -> "return" __ expression
       {%
           d => ({
               type: "return_statement",
               value: d[2],
               start: tokenStart(d[0]),
               end: d[2].end
           })
       %}

var_assignment
    -> perm_assignment
    |  temp_assignment

# --------------------------------------------------- #

perm_assignment
    -> "perm" _ identifier _ "=" _ expression
        {%
            d => ({
                type: "perm_assignment",
                var_name: d[0],
                value: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

temp_assignment
-> "temp" _ identifier _ "=" _ expression
        {%
            d => ({
                type: "temp_assignment",
                var_name: d[0],
                value: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

# --------------------------------------------------- #

expression -> boolean_expression {% id %}

boolean_expression
    -> comparison_expression {% id %}
    |  comparison_expression _ boolean_operator _ boolean_expression
        {%
            d => ({
                type: "binary_operation",
                operator: convertToken(d[2]),
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

boolean_operator
    -> "&&" {% id %}
    |  "||" {% id %}

comparison_expression
    -> additive_expression {% id %}
    |  additive_expression _ comparison_operator _ comparison_expression
        {%
            d => ({
                type: "binary_operation",
                operator: d[2],
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

comparison_operator
    -> ">"  {% convertTokenId %}
    |  ">=" {% convertTokenId %}
    |  "<"  {% convertTokenId %}
    |  "<=" {% convertTokenId %}
    |  "==" {% convertTokenId %}

additive_expression
    -> multiplicative_expression {% id %}
    |  multiplicative_expression _ [+-] _ additive_expression
        {%
            d => ({
                type: "binary_operation",
                operator: convertToken(d[2]),
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

multiplicative_expression
    -> unary_expression     {% id %}
    |  unary_expression _ [*/%] _ multiplicative_expression
        {%
            d => ({
                type: "binary_operation",
                operator: convertToken(d[2]),
                left: d[0],
                right: d[4],
                start: d[0].start,
                end: d[4].end
            })
        %}

unary_expression
    -> number               {% id %}
    |  identifier
        {%
            d => ({
                type: "var_reference",
                var_name: d[0],
                start: d[0].start,
                end: d[0].end
            })
        %}
    # |  call_expression    {% id %}
    |  string_literal     {% id %}
    |  boolean_literal    {% id %}
    # |  list_literal       {% id %}
    # |  dictionary_literal {% id %}
    |  boolean_literal    {% id %}
    # |  indexed_access     {% id %}
    |  "(" expression ")"
        {%
            data => data[1]
        %}

boolean_literal
    -> "true"
        {%
            d => ({
                type: "boolean_literal",
                value: true,
                start: tokenStart(d[0]),
                end: tokenEnd(d[0])
            })
        %}
    |  "false"
        {%
            d => ({
                type: "boolean_literal",
                value: false,
                start: tokenStart(d[0]),
                end: tokenEnd(d[0])
            })
        %}

__ -> %ws:+

_ -> %ws:*

_ml -> multi_line_ws_char:*

multi_line_ws_char
    -> %ws
    |  %nl

line_comment -> %comment {% convertTokenId %}

string_literal -> %string_literal {% convertTokenId %}

number -> %number_literal {% convertTokenId %}

identifier -> %identifier {% convertTokenId %}