import {
    AccountRole,
    address,
    appendTransactionMessageInstructions,
    createTransactionMessage,
    pipe,
    setTransactionMessageFeePayerSigner,
    setTransactionMessageLifetimeUsingBlockhash,
    signTransactionMessageWithSigners,
} from '@solana/kit';
import { getTransferCheckedInstruction } from "@solana-program/token-2022";
import { createClient } from './client';


(async () => {
    const client = await createClient();

    const mint = address("ALqpasve2tzKU3ZnfmDXJRzDhZYEkjfN2psxwMuRwcRW");
    const receiverATA = address("Dmh1kNbRcYtnBPBxPyaEKssW4xaWgbzYN9bbEAoH6Vy6");
    const senderATA = address("7hopvmCje6MbMs41nQHzUBPzq195zkYs752Ye2ycxGmG");
    const hookProgram = address("F3FbkBqxKVrKtwp9GLajsjbU5QxaGqXf8qe1RMMB8Qfm");

    const vTransferIX = getTransferCheckedInstruction({
        amount: 1_000_000_000,
        authority: client.wallet,
        decimals: 9,
        destination: receiverATA,
        source: senderATA,
        mint
    });

    const extendedTransferIX = {
        programAddress: vTransferIX.programAddress,
        data: vTransferIX.data,
        accounts: [...vTransferIX.accounts, { address: hookProgram, role: AccountRole.READONLY }]
    }

    const [{ value: latestBlockhash }] = await Promise.all([
        client.rpc.getLatestBlockhash().send(),
    ]);

    const transactionMessage = pipe(
        createTransactionMessage({ version: 0 }),
        (tx) => setTransactionMessageFeePayerSigner(client.wallet, tx),
        (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
        (tx) => appendTransactionMessageInstructions([extendedTransferIX], tx),
    );

    const transaction = await signTransactionMessageWithSigners(transactionMessage);

    await client.sendAndConfirmTransaction(transaction, { commitment: 'confirmed' });
})()


