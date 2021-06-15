import * as fs from "fs";
import * as path from "path";
import * as parser from "@solidity-parser/parser";
import { ASTNode } from "@solidity-parser/parser/dist/src/ast-types";

import { setProjectRootPath } from "./finder";
import * as matcher from "./matcher";
import {
    Node,
    SourceUnitNode,
    DocumentsAnalyzerTree,
    DocumentsAnalyzerMap,
    DocumentAnalyzer as IDocumentAnalyzer
} from "./nodes/Node";

export class Analyzer {
    documentsAnalyzer: DocumentsAnalyzerMap = {};
    documentsAnalyzerTree: DocumentsAnalyzerTree = {};

    constructor (rootPath: string | undefined) {
        setProjectRootPath(rootPath);

        const documentsUri: string[] = [];
        this.findSolFiles(rootPath, documentsUri);

        // Init all documentAnalyzers
        for (const documentUri of documentsUri) {
            this.documentsAnalyzer[documentUri] = new DocumentAnalyzer(documentUri);
            this.documentsAnalyzerTree[documentUri] = { rootNode: undefined };
        }

        for (const documentUri of documentsUri) {
            if (!this.documentsAnalyzerTree[documentUri].rootNode) {
                this.documentsAnalyzer[documentUri].analyze(this.documentsAnalyzer, this.documentsAnalyzerTree);
            }
        }
    }

    public getDocumentAnalyzer(uri: string): DocumentAnalyzer | undefined {
        if (uri.indexOf('file://') !== -1) {
            uri = uri.replace("file://", "");
        }

        return this.documentsAnalyzer[uri];
    }

    public analyzeDocument(document: string, uri: string): Node | undefined {
        uri = decodeURIComponent(uri);

        if (uri.indexOf('file://') !== -1) {
            uri = uri.replace("file://", "");
        }

        if (this.documentsAnalyzer[uri]) {
            return this.documentsAnalyzer[uri].analyze(this.documentsAnalyzer, this.documentsAnalyzerTree, document);
        }

        this.documentsAnalyzer[uri] = new DocumentAnalyzer(uri);
        this.documentsAnalyzerTree[uri] = { rootNode: undefined };
        return this.documentsAnalyzer[uri].analyze(this.documentsAnalyzer, this.documentsAnalyzerTree, document);
    }

    private findSolFiles(base: string | undefined, documentsUri: string[]): void {
        if (!base) {
            return;
        }

        if (base.indexOf('file://') !== -1) {
            base = base.replace("file://", "");
        }

        try {
            const files = fs.readdirSync(base);

            files.forEach(file => {
                // if (file === "node_modules") {
                //     return;
                // }

                const newBase = path.join(base || "", file);

                if (fs.statSync(newBase).isDirectory()) {
                    this.findSolFiles(newBase, documentsUri);
                } else if (newBase.slice(-4) === ".sol") {
                    documentsUri.push(newBase);
                }
            });
        } catch (err) {
            console.error('Unable to scan directory: ' + err);
        }
    }
}

class DocumentAnalyzer implements IDocumentAnalyzer {
    document: string | undefined;
    uri: string;

    ast: ASTNode | undefined;

    analyzerTree?: Node;

    orphanNodes: Node[] = [];

    constructor (uri: string) {
        this.uri = uri;

        if (fs.existsSync(uri)) {
            this.document = "" + fs.readFileSync(uri);
        } else {
            this.document = "";
        }
    }

    public analyze(documentsAnalyzer: DocumentsAnalyzerMap, documentsAnalyzerTree: DocumentsAnalyzerTree, document?: string): Node | undefined {
        try {
            this.orphanNodes = [];

            if (document) {
                this.document = document;
            }

            this.ast = parser.parse(this.document || "", {
                loc: true,
                range: true,
                tolerant: true
            });

            if (documentsAnalyzerTree[this.uri].rootNode) {
                const oldDocumentsAnalyzerTree = documentsAnalyzerTree[this.uri].rootNode as SourceUnitNode;

                for (const importNode of oldDocumentsAnalyzerTree.getImportNodes()) {
                    importNode.getParent()?.removeChild(importNode);
                    importNode.setParent(undefined);
                }
            }

            console.log(this.uri);
            // console.log(this.uri, JSON.stringify(this.ast));

            this.analyzerTree = matcher.find(this.ast, this.uri).accept(matcher.find, documentsAnalyzer, documentsAnalyzerTree, this.orphanNodes);

            return this.analyzerTree;
        } catch (err) {
            console.error(err);

            return this.analyzerTree;
        }
    }
}
