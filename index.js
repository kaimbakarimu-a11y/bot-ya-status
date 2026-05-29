import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }), 
        auth: state,
        // Tunazima QR code ili tutumie Pairing Code
        printQRInTerminal: false 
    });

    // Sehemu ya Pairing Code
    if (!sock.authState.creds.registered) {
        const phoneNumber = "255689121383"; // Namba yako
        const code = await sock.requestPairingCode(phoneNumber);
        console.log(`\n================================`);
        console.log(`BONYEZA LINK DEVICE KWENYE WHATSAPP`);
        console.log(`CHAGUA "LINK WITH PHONE NUMBER"`);
        console.log(`INGIZA CODE HII: ${code}`);
        console.log(`================================\n`);
    }

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Muunganisho umekatika. Kujaribu kuunganisha tena...');
            if (shouldReconnect) startBot(); 
        } else if (connection === 'open') {
            console.log('\n🎉 Bot imefanikiwa kuunganishwa na ipo tayari kazi! 🎉');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const message = chatUpdate.messages[0];
            if (!message || !message.key.remoteJid) return;

            if (message.key.remoteJid === 'status@broadcast') {
                const emojis = ['💣', '👀', '👁', '🥰', '☠️', '👻', '💯', '🤍', '❤️', '💛', '🫂', '✍️', '💤', '💥', '💫', '💞', '🫆', '👹', '💢', '🤘', '👍', '😭', '😘', '💚'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                await sock.readMessages([message.key]);
                await sock.sendMessage(message.key.remoteJid, {
                    react: { text: randomEmoji, key: message.key }
                });
                console.log(`[MAFANIKIO] Ume-react kwa: ${randomEmoji}`);
            }
        } catch (error) {
            console.error("Hitilafu: ", error);
        }
    });
}

startBot();
