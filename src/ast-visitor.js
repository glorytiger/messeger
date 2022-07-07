// src\ast-visitor.js

class Visitor {
  constructor() {
    this.count = 0;
    this.lsFuncsRaw = [];
  }
  visitNodes(nodes) { for (const n of nodes) this.visitNode(n); }
  visitNode(node) {
    if (node === null || node === undefined) return;
    this.count++;
    //console.log(node.type);

    // Append LS functions to array
    if (node.type === 'CallExpression' &&
        node.callee.type === 'MemberExpression' &&
        node.callee.object.type === 'Identifier' &&
        node.callee.object.name === 'LS' &&
        node.callee.property.type === 'Identifier' &&
        node.callee.property.name === 'sp') {
      //console.log(node.arguments[0].value);
      this.lsFuncsRaw.push(node);
    }

    /*for (const prop in node) {
      if (Object.prototype.hasOwnProperty.call(node, prop)) {
        if (Array.isArray(node.prop)) this.visitNodes(node.prop);
        else this.visitNode(node.prop);
      }
    }*/

    if (Array.isArray(node.body)) { this.visitNodes(node.body); }
    else if (node.body) { this.visitNode(node.body); }
    if (node.id) this.visitNode(node.id);
    if (node.declarations) this.visitNodes(node.declarations);
    if (Array.isArray(node.arguments)) this.visitNodes(node.arguments);
    else this.visitNode(node.argument);
    if (node.callee) this.visitNode(node.callee);
    if (node.params) this.visitNodes(node.params);
    if (node.init) this.visitNode(node.init);
    if (node.left) this.visitNode(node.left);
    if (node.right) this.visitNode(node.right);
    if (node.test) this.visitNode(node.test);
    if (node.consequent) this.visitNode(node.consequent);
    if (node.alternate) this.visitNode(node.alternate);
    if (node.expressions) this.visitNodes(node.expressions);
    if (node.object) this.visitNode(node.object);
    if (node.property) this.visitNode(node.property);
    if (node.elements) this.visitNodes(node.elements);
  }
}

module.exports = Visitor;

