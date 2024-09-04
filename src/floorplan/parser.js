const fs = require("fs");

const nearley = require("nearley");
const grammar = require("./lang/grammar.js");
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));

parser.feed(fs.readFileSync("./test/test.fp", "utf8"));

function interpret(ast, context = {}) {
	let result;

	for (const line of ast) {
        // console.log(line);
		result = interpret_line(line, context);

		if ((line.type === "return_statement")) {
			break;
		}
	}

	return result;
}

function interpret_line(line, context = {}) {
	switch (line.type) {
		case "function_def":
			context[line.identifier.value] = function (...args) {
				const localContext = { ...context };
				line.args.forEach((arg, i) => {
					localContext[arg.value] = args[i];
				});
				return interpret_line(line.body, localContext);
			};
			break;

		case "var_declaration":
			context[line.identifier.value] = interpret_line(line.value, context);
			break;

		case "var_assignment":
			if (context[line.identifier.value]) {
				context[line.identifier.value] = interpret_line(line.value, context);
			} else {
				throw new Error(`Variable ${line.identifier.value} is not defined (line ${line.identifier.line}, column ${line.identifier.col})`);
			}
			break;

		case "return_statement":
			return interpret_line(line.value, context);

		case "log_statement":
            const message = interpret_line(line.message, context);
			console.log(message);
            break;

		case "call_statement":
			const fn = context[line.callee.value];
			if (fn) {
				const args = line.args ? line.args.map((arg) => interpret_line(arg, context)) : [];
				return fn(...args);
			} else {
				throw new Error(`Function  ${line.callee.value} is not defined (line ${line.callee.line}, column ${line.callee.col})`);
			}

		case "literal":
            return line.value;

		case "identifier":
			if (context[line.value] !== undefined) {
				return context[line.value];
			} else {
				throw new Error(`Variable ${line.value} is not defined`);
			}

		case "binary_expression":
		case "logical_expression":
			const left = interpret_line(line.left, context);
			const right = interpret_line(line.right, context);
			switch (line.operator) {
				case "==": return left == right;
				case "!=": return left != right;
				case "<=": return left <= right;
				case ">=": return left >= right;
				case "<": return left < right;
				case ">": return left > right;
				case "+":
                    if (typeof left === 'string' || typeof right === 'string') {
                        return String(left) + String(right);  // Coerce to string if either side is a string
                    } else {
                        return left + right;  // Number addition
                    }
				case "-": return left - right;
				case "*": return left * right;
                case "**": return left ** right;
				case "/": return left / right;
				case "%": return left % right;

				case "&&": return left && right;
				case "||": return left || right;
			}

		case "unary_expression":
			const argument = interpret_line(line.argument, context);
			switch (line.operator) {
				case "!": return !argument;
				case "-": return -argument;
				case "+": return +argument;
			}

		case "if_statement":
			if (interpret_line(line.condition, context)) {
				return interpret_line(line.body, context);
			}
			for (const else_if of line.else_ifs) {
				if (interpret_line(else_if.condition, context)) {
					return interpret_line(else_if.body, context);
				}
			}
			if (line.else) {
				return interpret_line(line.else.body, context);
			}
			break;

		case "code_block":
			let result;
			for (const stmt of line.body) {
				result = interpret_line(stmt, context);
				if (stmt.type === "return_statement") {
					break;
				}
			}
			return result;

        case "comment":
            break;

		default:
			throw new Error(`Unknown AST node type: ${line.type}`);
	}
}

const ast = parser.results[0];
console.log(ast[3].message.right);

interpret(ast);
