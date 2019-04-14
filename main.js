function _(pi) {
  let _ = null;
  return (function (_) {
    _ = _; let llist = __ref0.last(pi["clist"]); _ = llist;
    _ = (function (_) {
      if (__ref0.EQ(__ref0.isExpr(llist) && llist[1], "`tabSize")) return (function (_) {
        _ = pi["clist"]["pop"]();
        _ = pi["tabSize"] = Number(llist[2]);
        _ = true;
        return _;
      })(_);
      else if (true) return (function (_) {
        _ = false;
        return _;
      })(_);

      return _;
    })(_);
    return _;
  })(_)
}