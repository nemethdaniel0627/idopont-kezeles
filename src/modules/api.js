// The server's message for a failed request (e.g. a Hungarian validation message), or a general one
export function errorMessage(err, fallback) {
    return err && err.response && err.response.data && err.response.data.error
        ? err.response.data.error
        : fallback;
}
