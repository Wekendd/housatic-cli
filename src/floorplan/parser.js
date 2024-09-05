const fs = require("fs");

// Parser
const nearley = require("nearley");
const grammar = require("./grammar.js");
const parser = new nearley.Parser(nearley.Grammar.fromCompiled(grammar));
parser.feed(fs.readFileSync("./test/test.fp", "utf8"));


// Interpreter
async function interpret(ast, context = {}) {
	let result;

	for (const line of ast) {
        // console.log(line);
		result = await interpret_line(line, context);

		if ((line.type === "return_statement")) {
			break;
		}
	}

	return result;
}

async function interpret_line(line, context = {}) {
	switch (line.type) {
		case "function_def":
			context[line.identifier.value] = async (...args) => {
				const localContext = { ...context };
				line.args.forEach((arg, i) => {
					localContext[arg.value] = args[i];
				});
				return await interpret_line(line.body, localContext);
			};
			break;

        case "event_def":
            break;

		case "var_declaration":
			context[line.identifier.value] = await interpret_line(line.value, context);
			break;

		case "var_assignment":
			if (context[line.identifier.value]) {
				context[line.identifier.value] = await interpret_line(line.value, context);
			} else {
				throw new Error(`Variable ${line.identifier.value} is not defined (line ${line.identifier.line}, column ${line.identifier.col})`);
			}
			break;

		case "return_statement":
			return await interpret_line(line.value, context);

		case "log_statement":
            const message = await interpret_line(line.message, context);
			console.log(message);
            break;

		case "call_statement":
			const fn = context[line.callee.value];
			if (fn) {
				const args = line.args ? line.args.map(async (arg) => await interpret_line(arg, context)) : [];
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
			const left = await interpret_line(line.left, context);
			const right = await interpret_line(line.right, context);
			switch (line.operator) {
				case "==": return left == right;
				case "!=": return left != right;
				case "<=": return left <= right;
				case ">=": return left >= right;
				case "<": return left < right;
				case ">": return left > right;
				case "+": return left + right
				case "-": return left - right;
				case "*": return left * right;
                case "**": return left ** right;
				case "/": return left / right;
				case "%": return left % right;

				case "&&": return left && right;
				case "||": return left || right;
			}

		case "unary_expression":
			const argument = await interpret_line(line.argument, context);
			switch (line.operator) {
				case "!": return !argument;
				case "-": return -argument;
				case "+": return +argument;
			}

		case "if_statement":
			if (await interpret_line(line.condition, context)) {
				return await interpret_line(line.body, context);
			}
			for (const else_if of line.else_ifs) {
				if (await interpret_line(else_if.condition, context)) {
					return await interpret_line(else_if.body, context);
				}
			}
			if (line.else) {
				return await interpret_line(line.else.body, context);
			}
			break;

		case "code_block":
			let result;
			for (const stmt of line.body) {
				result = await interpret_line(stmt, context);
				if (stmt.type === "return_statement") {
					break;
				}
			}
			return result;

        case "command_statement":
            const command = await interpret_line(line.command, context);
            console.log(`Running command: '${command}'`);
            break;

        case "wait_statement":
            const ms = await interpret_line(line.duration, context);
            console.log(`Waiting ${ms}ms`);
            await sleep(ms);

        case "comment":
            break;

		default:
			throw new Error(`Unknown AST node type: ${line.type}`);
	}
}

const sleep = ms => new Promise(r => setTimeout(r, ms));

const ast = parser.results[0];
console.log(ast);

interpret(ast);
