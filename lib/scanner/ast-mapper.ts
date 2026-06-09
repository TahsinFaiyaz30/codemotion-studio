import { parse as babelParse } from "@babel/parser";
import traverse from "@babel/traverse";
import { Node, Project, SyntaxKind } from "ts-morph";
import type { ParsedFileAst, RepoFile } from "@/lib/types/analysis";

const astExtensions = new Set(["ts", "tsx", "js", "jsx", "mjs", "cjs"]);

function unique(values: string[]) {
  return Array.from(new Set(values.filter(Boolean))).slice(0, 80);
}

function emptyAst(file: RepoFile): ParsedFileAst {
  return {
    path: file.path,
    language: file.extension,
    imports: [],
    exports: [],
    functions: [],
    components: [],
    hooks: [],
    apiHandlers: [],
    jsxUses: [],
    calls: [],
    envVars: [],
    dbSignals: [],
    authSignals: [],
    errors: []
  };
}

function detectSignals(content: string) {
  const envVars = unique(
    Array.from(content.matchAll(/process\.env\.([A-Z0-9_]+)/g)).map((match) => match[1])
  );
  const dbSignals = unique(
    Array.from(content.matchAll(/\b(prisma|mongoose|sequelize|drizzle|supabase|db)\b/gi)).map(
      (match) => match[1]
    )
  );
  const authSignals = unique(
    Array.from(content.matchAll(/\b(nextauth|auth|session|jwt|clerk|lucia|passport)\b/gi)).map(
      (match) => match[1]
    )
  );

  return { envVars, dbSignals, authSignals };
}

function parseWithTsMorph(file: RepoFile): ParsedFileAst {
  const ast = emptyAst(file);
  const content = file.content ?? "";
  const project = new Project({
    useInMemoryFileSystem: true,
    skipAddingFilesFromTsConfig: true
  });
  const sourceFile = project.createSourceFile(file.path, content, { overwrite: true });

  ast.imports = unique(
    sourceFile.getImportDeclarations().map((declaration) => declaration.getModuleSpecifierValue())
  );
  ast.exports = unique([
    ...Array.from(sourceFile.getExportedDeclarations().keys()),
    ...sourceFile.getExportDeclarations().flatMap((declaration) =>
      declaration.getNamedExports().map((namedExport) => namedExport.getName())
    )
  ]);
  ast.functions = unique(sourceFile.getFunctions().map((fn) => fn.getName() ?? "anonymous"));
  ast.components = unique([
    ...ast.functions.filter((name) => /^[A-Z]/.test(name)),
    ...sourceFile
      .getVariableDeclarations()
      .map((declaration) => declaration.getName())
      .filter((name) => /^[A-Z]/.test(name))
  ]);
  ast.hooks = unique([
    ...ast.functions.filter((name) => /^use[A-Z0-9]/.test(name)),
    ...sourceFile
      .getVariableDeclarations()
      .map((declaration) => declaration.getName())
      .filter((name) => /^use[A-Z0-9]/.test(name))
  ]);
  ast.apiHandlers = unique(ast.exports.filter((name) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(name)));
  ast.jsxUses = unique([
    ...sourceFile
      .getDescendantsOfKind(SyntaxKind.JsxOpeningElement)
      .map((element) => element.getTagNameNode().getText()),
    ...sourceFile
      .getDescendantsOfKind(SyntaxKind.JsxSelfClosingElement)
      .map((element) => element.getTagNameNode().getText())
  ]);
  ast.calls = unique(
    sourceFile
      .getDescendantsOfKind(SyntaxKind.CallExpression)
      .map((call) => call.getExpression().getText())
      .filter((name) => name.length < 80)
  );

  const signals = detectSignals(content);
  ast.envVars = signals.envVars;
  ast.dbSignals = signals.dbSignals;
  ast.authSignals = signals.authSignals;

  return ast;
}

function parseWithBabel(file: RepoFile, errorMessage: string): ParsedFileAst {
  const ast = emptyAst(file);
  ast.errors.push(errorMessage);
  const content = file.content ?? "";

  try {
    const program = babelParse(content, {
      sourceType: "unambiguous",
      plugins: ["typescript", "jsx", "decorators-legacy"]
    });

    traverse(program, {
      ImportDeclaration(path) {
        ast.imports.push(path.node.source.value);
      },
      ExportNamedDeclaration(path) {
        for (const specifier of path.node.specifiers) {
          if ("exported" in specifier && "name" in specifier.exported) {
            ast.exports.push(specifier.exported.name);
          }
        }
      },
      ExportDefaultDeclaration() {
        ast.exports.push("default");
      },
      FunctionDeclaration(path) {
        const name = path.node.id?.name;
        if (name) ast.functions.push(name);
      },
      VariableDeclarator(path) {
        if (path.node.id.type === "Identifier") {
          const name = path.node.id.name;
          if (/^[A-Z]/.test(name)) ast.components.push(name);
          if (/^use[A-Z0-9]/.test(name)) ast.hooks.push(name);
        }
      },
      JSXOpeningElement(path) {
        const name = path.node.name;
        if (name.type === "JSXIdentifier") ast.jsxUses.push(name.name);
      },
      CallExpression(path) {
        const callee = path.get("callee");
        if (callee.isIdentifier()) ast.calls.push(callee.node.name);
        if (callee.isMemberExpression()) ast.calls.push(content.slice(callee.node.start ?? 0, callee.node.end ?? 0));
      }
    });
  } catch (fallbackError) {
    ast.errors.push(fallbackError instanceof Error ? fallbackError.message : "Babel parser failed.");
  }

  const signals = detectSignals(content);
  ast.imports = unique(ast.imports);
  ast.exports = unique(ast.exports);
  ast.functions = unique(ast.functions);
  ast.components = unique(ast.components);
  ast.hooks = unique(ast.hooks);
  ast.apiHandlers = unique(ast.exports.filter((name) => /^(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)$/.test(name)));
  ast.jsxUses = unique(ast.jsxUses);
  ast.calls = unique(ast.calls.filter((name) => name.length < 80));
  ast.envVars = signals.envVars;
  ast.dbSignals = signals.dbSignals;
  ast.authSignals = signals.authSignals;

  return ast;
}

export function mapFileAst(file: RepoFile): ParsedFileAst {
  if (!file.content || !astExtensions.has(file.extension)) {
    return emptyAst(file);
  }

  try {
    return parseWithTsMorph(file);
  } catch (error) {
    return parseWithBabel(file, error instanceof Error ? error.message : "ts-morph parser failed.");
  }
}

export function mapAstFiles(files: RepoFile[]) {
  return files
    .filter((file) => file.selected && file.content && astExtensions.has(file.extension))
    .map(mapFileAst);
}

