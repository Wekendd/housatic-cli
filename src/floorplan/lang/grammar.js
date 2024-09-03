// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

const { lexer, tokenStart, tokenEnd, convertToken, convertTokenId } = require("../lexer.js");

function toNumber(d) {
    return parseFloat(d[0]);
}
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["top_levels"]},
    {"name": "top_levels$ebnf$1", "symbols": []},
    {"name": "top_levels$ebnf$1$subexpression$1", "symbols": ["__nl", "top_level"]},
    {"name": "top_levels$ebnf$1", "symbols": ["top_levels$ebnf$1", "top_levels$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "top_levels", "symbols": ["top_level", "top_levels$ebnf$1"]},
    {"name": "top_level", "symbols": ["function_def"]},
    {"name": "top_level", "symbols": ["event_def"]},
    {"name": "top_level", "symbols": ["statement"]},
    {"name": "function_def$ebnf$1", "symbols": ["args"], "postprocess": id},
    {"name": "function_def$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "function_def", "symbols": [{"literal":"fn"}, "__", "identifier", "_", {"literal":"("}, "function_def$ebnf$1", {"literal":")"}, "_", "code_block"]},
    {"name": "event_def$ebnf$1$subexpression$1", "symbols": ["__", {"literal":"matches"}, "__", "criteria"]},
    {"name": "event_def$ebnf$1", "symbols": ["event_def$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "event_def$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "event_def", "symbols": [{"literal":"on"}, "__", (lexer.has("event") ? {type: "event"} : event), "event_def$ebnf$1", "_", "code_block"]},
    {"name": "statement", "symbols": ["if_statement"]},
    {"name": "statement", "symbols": ["call_statement"]},
    {"name": "statement", "symbols": ["var_statement"]},
    {"name": "statement", "symbols": ["return_statement"]},
    {"name": "statement", "symbols": ["command_statement"]},
    {"name": "statement", "symbols": ["wait_statement"]},
    {"name": "statement", "symbols": ["log_statement"]},
    {"name": "statement", "symbols": ["comment"]},
    {"name": "if_statement$ebnf$1", "symbols": []},
    {"name": "if_statement$ebnf$1$subexpression$1", "symbols": ["_nl", {"literal":"else"}, "__", {"literal":"if"}, "_", {"literal":"("}, "expression", {"literal":")"}, "_", "code_block"]},
    {"name": "if_statement$ebnf$1", "symbols": ["if_statement$ebnf$1", "if_statement$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "if_statement$ebnf$2$subexpression$1", "symbols": ["_nl", {"literal":"else"}, "_", "code_block"]},
    {"name": "if_statement$ebnf$2", "symbols": ["if_statement$ebnf$2$subexpression$1"], "postprocess": id},
    {"name": "if_statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "if_statement", "symbols": [{"literal":"if"}, "_", {"literal":"("}, "expression", {"literal":")"}, "_", "code_block", "if_statement$ebnf$1", "if_statement$ebnf$2"]},
    {"name": "call_statement$ebnf$1$subexpression$1$ebnf$1", "symbols": []},
    {"name": "call_statement$ebnf$1$subexpression$1$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_", "expression"]},
    {"name": "call_statement$ebnf$1$subexpression$1$ebnf$1", "symbols": ["call_statement$ebnf$1$subexpression$1$ebnf$1", "call_statement$ebnf$1$subexpression$1$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "call_statement$ebnf$1$subexpression$1", "symbols": ["expression", "call_statement$ebnf$1$subexpression$1$ebnf$1"]},
    {"name": "call_statement$ebnf$1", "symbols": ["call_statement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "call_statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "call_statement", "symbols": ["identifier", {"literal":"("}, "call_statement$ebnf$1", {"literal":")"}]},
    {"name": "var_statement", "symbols": [{"literal":"var"}, "__", "identifier", "_", {"literal":"="}, "_", "expression"]},
    {"name": "var_statement", "symbols": ["identifier", "_", /["=" "+=" "-=" "**=" "*=" "/=" "%="]/, "_", "expression"]},
    {"name": "return_statement$ebnf$1$subexpression$1", "symbols": ["__", "expression"]},
    {"name": "return_statement$ebnf$1", "symbols": ["return_statement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "return_statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "return_statement", "symbols": [{"literal":"return"}, "return_statement$ebnf$1"]},
    {"name": "command_statement", "symbols": [{"literal":"command"}, "__", "expression"]},
    {"name": "wait_statement", "symbols": [{"literal":"wait"}, "__", "expression"]},
    {"name": "log_statement", "symbols": [{"literal":"log"}, "__", "expression"]},
    {"name": "code_block", "symbols": [{"literal":"{"}, "_nl", "top_levels", "_nl", {"literal":"}"}]},
    {"name": "args$ebnf$1", "symbols": []},
    {"name": "args$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_", "identifier"]},
    {"name": "args$ebnf$1", "symbols": ["args$ebnf$1", "args$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "args", "symbols": ["identifier", "args$ebnf$1"]},
    {"name": "criteria", "symbols": ["string"]},
    {"name": "expression", "symbols": ["infix_expr"]},
    {"name": "infix_expr", "symbols": ["infix_expr", "_", {"literal":"||"}, "_", "infix_expr"]},
    {"name": "infix_expr", "symbols": ["infix_expr", "_", {"literal":"&&"}, "_", "infix_expr"]},
    {"name": "infix_expr", "symbols": ["comparison_expr"]},
    {"name": "comparison_expr", "symbols": ["comparison_expr", "_", {"literal":"=="}, "_", "comparison_expr"]},
    {"name": "comparison_expr", "symbols": ["comparison_expr", "_", {"literal":"!="}, "_", "comparison_expr"]},
    {"name": "comparison_expr", "symbols": ["additive_expr"]},
    {"name": "additive_expr", "symbols": ["additive_expr", "_", {"literal":"+"}, "_", "additive_expr"]},
    {"name": "additive_expr", "symbols": ["additive_expr", "_", {"literal":"-"}, "_", "additive_expr"]},
    {"name": "additive_expr", "symbols": ["multiplicative_expr"]},
    {"name": "multiplicative_expr", "symbols": ["multiplicative_expr", "_", {"literal":"**"}, "_", "multiplicative_expr"]},
    {"name": "multiplicative_expr", "symbols": ["multiplicative_expr", "_", {"literal":"*"}, "_", "multiplicative_expr"]},
    {"name": "multiplicative_expr", "symbols": ["multiplicative_expr", "_", {"literal":"/"}, "_", "multiplicative_expr"]},
    {"name": "multiplicative_expr", "symbols": ["multiplicative_expr", "_", {"literal":"%"}, "_", "multiplicative_expr"]},
    {"name": "multiplicative_expr", "symbols": ["base_term"]},
    {"name": "base_term", "symbols": [{"literal":"!"}, "base_term"]},
    {"name": "base_term", "symbols": [{"literal":"-"}, "base_term"]},
    {"name": "base_term", "symbols": ["call_statement"]},
    {"name": "base_term", "symbols": [{"literal":"("}, "expression", {"literal":")"}]},
    {"name": "base_term", "symbols": ["identifier"]},
    {"name": "base_term", "symbols": ["number"]},
    {"name": "base_term", "symbols": ["string"]},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"]},
    {"name": "__$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"]},
    {"name": "_nl$ebnf$1", "symbols": []},
    {"name": "_nl$ebnf$1", "symbols": ["_nl$ebnf$1", "nl_ws_char"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_nl", "symbols": ["_nl$ebnf$1"]},
    {"name": "__nl$ebnf$1", "symbols": ["nl_ws_char"]},
    {"name": "__nl$ebnf$1", "symbols": ["__nl$ebnf$1", "nl_ws_char"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__nl", "symbols": ["__nl$ebnf$1"]},
    {"name": "nl_ws_char", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "nl_ws_char", "symbols": [(lexer.has("nl") ? {type: "nl"} : nl)]},
    {"name": "comment", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)]},
    {"name": "number", "symbols": [(lexer.has("number_literal") ? {type: "number_literal"} : number_literal)]},
    {"name": "string", "symbols": [(lexer.has("string_literal") ? {type: "string_literal"} : string_literal)]},
    {"name": "identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)]}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
