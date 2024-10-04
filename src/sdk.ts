import {WEBSOCKET_CONNECTION} from './library/url.constant';
import {Authentication} from './authentication/authentication';
import {SocketClient} from './web_socket/client';
import {Channel, FilterType, WebSocketChannel} from './web_socket/client.types';
import {CloseEvent} from 'ws';

export class ProBitSDK {
    private authentication: Authentication;
    private socketClient: SocketClient;

    private constructor(authentication: Authentication) {
        this.authentication = authentication;
        this.socketClient = new SocketClient(WEBSOCKET_CONNECTION);
    }

    static async createInstance(apiClientId: string, apiClientSecret: string): Promise<ProBitSDK> {
        const authInstance = await Authentication.createInstance(apiClientId, apiClientSecret);
        return new ProBitSDK(authInstance);
    }

    public async connect(): Promise<boolean> {
        return new Promise((resolve, reject) => {
            this.socketClient.connect();

            this.socketClient.once('open', () => resolve(true));
            this.socketClient.once('onclose', (close: CloseEvent) => reject(close));
        });
    }

    public getCachedData(channel: Channel, market_id?: string, filter?: string) {
        if (channel == WebSocketChannel.MARKET_DATA) {
            return this.socketClient.getCachedMarketData(market_id, filter);
        } else {
            return this.socketClient.getCachedData(channel);
        }
    }

    public async connectMarketData(market_id: string, filter: FilterType[]): Promise<void> {
        this.connectionCheck();
        this.socketClient.getMarketData(market_id, filter);

        return new Promise((resolve, reject) => {
            this.socketClient.once('marketdata', () => resolve());
            this.socketClient.once('onclose', (close: CloseEvent) => reject(close));
        });
    }

    public async connectMyBalance(): Promise<void> {
        await this.processAuthentication();
        this.socketClient.getMyBalance();

        return new Promise((resolve, reject) => {
            this.socketClient.once('balance', () => resolve());
            this.socketClient.once('onclose', (close: CloseEvent) => reject(close));
        });
    }

    public async connectOpenOrder(): Promise<void> {
        await this.processAuthentication();
        this.socketClient.getOpenOrder();

        return new Promise((resolve, reject) => {
            this.socketClient.once('open_order', () => resolve());
            this.socketClient.once('onclose', (close: CloseEvent) => reject(close));
        });
    }

    private connectionCheck(): void {
        if (!this.socketClient.connected) {
            throw new Error('Websocket is not connected');
        }
    }

    private async processAuthentication(): Promise<boolean> {
        this.connectionCheck();

        if (!this.socketClient.authenticated) {
            return new Promise((resolve, reject) => {
                this.socketClient.getAuthentication(this.authentication.accessToken);
                this.socketClient.once('authentication', (result: boolean) => resolve(result));
                this.socketClient.once('onclose', (close: CloseEvent) => reject(close));
            });
        }
    }
}
