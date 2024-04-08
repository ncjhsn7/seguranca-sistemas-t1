const fs = require('fs');

function calculateIoC(segment) {
    const freqs = new Array(26).fill(0);
    segment.split('').forEach(char => {
        const index = char.charCodeAt(0) - 'A'.charCodeAt(0);
        if (index >= 0 && index < 26) {
            freqs[index]++;
        }
    });

    const total = segment.length;
    return freqs.reduce((sum, count) => sum + count * (count - 1), 0) / (total * (total - 1));
}

function estimateKeyLength(ciphertext) {
    let bestLength = 1;
    let bestIoCDifference = Infinity;
    const expectedIoC = 0.065; // Approximate for English

    for (let keyLength = 1; keyLength <= 20; keyLength++) {
        let averageIoC = 0;
        for (let i = 0; i < keyLength; i++) {
            let segment = '';
            for (let j = i; j < ciphertext.length; j += keyLength) {
                segment += ciphertext[j];
            }
            averageIoC += calculateIoC(segment);
        }
        averageIoC /= keyLength;
        const iocDifference = Math.abs(averageIoC - expectedIoC);
        if (iocDifference < bestIoCDifference) {
            bestIoCDifference = iocDifference;
            bestLength = keyLength;
        }
    }

    return bestLength;
}

function calculateFrequencyScores(segment) {
    const freqs = 'ETAOINSHRDLCUMWFGYPBVKJXQZ';
    const segmentFreqs = new Array(26).fill(0);
    segment.split('').forEach(char => {
        const index = char.charCodeAt(0) - 'A'.charCodeAt(0);
        segmentFreqs[index]++;
    });

    const totalLetters = segment.length;
    const segmentFreqsNormalized = segmentFreqs.map(count => count / totalLetters);
    const scores = new Array(26).fill(0);

    for (let i = 0; i < 26; i++) {
        let score = 0;
        for (let j = 0; j < 26; j++) {
            const shiftedIndex = (j + i) % 26;
            const freqIndex = freqs.indexOf(String.fromCharCode('A'.charCodeAt(0) + j));
            score += segmentFreqsNormalized[shiftedIndex] * (26 - freqIndex);
        }
        scores[i] = score;
    }

    return scores;
}

function breakCipher(ciphertext) {
    const keyLength = estimateKeyLength(ciphertext);
    let key = '';

    for (let i = 0; i < keyLength; i++) {
        let segment = '';
        for (let j = i; j < ciphertext.length; j += keyLength) {
            segment += ciphertext[j];
        }
        const scores = calculateFrequencyScores(segment);
        const maxScoreIndex = scores.indexOf(Math.max(...scores));
        key += String.fromCharCode('A'.charCodeAt(0) + maxScoreIndex);
    }

    let plaintext = '';
    for (let i = 0; i < ciphertext.length; i++) {
        const keyCharCode = key.charCodeAt(i % keyLength) - 'A'.charCodeAt(0);
        const charCode = ciphertext.charCodeAt(i) - 'A'.charCodeAt(0);
        const decodedCharCode = ((charCode - keyCharCode + 26) % 26) + 'A'.charCodeAt(0);
        plaintext += String.fromCharCode(decodedCharCode);
    }

    console.log("Estimated Key Length: " + keyLength);
    console.log("Estimated Key: " + key);
    return plaintext;
}

// Usage example, reading the ciphertext from a file
fs.readFile('file.txt', 'utf8', (err, data) => {
    if (err) {
        console.error("Error reading the file:", err);
        return;
    }
    const ciphertext = data.toUpperCase().replace(/[^A-Z]/g, "");
    console.time("DecryptionTime");
    const decryptedText = breakCipher(ciphertext);
    console.timeEnd("DecryptionTime");
    console.log("Deciphered Text: " + decryptedText);
});
