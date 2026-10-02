import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import ts from '@typescript/compiler-api'

/** A source registration, not a recorded execution result. */
export interface TestCase {
  file: string
  line: number
  title: string
  inactive: boolean
  conditional: boolean
  ids: string[]
}

type Value = string | readonly Value[]
type Bindings = Map<string, Value>
const requirement = /(?<![\w.${}-])[a-z0-9-]+(?:\.[a-z0-9-]+)?\.\d+(?![\w.-])/g

/** Read static registrations without counting comments or strings in assertions. */
export function parseTests(source: string, file = 'fixture.test.ts'): TestCase[] {
  const tree = ts.createSourceFile(file, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX)
  const out: TestCase[] = []
  const helpers = new Map<string, ts.FunctionDeclaration>()
  const executing = new Set<string>()
  function findHelpers(node: ts.Node) {
    if (ts.isFunctionDeclaration(node) && node.name) helpers.set(node.name.text, node)
    ts.forEachChild(node, findHelpers)
  }
  findHelpers(tree)
  const names = new Map<string, string>([
    ['test', 'test'],
    ['it', 'test'],
    ['spec', 'test'],
    ['describe', 'describe'],
  ])
  for (const statement of tree.statements) {
    if (!ts.isImportDeclaration(statement)) continue
    const bindings = statement.importClause?.namedBindings
    if (bindings && ts.isNamedImports(bindings)) {
      for (const binding of bindings.elements) {
        const original = (binding.propertyName ?? binding.name).text
        if (['test', 'it', 'spec', 'describe'].includes(original))
          names.set(binding.name.text, original === 'describe' ? 'describe' : 'test')
      }
    }
  }
  function value(node: ts.Node | undefined, bindings: Bindings): Value | undefined {
    if (!node) return
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text
    // Dynamic titles are retained as source templates for stable audit references,
    // not evaluated or claimed to match a particular runtime parameter value.
    if (ts.isTemplateExpression(node)) {
      const spans = node.templateSpans.map((span) => value(span.expression, bindings))
      if (spans.every((span) => typeof span === 'string'))
        return (
          node.head.text +
          node.templateSpans.map((span, i) => spans[i] + span.literal.text).join('')
        )
      return node.getText(tree).slice(1, -1)
    }
    if (ts.isIdentifier(node)) return bindings.get(node.text)
    if (
      ts.isAsExpression(node) ||
      ts.isParenthesizedExpression(node) ||
      ts.isSatisfiesExpression(node)
    )
      return value(node.expression, bindings)
    if (ts.isArrayLiteralExpression(node)) {
      const elements = node.elements.map((element) => value(element, bindings))
      if (elements.every((element): element is Value => element !== undefined)) return elements
    }
  }
  function chain(node: ts.Expression): string[] {
    if (ts.isIdentifier(node)) return [node.text]
    if (ts.isPropertyAccessExpression(node)) return [...chain(node.expression), node.name.text]
    if (ts.isCallExpression(node)) return chain(node.expression)
    return []
  }
  function bind(name: ts.BindingName, item: Value, bindings: Bindings) {
    if (ts.isIdentifier(name)) bindings.set(name.text, item)
    else if (ts.isArrayBindingPattern(name) && Array.isArray(item))
      name.elements.forEach((element, i) => {
        if (ts.isBindingElement(element) && item[i] !== undefined)
          bind(element.name, item[i]!, bindings)
      })
  }
  function walk(node: ts.Node, bindings: Bindings, inactive = false, conditional = false) {
    // Bodies are entered explicitly only through describe or a called declaration helper.
    if (ts.isFunctionDeclaration(node) || ts.isFunctionExpression(node) || ts.isArrowFunction(node))
      return
    if (ts.isVariableDeclaration(node) && node.initializer) {
      const item = value(node.initializer, bindings)
      if (item !== undefined) bind(node.name, item, bindings)
    }
    if (ts.isForOfStatement(node)) {
      const items = value(node.expression, bindings)
      const declaration = ts.isVariableDeclarationList(node.initializer)
        ? node.initializer.declarations[0]
        : undefined
      if (Array.isArray(items) && declaration) {
        for (const item of items) {
          const scope = new Map(bindings)
          bind(declaration.name, item, scope)
          walk(node.statement, scope, inactive, conditional)
        }
        return
      }
    }
    if (ts.isIfStatement(node)) {
      walk(node.thenStatement, new Map(bindings), inactive, true)
      if (node.elseStatement) walk(node.elseStatement, new Map(bindings), inactive, true)
      return
    }
    if (ts.isCallExpression(node)) {
      const parts = chain(node.expression)
      const kind = names.get(parts[0] ?? '')
      const title = value(node.arguments[0], bindings)
      const body = node.arguments.find(
        (arg) => ts.isArrowFunction(arg) || ts.isFunctionExpression(arg)
      )
      const skipped = inactive || parts.some((part) => ['skip', 'todo', 'fixme'].includes(part))
      const uncertain =
        conditional || parts.some((part) => ['skipIf', 'runIf', 'fails', 'failing'].includes(part))
      if (kind && typeof title === 'string' && (body || skipped)) {
        if (kind === 'test') {
          out.push({
            file,
            line: tree.getLineAndCharacterOfPosition(node.getStart(tree)).line + 1,
            title,
            inactive: skipped,
            conditional: uncertain,
            ids: [...new Set(title.match(requirement) ?? [])],
          })
          return // Never interpret calls inside a test body as test registrations.
        }
        if (body && (ts.isArrowFunction(body) || ts.isFunctionExpression(body)))
          walk(body.body, new Map(bindings), skipped, uncertain)
        return
      }
      if (ts.isIdentifier(node.expression)) {
        const name = node.expression.text
        const helper = helpers.get(name)
        if (helper?.body && !executing.has(name)) {
          const scope = new Map(bindings)
          helper.parameters.forEach((parameter, index) => {
            const argument = value(node.arguments[index], bindings)
            if (argument !== undefined) bind(parameter.name, argument, scope)
          })
          executing.add(name)
          walk(helper.body, scope, inactive, conditional)
          executing.delete(name)
          return
        }
      }
    }
    ts.forEachChild(node, (child) => walk(child, bindings, inactive, conditional))
  }
  walk(tree, new Map())
  return out
}

export function readCases(directory: string): TestCase[] {
  const out: TestCase[] = []
  for (const entry of readdirSync(directory, { withFileTypes: true }).sort((a, b) =>
    a.name.localeCompare(b.name)
  )) {
    const file = join(directory, entry.name)
    if (entry.isDirectory()) out.push(...readCases(file))
    else if (/(?:\.test(?:-browser)?|\.spec)\.tsx?$/.test(entry.name))
      out.push(...parseTests(readFileSync(file, 'utf8'), file))
  }
  return out
}
