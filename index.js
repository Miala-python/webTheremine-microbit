
        // import { serial as webSerialPolyfill } from './serial.js';


        let port;
        const connectButton = document.getElementById('connectBtn');
        var dist = 0;
        var distMIN, distMAX, freqREF, coefP;
        const distHTML = document.getElementById('distVal');
        const freqHTML = document.getElementById('freqVal');


        async function connectToMicrobit() {
            dist = 0;
            stopSound();
            try {
                // Assurez-vous que le polyfill est disponible si l'API native n'est pas là
                const serial = navigator.serial || serial;


                // Demande à l'utilisateur de sélectionner le port série
                const port = await serial.requestPort();
                await port.open({ baudRate: 115200 });

                connectButton.textContent = "Connecté !";
                connectButton.style.backgroundColor = "#27ae60";

                // Configuration du lecteur de flux
                const reader = port.readable.getReader();
                const textDecoder = new TextDecoder();
                let receivedData = '';

                while (true) {
                    const { value, done } = await reader.read();

                    if (done) {
                        reader.releaseLock();
                        break;
                    }

                    // Conversion et traitement des données
                    receivedData += textDecoder.decode(value, { stream: true });

                    // Recherche de lignes complètes
                    const lines = receivedData.split('\n');

                    // Garder les données incomplètes pour la prochaine fois
                    receivedData = lines.pop() || '';

                    // Traiter toutes les lignes complètes
                    for (const line of lines) {
                        // Nettoyer et valider la ligne
                        const cleanedLine = line.trim();
                        if (!cleanedLine) continue; // Ignorer les lignes vides

                        // Convertir en nombre avec gestion des erreurs
                        const tmp = parseInt(cleanedLine);

                        if (!isNaN(tmp)) {
                            // Utiliser la valeur ici (ex: mise à jour UI)
                            console.log("Valeur valide (µs):", tmp);
                            dist = tmp / 58;
                            distHTML.textContent = dist;
                            // Exemple: document.getElementById("distance").innerText = distance;
                        } else {
                            console.warn("Valeur invalide reçue:", cleanedLine);
                            // Gérer les erreurs (None, timeout, etc.)
                        }
                    }
                }
            } catch (error) {
                console.error("Erreur:", error);
                connectButton.textContent = "Erreur - Réessayer";
                connectButton.style.backgroundColor = "#e74c3c";
            }
        }

        // Gestionnaire d'événement pour le bouton
        connectButton.addEventListener('click', connectToMicrobit);

        let audioContext;
        let currentOscillator = null;
        let currentGainNode = null;

        function playSound(freq) {
            // Initialiser le contexte audio
            if (!audioContext) {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
            }

            // Créer l'oscillateur et le gain s'ils n'existent pas
            if (!currentOscillator) {
                currentOscillator = audioContext.createOscillator();
                currentGainNode = audioContext.createGain();

                currentOscillator.type = 'sine';
                currentGainNode.gain.value = 0;

                currentOscillator.connect(currentGainNode);
                currentGainNode.connect(audioContext.destination);

                currentOscillator.start();
            }

            // Annuler les transitions en cours
            currentOscillator.frequency.cancelScheduledValues(audioContext.currentTime);
            currentGainNode.gain.cancelScheduledValues(audioContext.currentTime);

            // Transition fluide de la fréquence (exponentielle pour les fréquences)
            currentOscillator.frequency.exponentialRampToValueAtTime(
                freq,
                audioContext.currentTime + 0.05
            );

            // Transition fluide du volume (linéaire pour le gain)
            currentGainNode.gain.linearRampToValueAtTime(
                0.3,
                audioContext.currentTime + 0.05
            );
        }

        function stopSound() {
            if (currentOscillator && currentGainNode) {
                // Annuler les transitions en cours
                currentGainNode.gain.cancelScheduledValues(audioContext.currentTime);

                // Fade out avant l'arrêt
                currentGainNode.gain.linearRampToValueAtTime(
                    0,
                    audioContext.currentTime + 0.1
                );

                // Arrêt et nettoyage après le fade
                setTimeout(() => {
                    if (currentGainNode.gain.value === 0) {
                        currentOscillator.stop();
                        currentOscillator.disconnect();
                        currentGainNode.disconnect();
                        currentOscillator = null;
                        currentGainNode = null;
                    }
                }, 100);
            }
        }

        function getInputs() {
            distMIN = document.getElementById('distMIN').value;
            distMAX = document.getElementById('distMAX').value;
            freqREF = document.getElementById('freqREF').value;
            coefP = document.getElementById('coefP').value;
        }
        getInputs()

        const demiTon = 2 ** (1 / 12);

        setInterval(() => {
            if (dist > distMAX) {
                stopSound();
            } else if (dist >= distMIN) {
                let freq = freqREF * demiTon ** (dist / coefP);
                freqHTML.textContent = freq;
                playSound(freq);
            }
            getInputs();
        }, 50)
 