// dsh-session-id-footer — browser half. Bundle format mirrors the shipped
// dsh-client-ui-* packages: window.__ModuleLoader__.load({ id, factory })
// with the package name as id; seed words (react, …) come from the static
// module table. The plugin declares the client services it needs (slots,
// timer) and registers into the composer dock under the composer card.
window.__ModuleLoader__.load({
	id: "dsh-session-id-footer",
	factory: (require) => {
		var module = { exports: {} };
		var exports = module.exports;
		Object.defineProperty(exports, Symbol.toStringTag, { value: "Module" });
		let react = require("react");
		//#region lib/types/client/index.js
		/** Required client services. */
		const inject = ["slots", "timer"];
		/**
		* Client plugin body: register a small click-to-copy session-id readout
		* into the composer dock (the band under the composer card).
		* @param ctx - client root context.
		*/
		function apply(ctx) {
			function SessionIdFooter(props) {
				const sessionId = String(props.sessionId || (props.session && props.session.id) || "");
				const [copied, setCopied] = react.useState(false);
				const [hovered, setHovered] = react.useState(false);
				if (!sessionId) return null;
				const doCopy = () => {
					const done = () => {
						setCopied(true);
						ctx.timeout(() => setCopied(false), 1600);
					};
					if (typeof navigator !== "undefined" && navigator.clipboard && navigator.clipboard.writeText) {
						navigator.clipboard.writeText(sessionId).then(done).catch(() => {});
						return;
					}
					try {
						const ta = document.createElement("textarea");
						ta.value = sessionId;
						ta.style.position = "fixed";
						ta.style.opacity = "0";
						document.body.appendChild(ta);
						ta.select();
						const ok = document.execCommand("copy");
						document.body.removeChild(ta);
						if (ok) done();
					} catch (e) { /* clipboard unavailable */ }
				};
				return react.createElement("span", {
					style: {
						fontSize: "11px",
						lineHeight: 1,
						opacity: hovered ? 0.9 : 0.5,
						cursor: "pointer",
						padding: "2px 5px",
						borderRadius: "5px",
						userSelect: "text",
						WebkitUserSelect: "text",
						transition: "opacity .15s ease",
						color: copied ? "#22c55e" : undefined
					},
					onClick: doCopy,
					onMouseEnter: () => setHovered(true),
					onMouseLeave: () => setHovered(false),
					title: "点击复制会话 ID"
				}, copied ? "✓ 已复制" : sessionId);
			}
			ctx.slots.inject("conversation.composer.dock", () => ctx.slots.register({
				name: "conversation.composer.dock",
				id: "session-id-footer",
				order: 10
			}, SessionIdFooter));
		}
		//#endregion
		exports.apply = apply;
		exports.inject = inject;
		return module.exports;
	}
});
