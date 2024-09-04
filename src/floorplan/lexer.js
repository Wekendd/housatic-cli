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
			event: ["chat"],

			command: "command",
			wait: "wait",
			log: "log",
		}),
	},
});

module.exports = {
	lexer
};
