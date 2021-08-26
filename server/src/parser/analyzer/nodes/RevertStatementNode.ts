import { RevertStatement, FinderType, DocumentsAnalyzerMap, Node } from "@common/types";

export class RevertStatementNode extends Node {
    astNode: RevertStatement;

    constructor (revertStatement: RevertStatement, uri: string, rootPath: string, documentsAnalyzer: DocumentsAnalyzerMap) {
        super(revertStatement, uri, rootPath, documentsAnalyzer, undefined);
        this.astNode = revertStatement;
        // TO-DO: Implement name location for rename
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node, expression?: Node): Node {
        this.setExpressionNode(expression);
        // TO-DO: Method not implemented
        return this;
    }
}