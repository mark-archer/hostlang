function _(pi) {
  let _ = null;
  let __rtnFlag = false;
  let __iStm = 0;
  while (true) {
    if (__rtnFlag) return _;
    switch (__iStm) {
      case 0:
        _ = _; 
        let llist = __ref0.last(pi["clist"]); _ = llist;
        break;
      case 1:
        _ = (function (_) {
          if (__ref0.EQ(__ref0.isExpr(llist) && llist[1], "`tabSize")) return (function (_) {
            _ = pi["clist"]["pop"]();
            _ = pi["tabSize"] = Number(llist[2]);
            _ = true;
            return _;
          })(_);
          else if (true) return false;
          return _;
        })(_);
        break;
      default:
        return _;
    }
    __iStm++;
  }
}