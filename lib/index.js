// dsh-session-id-footer — host half. Pure UI plugin: the empty apply exists
// so the package appears in the host cordis.yml / Loader; the browser half
// ships via exports["./client"], discovered through the package.json
// dsh.client declaration.
function apply() {}
export { apply };
