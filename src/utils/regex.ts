export const legacyUrl = new RegExp(
  /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com))(\/|channel\/|\/)/gm
);
export const handleUrl = new RegExp(
  /^((?:https?:)?\/\/)?((?:www|m)\.)?((?:youtube\.com))(\/(@))/gm
);
// export const removeOldSubs = new RegExp(
//   / \[(\d+|\d+.\d+\d+(K|M|B)|\d+.\d+(K|M|B)|\d+(K|M|B))\]/g
// );
