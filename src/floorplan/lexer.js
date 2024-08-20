const fs = require("fs");
const moo = require("moo");

let lexer = moo.states({
	main: {
		WS: /[ \t]+/,
		NL: { match: /(?:\r\n|\r|\n)/, lineBreaks: true },
		comment: /(?:\/\/.*?$)|(?:\/\*[\s\S]*?\*\/)/,

		lbrace: { match: "{", push: "main" },
		rbrace: { match: "}", pop: 1 },
		rparen: "(",
		lparen: ")",

		lit_start: { match: '"', push: "literal" },
		number: /[0-9]+(?:\.[0-9]+)?/,

		identifier: {
			match: /[a-zA-Z_][a-zA-Z0-9_]*/,
			type: moo.keywords({
				keyword: ["perm", "temp", "on", "matches", "fn", "run", "wait", "log", "return"],
			}),
		},
		operator: ["=", "==", ">", "<", ">=", "<=", "!=", "!", "||", "&&", "%", "%=", "+", "++", "+=", "-", "--", "-=", "*", "*=", "/", "/=", "**", "**="],
	},
	literal: {
		lit_interp: { match: "${", push: "main" },
		lit_escape: /\\./,
		lit_end: { match: '"', pop: 1 },
		lit_const: { match: /(?:[^$"]|\$(?!\{))+/, lineBreaks: true },
	},
});

let sourceCode = fs.readFileSync("./test/test.fp", "utf8");
lexer.reset(sourceCode);

// const tokens = console.log(Array.from(lexer))

for (let token of lexer) {
	if (token.type == "NL") console.log("");
	if (token.type == "WS" || token.type == "NL" || token.type == "comment") continue;
	console.log(`${token.type}: "${token.value}"`);
}
