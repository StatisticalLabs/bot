export function abbreviate(count: number, withAbbr = true, decimals = 2) {
  if (String(count)[0] === "0") {
    if (count === 0) return "0";
    else return count.toFixed(decimals);
  }

  var neg = false;
  if (String(count)[0] == "-") {
    neg = true;
    count = ~Number(count) + 1;
  }

  const COUNT_ABBRS = ["", "K", "M", "B"];
  const i = count === 0 ? count : Math.floor(Math.log(count) / Math.log(1000));
  let result = parseFloat(
    (count / Math.pow(1000, i)).toFixed(decimals)
  ).toString();
  if (withAbbr) result += `${COUNT_ABBRS[i]}`;
  if (neg) result = `-${result}`;
  return result;
}
