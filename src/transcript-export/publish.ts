// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * publishTranscript — render a session transcript to a standalone, self-contained
 * HTML document.
 *
 * The publisher takes a list of transcript entries (each carrying a framework
 * message) and produces one HTML string with no external dependencies: prose is
 * rendered to HTML with `marked`, fenced code is syntax-highlighted with
 * `highlight.js`, terminal-styled tool output is painted to spans by
 * {@link paintSgr}, and all colors come from a {@link ThemeBridge} over an
 * {@link ExportTheme}. Markdown and highlighting are run *here*, at publish time,
 * so the rendered HTML is baked into the page payload and the page needs no
 * client-side parser to display — the page ships ready to read.
 *
 * The two third-party libraries this layer leans on are MIT (`marked`) and
 * BSD-3-Clause (`highlight.js`); their license notices are preserved verbatim in
 * the emitted document (the `MARKED_LIB` / `HIGHLIGHT_LIB` shell slots) as the
 * licenses require, while the libraries themselves are used, never reimplemented.
 */
import { type ImageContent, type PublishOptions, type TextContent } from "../briefing/contract";
/**
 * The conversational role a published turn carries. Mirrors the conductor's node
 * roles but is declared locally so the publisher depends only on the briefing
 * contract, not on the conductor subsystem.
 */
export type PublishRole = "user" | "assistant" | "tool" | "system" | "condense" | "note";
/**
 * One transcript node the publisher consumes. Structurally a subset of the
 * conductor's persisted entry: a `role` for attribution and a `message` carrying
 * the framework content this node renders. The `message` is read with narrow
 * structural access so the publisher never imports the framework message union.
 */
export interface PublishEntry {
    /** Attribution role for this node. */
    readonly role: PublishRole;
    /** The framework message payload to render. */
    readonly message: PublishMessage;
}
/**
 * The narrow view of a framework message the publisher reads. Covers the three
 * concrete message roles' content shapes plus the tool-call linkage a tool result
 * carries, without redeclaring the whole framework union.
 */
export interface PublishMessage {
    /** The framework message role. */
    readonly role: string;
    /** The message content — a bare string or a list of content parts. */
    readonly content: string | readonly MessagePart[];
    /** Present on tool-result messages; links the node to its originating call. */
    readonly toolCallId?: string;
    /** Present on tool-result messages; the invoked tool's display name. */
    readonly toolName?: string;
}
/**
 * The content-part union the publisher renders. Text and image parts alias the
 * framework's; thinking and tool-call parts are read structurally so the
 * assistant turn can surface a call's name and arguments.
 */
export type MessagePart = TextContent | ImageContent | {
    readonly type: "thinking";
    readonly thinking: string;
} | {
    readonly type: "toolCall";
    readonly id: string;
    readonly name: string;
    readonly arguments: Readonly<Record<string, unknown>>;
};
/**
 * Render a session transcript to a standalone HTML document.
 *
 * Configures the markdown + highlight pipeline, renders every entry to a turn,
 * serializes the turns into a base64 payload, resolves the theme through a
 * {@link ThemeBridge}, and fills the page shell. The returned string is a complete
 * `<!doctype html>` document with all styling, content, and the preserved library
 * notices inlined — it can be written to disk and opened directly.
 *
 * @param entries the transcript nodes to publish, in display order
 * @param opts    optional theme, title, output directory, and widget overrides
 * @returns the rendered standalone HTML document
 * @throws a {@link briefingFault} of kind `"publish"` if assembly fails
 */
export declare function publishTranscript(entries: readonly PublishEntry[], opts?: PublishOptions): string;
