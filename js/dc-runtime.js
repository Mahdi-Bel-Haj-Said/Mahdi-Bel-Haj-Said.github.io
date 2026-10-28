// Minimal renderer for the site's template: compiles the <template> markup once,
// then turns it into Preact vnodes on every render using the values from renderVals().
// Supports {{path}} holes, whole-value attributes (handlers, refs), <sc-if> and <sc-for>.
(function () {
  "use strict";
  var h = preact.h;
  var Fragment = preact.Fragment;
  var HOLE = /\{\{\s*([^}]*?)\s*\}\}/g;
  var WHOLE = /^\{\{\s*([^}]*?)\s*\}\}$/;
  // Attributes Preact would set as DOM properties, where "" or "false" must become a boolean.
  var BOOL_PROPS = { disabled: 1, checked: 1, selected: 1, hidden: 1, required: 1, multiple: 1, autofocus: 1, open: 1, readonly: 1, novalidate: 1, spellcheck: 1, draggable: 1 };
  var uid = 0;

  function literal(expr) {
    if (expr === "true") return { v: true };
    if (expr === "false") return { v: false };
    if (expr === "null") return { v: null };
    if (/^-?\d+(\.\d+)?$/.test(expr)) return { v: Number(expr) };
    var q = /^(["'])(.*)\1$/.exec(expr);
    if (q) return { v: q[2] };
    return null;
  }

  function compileExpr(expr) {
    var lit = literal(expr);
    if (lit) return { lit: true, v: lit.v };
    return { path: expr.split(".") };
  }

  function lookup(e, scope) {
    if (e.lit) return e.v;
    var p = e.path, head = p[0], cur;
    for (var s = scope; s; s = s.up) {
      if (Object.prototype.hasOwnProperty.call(s.vars, head)) { cur = s.vars[head]; break; }
    }
    for (var i = 1; i < p.length && cur != null; i++) cur = cur[p[i]];
    return cur;
  }

  function compileString(str) {
    var whole = WHOLE.exec(str);
    if (whole && str.indexOf("{{", 2) < 0) return { raw: compileExpr(whole[1]) };
    if (str.indexOf("{{") < 0) return { text: str };
    var parts = [], last = 0, m;
    HOLE.lastIndex = 0;
    while ((m = HOLE.exec(str))) {
      if (m.index > last) parts.push(str.slice(last, m.index));
      parts.push(compileExpr(m[1]));
      last = HOLE.lastIndex;
    }
    if (last < str.length) parts.push(str.slice(last));
    return { parts: parts };
  }

  function show(v) { return v == null || v === false || v === true ? "" : String(v); }

  function evalString(c, scope) {
    if (c.text != null) return c.text;
    if (c.raw) return lookup(c.raw, scope);
    var out = "";
    for (var i = 0; i < c.parts.length; i++) {
      var p = c.parts[i];
      out += typeof p === "string" ? p : show(lookup(p, scope));
    }
    return out;
  }

  function compileNode(node) {
    if (node.nodeType === 3) return { kind: "text", c: compileString(node.nodeValue) };
    if (node.nodeType !== 1) return null;
    var tag = node.localName;
    var id = "n" + (uid++);
    var children = compileChildren(node);
    if (tag === "sc-if") return { kind: "if", id: id, cond: compileString(node.getAttribute("value") || ""), children: children };
    if (tag === "sc-for") return { kind: "for", id: id, list: compileString(node.getAttribute("list") || ""), as: node.getAttribute("as") || "item", children: children };
    var attrs = [];
    for (var i = 0; i < node.attributes.length; i++) {
      var a = node.attributes[i];
      if (a.name.indexOf("hint-") === 0) continue;
      attrs.push({ name: a.name, c: compileString(a.value) });
    }
    return { kind: "el", id: id, tag: tag, attrs: attrs, children: children };
  }

  function compileChildren(node) {
    var src = node.content || node;
    var out = [];
    for (var ch = src.firstChild; ch; ch = ch.nextSibling) {
      var c = compileNode(ch);
      if (c) out.push(c);
    }
    return out;
  }

  function renderChildren(list, scope, out) {
    for (var i = 0; i < list.length; i++) renderNode(list[i], scope, out);
    return out;
  }

  function renderNode(n, scope, out) {
    if (n.kind === "text") {
      var t = evalString(n.c, scope);
      if (n.c.raw) t = show(t);
      if (t !== "") out.push(t);
      return;
    }
    if (n.kind === "if") {
      var on = evalString(n.cond, scope);
      out.push(h(Fragment, { key: n.id }, on ? renderChildren(n.children, scope, []) : null));
      return;
    }
    if (n.kind === "for") {
      var items = evalString(n.list, scope) || [];
      var rows = [];
      for (var k = 0; k < items.length; k++) {
        var vars = { $index: k };
        vars[n.as] = items[k];
        rows.push(h(Fragment, { key: k }, renderChildren(n.children, { vars: vars, up: scope }, [])));
      }
      out.push(h(Fragment, { key: n.id }, rows));
      return;
    }
    var props = { key: n.id };
    for (var j = 0; j < n.attrs.length; j++) {
      var a = n.attrs[j];
      var v = evalString(a.c, scope);
      if (v == null) continue;
      if (BOOL_PROPS[a.name] && typeof v === "string") v = v !== "false";
      props[a.name] = v;
    }
    out.push(h(n.tag, props, n.children.length ? renderChildren(n.children, scope, []) : null));
  }

  function DCLogic(props) { preact.Component.call(this, props); }
  DCLogic.prototype = Object.create(preact.Component.prototype);
  DCLogic.prototype.constructor = DCLogic;
  DCLogic.prototype.render = function () {
    var vals = this.renderVals ? this.renderVals() : {};
    var nodes = renderChildren(this.constructor.__dcTemplate, { vars: vals || {}, up: null }, []);
    return h(Fragment, null, nodes);
  };

  window.DCLogic = DCLogic;
  window.DC = {
    mount: function (Component, root, templateEl, props) {
      Component.__dcTemplate = compileChildren(templateEl);
      preact.render(h(Component, props || {}), root);
    }
  };
})();
