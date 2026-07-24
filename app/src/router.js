// Minimal hash router: pattern like "/pick/:id" -> handler(params)

const routes = [];

export function route(pattern, handler) {
  const paramNames = [];
  const regexStr = pattern
    .split("/")
    .map((seg) => {
      if (seg.startsWith(":")) {
        paramNames.push(seg.slice(1));
        return "([^/]+)";
      }
      return seg.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    })
    .join("/");
  routes.push({ regex: new RegExp(`^${regexStr}$`), paramNames, handler });
}

export function navigate(path) {
  if (location.hash.slice(1) === path) {
    render();
  } else {
    location.hash = path;
  }
}

function currentPath() {
  const hash = location.hash.slice(1);
  return hash || "/";
}

function render() {
  const path = currentPath();
  for (const r of routes) {
    const match = path.match(r.regex);
    if (match) {
      const params = {};
      r.paramNames.forEach((name, i) => (params[name] = decodeURIComponent(match[i + 1])));
      r.handler(params);
      return;
    }
  }
  const notFound = routes.find((r) => r.notFound);
  if (notFound) notFound.handler({});
}

export function notFoundRoute(handler) {
  routes.push({ notFound: true, handler });
}

export function startRouter() {
  window.addEventListener("hashchange", render);
  render();
}

export function rerender() {
  render();
}

export function currentRoutePath() {
  return currentPath();
}
