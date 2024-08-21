const moo = require("moo");

let lexer = moo.compile({
	ws: /[ \t]+/,
	nl: { match: /(?:\r\n|\r|\n)/, lineBreaks: true },

	comma: ",",
	lparen: "(",
	rparen: ")",
	lbrace: "{",
	rbrace: "}",

	add: "+",
	sub: "-",
	mul: "*",
	div: "/",
	mod: "%",

	assignment: "=",

	equ_comp: "==",
	lth_comp: "<",
	lte_comp: "<=",
	gth_comp: ">",
	gte_comp: ">=",

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
			perm: "perm",
			temp: "temp",
			on: "on",
			fn: "fn",
			run: "run",
			wait: "wait",
			log: "log",
			return: "return",
			true: "true",
			false: "false",
		}),
	},
});

function tokenStart(token) {
	return {
		line: token.line,
		col: token.col - 1,
	};
}

function tokenEnd(token) {
	const lastNewLine = token.text.lastIndexOf("\n");
	if (lastNewLine !== -1) {
		throw new Error("Unsupported case: token with line breaks");
	}
	return {
		line: token.line,
		col: token.col + token.text.length - 1,
	};
}

function convertToken(token) {
	return {
		type: token.type,
		value: token.value,
		start: tokenStart(token),
		end: tokenEnd(token),
	};
}

function convertTokenId(data) {
	return convertToken(data[0]);
}

module.exports = {
	lexer,
	tokenStart,
	tokenEnd,
	convertToken,
	convertTokenId,
};
