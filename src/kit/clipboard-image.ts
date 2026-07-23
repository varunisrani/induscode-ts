// @ts-nocheck
// Type declarations recovered from dist/types (no runtime body)
/**
 * Clipboard-image kit — pull a raster image off the OS clipboard and stage it
 * on disk as a temp PNG, returning the path the composer can splice into a
 * prompt.
 *
 * The terminal can only carry text, so an image on the clipboard cannot ride a
 * normal paste. Instead this helper shells out to the platform's clipboard
 * tool, captures the raw bytes, writes them to a temp file, and hands back the
 * path — the agent then attaches the file by reference.
 *
 * Platform strategy (each is the conventional tool for its OS):
 *   - **macOS** — `pngpaste -` dumps a clipboard image to stdout; when it is not
 *     installed we fall back to an `osascript` one-liner that asks the clipboard
 *     for its «class PNGf» data and base64-encodes it.
 *   - **Linux/Wayland** — `wl-paste --type image/png` writes the image to stdout.
 *   - **Linux/X11** — `xclip -selection clipboard -t image/png -o` does the same.
 *
 * Every spawn is best-effort: a missing tool, a non-zero exit, or an empty
 * clipboard all collapse to `null` so the caller can warn rather than throw. The
 * `child_process` / `fs` / `os` builtins are the only dependencies; nothing here
 * touches the framework or a sibling subsystem.
 */
/** Options for {@link readClipboardImage} — injectable so tests stay hermetic. */
export interface ClipboardImageOptions {
    /** Override the host platform (defaults to `process.platform`). */
    readonly platform?: NodeJS.Platform;
    /** Override the environment consulted for the Wayland probe. */
    readonly env?: NodeJS.ProcessEnv;
    /** Override the temp directory the captured PNG is written to. */
    readonly dir?: string;
}
/**
 * Pull an image off the OS clipboard, write it to a temp PNG, and return the
 * file path — or `null` when no image is on the clipboard, the platform's tool
 * is missing, or the write fails.
 *
 * The returned path is unique per call (millisecond + random suffix) so two
 * pastes never collide. The caller owns the temp file thereafter.
 */
export declare function readClipboardImage(options?: ClipboardImageOptions): string | null;
