// The admin list keeps its page/sort/filters in the URL query. Detail and edit pages receive
// that query as a `list` param so "Back", "Cancel" and "Save" return to the same list view.
export const ADMIN_LIST_PATH = "/admin/worker-productions";

// Re-serialized through URLSearchParams so only a query string (never a path) is ever appended.
const normalize = (listQuery: string | null | undefined) => new URLSearchParams(listQuery ?? "").toString();

export function adminListHref(listQuery: string | null | undefined) {
  const qs = normalize(listQuery);
  return qs ? `${ADMIN_LIST_PATH}?${qs}` : ADMIN_LIST_PATH;
}

export function withListQuery(href: string, listQuery: string | null | undefined) {
  const qs = normalize(listQuery);
  return qs ? `${href}?${new URLSearchParams({ list: qs })}` : href;
}
