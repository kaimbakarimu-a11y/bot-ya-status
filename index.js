import makeWASocket, { useMultiFileAuthState, DisconnectReason } from '@whiskeysockets/baileys';
import pino from 'pino';
import qrcode from 'qrcode-terminal';

async function startBot() {
    // Sehemu ya kuhifadhi login session
    const { state, saveCreds } = await useMultiFileAuthState('auth_info_baileys');

    const sock = makeWASocket({
        logger: pino({ level: 'silent' }), 
        auth: state,
        printQRInTerminal: true 
    });

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect, qr } = update;
        
        if (qr) {
            console.log('\n--- SCAN QR CODE HAPA CHINI ---');
            qrcode.generate(qr, { small: true });
        }
        
        if (connection === 'close') {
            const shouldReconnect = lastDisconnect?.error?.output?.statusCode !== DisconnectReason.loggedOut;
            console.log('Muunganisho umekatika. Kujaribu kuunganisha tena...');
            if (shouldReconnect) {
                startBot(); 
            }
        } else if (connection === 'open') {
            console.log('\n🎉 Bot imefanikiwa kuunganishwa na ipo tayari kazi! 🎉');
        }
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        try {
            const message = chatUpdate.messages[0];
            if (!message || !message.key.remoteJid) return;

            // Hii inachuja status update pekee
            if (message.key.remoteJid === 'status@broadcast') {
                const mwandishi = message.key.participant; 
                
                // --- HAPA NDIPO MAREKEBISHO YALIPO ---
                const namba = mwandishi ? mwandishi.split('@')[0] : "Namba Isiyojulikana";
                console.log(`[STATUS MPYA] Kutoka kwa: ${namba}`);
                // ------------------------------------

                const emojis = ['💣', '👀', '👁', '🥰', '☠️', '👻', '💯', '🤍', '❤️', '💛', '🫂', '✍️', '💤', '💥', '💫', '💞', '🫆', '👹', '💢', '🤘', '👍', '😭', '😘', '💚'];
                const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

                // 1. Inasoma status
                await sock.readMessages([message.key]);

                // 2. Inatuma Reaction
                await sock.sendMessage(message.key.remoteJid, {
                    react: {
                        text: randomEmoji,
                        key: message.key
                    }
                });

                console.log(`[MAFANIKIO] Ume-react kwa: ${randomEmoji}`);
            }
        } catch (error) {
            console.error("Hitilafu imetokea: ", error);
        }
    });
}

startBot();