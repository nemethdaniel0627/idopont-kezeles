// Copies text to the clipboard. The Clipboard API only exists on https and localhost, so over plain http
// (e.g. the PC's IP address from a phone) it falls back to selecting a hidden text box and copying that.
export async function copyText(text) {
    if (window.isSecureContext && navigator.clipboard) {
        try {
            await navigator.clipboard.writeText(text);
            return;
        } catch (err) {
            // Denied: try the old way below
        }
    }

    const box = document.createElement("textarea");
    box.value = text;
    box.setAttribute("readonly", "");
    box.style.position = "fixed";
    box.style.top = "0";
    box.style.left = "0";
    box.style.opacity = "0";
    // Inside the open dialog, if any, so its focus trap doesn't take the focus back before the copy
    const host = (document.activeElement && document.activeElement.closest('[role="dialog"]')) || document.body;
    const focused = document.activeElement;
    host.appendChild(box);
    box.focus();
    box.select();
    box.setSelectionRange(0, text.length); // iOS selects nothing without this
    const copied = document.execCommand("copy");
    host.removeChild(box);
    if (focused && focused.focus) focused.focus();
    if (!copied) throw new Error("copy failed");
}
