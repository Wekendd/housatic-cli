// Generated automatically by nearley, version 2.20.1
// http://github.com/Hardmath123/nearley
(function () {
function id(x) { return x[0]; }

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
var grammar = {
    Lexer: lexer,
    ParserRules: [
    {"name": "main", "symbols": ["_nl", "top_levels", "_nl"], "postprocess": d => { return d[1] }},
    {"name": "top_levels$ebnf$1", "symbols": []},
    {"name": "top_levels$ebnf$1$subexpression$1", "symbols": ["__nl", "top_level"]},
    {"name": "top_levels$ebnf$1", "symbols": ["top_levels$ebnf$1", "top_levels$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "top_levels", "symbols": ["top_level", "top_levels$ebnf$1"], "postprocess":  d => {
            const first = d[0];
            const rest = d[1].map(item => item[1]);
            return [first, ...rest];
        } },
    {"name": "top_level", "symbols": ["function_def"], "postprocess": id},
    {"name": "top_level", "symbols": ["event_def"], "postprocess": id},
    {"name": "top_level", "symbols": ["statement"], "postprocess": id},
    {"name": "function_def$ebnf$1", "symbols": ["function_args"], "postprocess": id},
    {"name": "function_def$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "function_def", "symbols": [{"literal":"fn"}, "__", "identifier", "_", {"literal":"("}, "function_def$ebnf$1", {"literal":")"}, "_", "code_block"], "postprocess":  d => { return {
            type: "function_def",
            identifier: d[2],
            args: d[5],
            body: d[8]
        }} },
    {"name": "event_def$ebnf$1$subexpression$1", "symbols": ["__", {"literal":"matches"}, "__", "criteria"]},
    {"name": "event_def$ebnf$1", "symbols": ["event_def$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "event_def$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "event_def", "symbols": [{"literal":"on"}, "__", "event", "event_def$ebnf$1", "_", "code_block"], "postprocess":  d => { return {
            type: "event_def",
            event: d[2],
            criteria: d[3][3],
            body: d[5]
        }} },
    {"name": "statement", "symbols": ["if_statement"], "postprocess": id},
    {"name": "statement", "symbols": ["call_statement"], "postprocess": id},
    {"name": "statement", "symbols": ["var_statement"], "postprocess": id},
    {"name": "statement", "symbols": ["return_statement"], "postprocess": id},
    {"name": "statement", "symbols": ["command_statement"], "postprocess": id},
    {"name": "statement", "symbols": ["wait_statement"], "postprocess": id},
    {"name": "statement", "symbols": ["log_statement"], "postprocess": id},
    {"name": "statement", "symbols": ["comment"], "postprocess": id},
    {"name": "if_statement$ebnf$1", "symbols": []},
    {"name": "if_statement$ebnf$1", "symbols": ["if_statement$ebnf$1", "else_if_statement"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "if_statement$ebnf$2", "symbols": ["else_statement"], "postprocess": id},
    {"name": "if_statement$ebnf$2", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "if_statement", "symbols": [{"literal":"if"}, "_", {"literal":"("}, "expression", {"literal":")"}, "_", "code_block", "if_statement$ebnf$1", "_", "if_statement$ebnf$2"], "postprocess":  d => { return {
            type: "if_statement",
            condition: d[3],
            body: d[6],
            else_ifs: d[7],
            else: d[9]
        }} },
    {"name": "else_if_statement", "symbols": ["_", {"literal":"else"}, "__", {"literal":"if"}, "_", {"literal":"("}, "expression", {"literal":")"}, "_", "code_block"], "postprocess":  d => { return { 
            type: "else_if_statement",
            condition: d[6],
            body: d[9]
        }} },
    {"name": "else_statement", "symbols": [{"literal":"else"}, "_", "code_block"], "postprocess": d => { return { type: "else_statement", body: d[2] } }},
    {"name": "call_statement$ebnf$1", "symbols": ["call_args"], "postprocess": id},
    {"name": "call_statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "call_statement", "symbols": ["identifier", {"literal":"("}, "call_statement$ebnf$1", {"literal":")"}], "postprocess":  d => {
            return {
                type: "call_statement",
                callee: d[0],
                args: d[2]
            }
        } },
    {"name": "var_statement", "symbols": [{"literal":"var"}, "__", "identifier", "_", (lexer.has("assignment_operator") ? {type: "assignment_operator"} : assignment_operator), "_", "expression"], "postprocess": d => { return { type: "var_declaration", identifier: d[2], operator: d[4].value, value: d[6] } }},
    {"name": "var_statement", "symbols": ["identifier", "_", (lexer.has("assignment_operator") ? {type: "assignment_operator"} : assignment_operator), "_", "expression"], "postprocess": d => { return { type: "var_assignment", identifier: d[0], operator: d[2].value, value: d[4] } }},
    {"name": "return_statement$ebnf$1$subexpression$1", "symbols": ["__", "expression"]},
    {"name": "return_statement$ebnf$1", "symbols": ["return_statement$ebnf$1$subexpression$1"], "postprocess": id},
    {"name": "return_statement$ebnf$1", "symbols": [], "postprocess": function(d) {return null;}},
    {"name": "return_statement", "symbols": [{"literal":"return"}, "return_statement$ebnf$1"], "postprocess": d => { return {type: "return_statement", value: d[2] } }},
    {"name": "command_statement", "symbols": [{"literal":"command"}, "__", "expression"], "postprocess": d => { return {type: "command_statement", command: d[2] } }},
    {"name": "wait_statement", "symbols": [{"literal":"wait"}, "__", "expression"], "postprocess": d => { return {type: "wait_statement", duration: d[2] } }},
    {"name": "log_statement", "symbols": [{"literal":"log"}, "__", "expression"], "postprocess": d => { return {type: "log_statement", message: d[2] } }},
    {"name": "code_block", "symbols": [{"literal":"{"}, "_nl", "top_levels", "_nl", {"literal":"}"}], "postprocess": d => { return { type: "code_block", body: d[2] } }},
    {"name": "function_args$ebnf$1", "symbols": []},
    {"name": "function_args$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_", "identifier"]},
    {"name": "function_args$ebnf$1", "symbols": ["function_args$ebnf$1", "function_args$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "function_args", "symbols": ["identifier", "function_args$ebnf$1"], "postprocess":  d => {
            const first = d[0];
            const rest = d[1].map(item => item[2]);
            return [first, ...rest];
        } },
    {"name": "call_args$ebnf$1", "symbols": []},
    {"name": "call_args$ebnf$1$subexpression$1", "symbols": [{"literal":","}, "_", "expression"]},
    {"name": "call_args$ebnf$1", "symbols": ["call_args$ebnf$1", "call_args$ebnf$1$subexpression$1"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "call_args", "symbols": ["expression", "call_args$ebnf$1"], "postprocess":  d => {
            const first = d[0];
            const rest = d[1].map(item => item[2]);
            return [first, ...rest];
        } },
    {"name": "criteria", "symbols": ["string"], "postprocess": id},
    {"name": "expression", "symbols": ["infix_expr"], "postprocess": id},
    {"name": "infix_expr$subexpression$1", "symbols": [{"literal":"&&"}]},
    {"name": "infix_expr$subexpression$1", "symbols": [{"literal":"||"}]},
    {"name": "infix_expr", "symbols": ["infix_expr", "_", "infix_expr$subexpression$1", "_", "infix_expr"], "postprocess": d => { return { type: "logical_expression", operator: d[2][0].value, left: d[0], right: d[4] } }},
    {"name": "infix_expr", "symbols": ["comparison_expr"], "postprocess": id},
    {"name": "comparison_expr$subexpression$1", "symbols": [{"literal":"=="}]},
    {"name": "comparison_expr$subexpression$1", "symbols": [{"literal":"!="}]},
    {"name": "comparison_expr$subexpression$1", "symbols": [{"literal":"<="}]},
    {"name": "comparison_expr$subexpression$1", "symbols": [{"literal":">="}]},
    {"name": "comparison_expr$subexpression$1", "symbols": [{"literal":"<"}]},
    {"name": "comparison_expr$subexpression$1", "symbols": [{"literal":">"}]},
    {"name": "comparison_expr", "symbols": ["comparison_expr", "_", "comparison_expr$subexpression$1", "_", "comparison_expr"], "postprocess": d => { return { type: "binary_expression", operator: d[2][0].value, left: d[0], right: d[4] } }},
    {"name": "comparison_expr", "symbols": ["additive_expr"], "postprocess": id},
    {"name": "additive_expr$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "additive_expr$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "additive_expr", "symbols": ["additive_expr", "_", "additive_expr$subexpression$1", "_", "additive_expr"], "postprocess": d => { return { type: "binary_expression", operator: d[2][0].value, left: d[0], right: d[4] } }},
    {"name": "additive_expr", "symbols": ["multiplicative_expr"], "postprocess": id},
    {"name": "multiplicative_expr$subexpression$1", "symbols": [{"literal":"**"}]},
    {"name": "multiplicative_expr$subexpression$1", "symbols": [{"literal":"*"}]},
    {"name": "multiplicative_expr$subexpression$1", "symbols": [{"literal":"/"}]},
    {"name": "multiplicative_expr$subexpression$1", "symbols": [{"literal":"%"}]},
    {"name": "multiplicative_expr", "symbols": ["multiplicative_expr", "_", "multiplicative_expr$subexpression$1", "_", "multiplicative_expr"], "postprocess": d => { return { type: "logical_expression", operator: d[2][0].value, left: d[0], right: d[4] } }},
    {"name": "multiplicative_expr", "symbols": ["unary_expr"], "postprocess": id},
    {"name": "unary_expr$subexpression$1", "symbols": [{"literal":"!"}]},
    {"name": "unary_expr$subexpression$1", "symbols": [{"literal":"-"}]},
    {"name": "unary_expr$subexpression$1", "symbols": [{"literal":"+"}]},
    {"name": "unary_expr", "symbols": ["unary_expr$subexpression$1", "base_term"], "postprocess": d => { return { type: "unary_expression", operator: d[0][0].value, argument: d[1] } }},
    {"name": "unary_expr", "symbols": ["base_term"], "postprocess": id},
    {"name": "base_term", "symbols": ["string"], "postprocess": id},
    {"name": "base_term", "symbols": ["number"], "postprocess": id},
    {"name": "base_term", "symbols": ["boolean"], "postprocess": id},
    {"name": "base_term", "symbols": ["identifier"], "postprocess": id},
    {"name": "base_term", "symbols": ["call_statement"], "postprocess": id},
    {"name": "base_term", "symbols": [{"literal":"("}, "expression", {"literal":")"}], "postprocess": d => { return d[1] }},
    {"name": "_$ebnf$1", "symbols": []},
    {"name": "_$ebnf$1", "symbols": ["_$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_", "symbols": ["_$ebnf$1"], "postprocess": d => null},
    {"name": "__$ebnf$1", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "__$ebnf$1", "symbols": ["__$ebnf$1", (lexer.has("ws") ? {type: "ws"} : ws)], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__", "symbols": ["__$ebnf$1"], "postprocess": d => null},
    {"name": "_nl$ebnf$1", "symbols": []},
    {"name": "_nl$ebnf$1", "symbols": ["_nl$ebnf$1", "nl_ws_char"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "_nl", "symbols": ["_nl$ebnf$1"], "postprocess": d => null},
    {"name": "__nl$ebnf$1", "symbols": ["nl_ws_char"]},
    {"name": "__nl$ebnf$1", "symbols": ["__nl$ebnf$1", "nl_ws_char"], "postprocess": function arrpush(d) {return d[0].concat([d[1]]);}},
    {"name": "__nl", "symbols": ["__nl$ebnf$1"], "postprocess": d => null},
    {"name": "nl_ws_char", "symbols": [(lexer.has("ws") ? {type: "ws"} : ws)]},
    {"name": "nl_ws_char", "symbols": [(lexer.has("nl") ? {type: "nl"} : nl)], "postprocess": id},
    {"name": "comment", "symbols": [(lexer.has("comment") ? {type: "comment"} : comment)], "postprocess": id},
    {"name": "number", "symbols": [(lexer.has("number_literal") ? {type: "number_literal"} : number_literal)], "postprocess": d => { return { type: "literal", value: Number(d.join("")), line: d[0].line, col: d[0].col } }},
    {"name": "string", "symbols": [(lexer.has("string_literal") ? {type: "string_literal"} : string_literal)], "postprocess": d => { return { type: "literal", value: d.join(""), line: d[0].line, col: d[0].col } }},
    {"name": "boolean$subexpression$1", "symbols": [{"literal":"true"}]},
    {"name": "boolean$subexpression$1", "symbols": [{"literal":"false"}]},
    {"name": "boolean", "symbols": ["boolean$subexpression$1"], "postprocess": d => { return { type: "literal", value: d.join("") === "true", line: d[0].line, col: d[0].col } }},
    {"name": "identifier", "symbols": [(lexer.has("identifier") ? {type: "identifier"} : identifier)], "postprocess": d => { return { type: "identifier", value: d.join(""), line: d[0].line, col: d[0].col } }},
    {"name": "event", "symbols": [(lexer.has("event") ? {type: "event"} : event)], "postprocess": d => { return { type: "event", event: d[0].value,  } }}
]
  , ParserStart: "main"
}
if (typeof module !== 'undefined'&& typeof module.exports !== 'undefined') {
   module.exports = grammar;
} else {
   window.grammar = grammar;
}
})();
