import fs from 'fs';
import os from 'os';
import {
    createKeyPairSignerFromBytes,
    createSolanaRpc,
    createSolanaRpcSubscriptions,
    MessageSigner,
    Rpc,
    RpcSubscriptions,
    sendAndConfirmTransactionFactory,
    SolanaRpcApi,
    SolanaRpcSubscriptionsApi,
    TransactionSigner,
} from '@solana/kit';
import dotenv from 'dotenv';
dotenv.config();

const solanaRPC = process.env.SOLANA_RPC || '';
if (!solanaRPC) {
    throw new Error('Missing SOLANA_RPC in .env');
}

export type Client = {
    rpc: Rpc<SolanaRpcApi>;
    rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
    sendAndConfirmTransaction: ReturnType<typeof sendAndConfirmTransactionFactory>;
    wallet: TransactionSigner & MessageSigner;
};


let client: Client | undefined;
export async function createClient(): Promise<Client> {
    if (!client) {
        const homeDir = os.homedir();
        const keypairFile = fs.readFileSync(`${homeDir}/.config/solana/id.json`);
        const keypairBytes = new Uint8Array(JSON.parse(keypairFile.toString()));
        const myKeyPairSigner = await createKeyPairSignerFromBytes(keypairBytes);

        const rpc = createSolanaRpc(solanaRPC);
        
        const wssUrl = solanaRPC.replace(/^https?:\/\//, 'wss://');
        const rpcSubscriptions = createSolanaRpcSubscriptions(wssUrl);

        const sendAndConfirmTransaction = sendAndConfirmTransactionFactory({
            rpc,
            rpcSubscriptions,
        });

        client = {
            rpc,
            rpcSubscriptions,
            sendAndConfirmTransaction,
            wallet: myKeyPairSigner,
        };
    }
    return client;
}