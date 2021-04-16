import { AST, EventDefinition } from "@solidity-parser/parser/dist/ast-types";

import { Location, Node } from "./Node";

export class EventDefinitionNode implements Node {
    type: string;

    uri: string;
    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    astNode: AST;

    constructor (eventDefinition: EventDefinition, uri: string) {
        this.type = eventDefinition.type;

        this.uri = uri;
        // TO-DO: Implement name location for rename

        this.astNode = eventDefinition;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(orphanNodes: Node[], parent?: Node): void {
        // TO-DO: Method not implemented
    }
}