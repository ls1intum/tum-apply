export const getRequiredAnchor = (root: ParentNode, selector: string): HTMLAnchorElement => {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLAnchorElement)) {
    throw new Error(`Expected anchor for selector: ${selector}`);
  }
  return element;
};

export const getRequiredButton = (root: ParentNode, selector: string): HTMLButtonElement => {
  const element = root.querySelector(selector);
  if (!(element instanceof HTMLButtonElement)) {
    throw new Error(`Expected button for selector: ${selector}`);
  }
  return element;
};
