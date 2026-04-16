export const getRequiredAnchor = (root: ParentNode, selector: string): HTMLAnchorElement => {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLAnchorElement)) {
    throw new Error(`Expected anchor for selector: ${selector}`);
  }
  return element;
};
