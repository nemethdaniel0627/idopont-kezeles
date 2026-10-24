// Sends emails. MAIL_TRANSPORT chooses how. No email provider is chosen yet, so the only transport is
// "console", which prints the email in the server's output. A real provider is a new entry in `transports`.

const transports = {
    console: async ({ to, subject, text }) => {
        console.log([
            '----- E-mail (MAIL_TRANSPORT=console, not sent) -----',
            `To: ${to}`,
            `Subject: ${subject}`,
            '',
            text,
            '------------------------------------------------------',
        ].join('\n'));
    },
};

async function send(message) {
    const name = process.env.MAIL_TRANSPORT || 'console';
    const transport = transports[name];
    if (!transport) throw new Error(`Unknown MAIL_TRANSPORT: ${name}`);
    await transport(message);
}

module.exports = { send };
