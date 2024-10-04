import {EventEmitter} from 'events';
import {
    FilterType,
    INTERVAL,
    MyBalance,
    MyDividedOrderBook,
    MyOpenOrder,
    MyOrderBook,
    MyRecentTrade,
    MyTicker,
    OrderBookType,
    WebSocketChannel,
    WebSocketType,
} from './client.types';
import {WebSocket, Event, MessageEvent, ErrorEvent, CloseEvent} from 'ws';

class SocketUtil extends EventEmitter {
    protected cachedData: object = {};
    private maximumCached?: number = 500;

    protected messageHandler: Record<
        FilterType,
        (channel: string, market_id: string, filter: string, value: any) => void
    >;

    constructor() {
        super();
        this.cachedData = {};
        this.messageHandler = {
            ticker: this.caseTicker.bind(this),
            recent_trades: this.caseRecentTrade.bind(this),
            order_books_l0: this.caseOrderBooks.bind(this),
            order_books_l1: this.caseOrderBooks.bind(this),
            order_books_l2: this.caseOrderBooks.bind(this),
            order_books_l3: this.caseOrderBooks.bind(this),
            order_books_l4: this.caseOrderBooks.bind(this),
        };
    }

    protected caseTicker(channel: string, market_id: string, filter: string, value: any): void {
        const data = value as MyTicker;
        const ticker = this.cachedData[channel][market_id][filter] as MyTicker[];

        if (ticker.length >= this.maximumCached) {
            ticker.shift();
        }

        ticker.push(data);
    }

    protected caseRecentTrade(channel: string, market_id: string, filter: string, value: any): void {
        const recentTrade = value as MyRecentTrade[];
        const recent = this.cachedData[channel][market_id][filter] as MyRecentTrade[];

        for (const data of recentTrade) {
            if (recent.length >= this.maximumCached) {
                recent.shift();
            }

            recent.push(data);
        }
    }

    protected caseOrderBooks(channel: string, market_id: string, filter: string, value: any): void {
        const orderBook = value as MyOrderBook[];

        const marketBuy = this.cachedData[channel][market_id][filter].buy as MyDividedOrderBook;
        const marketSell = this.cachedData[channel][market_id][filter].sell as MyDividedOrderBook;

        // Save the data into two different dictionaries (buy/sell), remove the key if quantity is 0
        for (const data of orderBook) {
            if (data.side === 'buy') {
                if (data.quantity === '0') {
                    delete marketBuy[data.price];
                } else {
                    marketBuy[data.price] = data.quantity;
                }
            } else if (data.side === 'sell') {
                if (data.quantity === '0') {
                    delete marketSell[data.price];
                } else {
                    marketSell[data.price] = data.quantity;
                }
            }
        }
    }
}

export class SocketClient extends SocketUtil {
    private socketUrl: string;
    private client: WebSocket;
    private _connected: boolean;
    private _authenticated: boolean;

    constructor(socketUrl: string) {
        super();
        this.socketUrl = socketUrl;
        this._connected = false;
        this._authenticated = false;
    }

    get connected(): boolean {
        return this._connected;
    }

    get authenticated(): boolean {
        return this._authenticated;
    }

    public getCachedMarketData(market_id: string, filter: string) {
        const caseData = (value: any) => {
            return value;
        };

        const caseOrderBooks = (value: any) => {
            const data: MyOrderBook[] = [];
            for (const key in value.buy) {
                data.push({
                    side: 'buy',
                    price: key,
                    quantity: value.buy[key],
                });
            }
            for (const key in value.sell) {
                data.push({
                    side: 'sell',
                    price: key,
                    quantity: value.sell[key],
                });
            }

            return data;
        };

        const caseHandlers: Record<FilterType, (value: any) => any> = {
            ticker: caseData,
            recent_trades: caseData,
            order_books_l0: caseOrderBooks,
            order_books_l1: caseOrderBooks,
            order_books_l2: caseOrderBooks,
            order_books_l3: caseOrderBooks,
            order_books_l4: caseOrderBooks,
        };

        return caseHandlers[filter as FilterType](this.cachedData[WebSocketChannel.MARKET_DATA][market_id][filter]);
    }

    public getCachedData(channel: string) {
        if (channel === WebSocketChannel.MY_BALANCE) {
            let data = [];
            for (const bal in this.cachedData[WebSocketChannel.MY_BALANCE]) {
                data.push({
                    currency_id: bal,
                    total: this.cachedData[WebSocketChannel.MY_BALANCE][bal].total,
                    available: this.cachedData[WebSocketChannel.MY_BALANCE][bal].available,
                });
            }
            return data;
        } else if (channel === WebSocketChannel.OPEN_ORDER) {
            return this.cachedData[WebSocketChannel.OPEN_ORDER];
        }
    }

    public connect(): void {
        if (this.client?.readyState != WebSocket.OPEN) {
            this.client = new WebSocket(this.socketUrl);

            this.client.onopen = (event: Event) => {
                console.log('WebSocket Connection: ', event.type);
                this._connected = true;
                this.emit('open');
            };

            this.client.onmessage = (message: MessageEvent) => {
                const received = JSON.parse(message.data as string);

                if (received.type === WebSocketType.AUTHORIZATION) {
                    if (received.result === 'ok') {
                        this._authenticated = true;
                    } else {
                        this._authenticated = false;
                    }
                    this.emit('authentication', this.authenticated);
                } else {
                    const channel = received.channel as string;

                    if (channel === WebSocketChannel.MARKET_DATA) {
                        for (const key in received) {
                            if (key in this.messageHandler) {
                                this.messageHandler[key as FilterType](channel, received.market_id, key, received[key]);
                            }
                            this.emit('marketdata', this.authenticated);
                        }
                    } else if (channel === WebSocketChannel.MY_BALANCE) {
                        const balance = received.data as MyBalance;
                        for (const data in balance) {
                            this.cachedData[channel][data] = balance[data];
                        }
                        this.emit('balance', this.authenticated);
                    } else if (channel === WebSocketChannel.OPEN_ORDER) {
                        // TODO Need Improvement of saving the data
                        const openOrder = received.data as MyOpenOrder[];
                        this.cachedData[channel] = openOrder;
                        this.emit('open_order', this.authenticated);
                    }
                }
            };

            this.client.onerror = (error: ErrorEvent) => {
                console.error('WebSocket Message Error: ', error.message);
            };

            this.client.onclose = (close: CloseEvent) => {
                console.log(`WebSocket Connection Closed: ${close.code}-${close.reason}`);
                this._connected = false;
                this.emit('onerror', close);
            };
        }
    }

    public getMarketData(market_id: string, filter: FilterType[]): void {
        if (this.cachedData[WebSocketChannel.MARKET_DATA] == null) {
            this.cachedData[WebSocketChannel.MARKET_DATA] = {};
        }
        if (this.cachedData[WebSocketChannel.MARKET_DATA][market_id] == null) {
            this.cachedData[WebSocketChannel.MARKET_DATA][market_id] = {};
        }

        for (const fil of filter) {
            if (this.cachedData[WebSocketChannel.MARKET_DATA][market_id][fil] == null) {
                if (OrderBookType.includes(fil)) {
                    this.cachedData[WebSocketChannel.MARKET_DATA][market_id][fil] = {buy: {}, sell: {}};
                } else {
                    this.cachedData[WebSocketChannel.MARKET_DATA][market_id][fil] = [];
                }
            }
        }

        const message = {
            type: WebSocketType.SUBSCRIBE,
            channel: WebSocketChannel.MARKET_DATA,
            interval: INTERVAL,
            market_id,
            filter,
        };

        this.client.send(JSON.stringify(message));
    }

    public getAuthentication(token: string): void {
        const msg = {
            type: WebSocketType.AUTHORIZATION,
            token,
        };

        this.client.send(JSON.stringify(msg));
    }

    public getMyBalance(): void {
        if (this.cachedData[WebSocketChannel.MY_BALANCE] == null) {
            this.cachedData[WebSocketChannel.MY_BALANCE] = {};
        }

        const msg = {
            type: WebSocketType.SUBSCRIBE,
            channel: WebSocketChannel.MY_BALANCE,
        };

        this.client.send(JSON.stringify(msg));
    }

    public getOpenOrder(): void {
        if (this.cachedData[WebSocketChannel.OPEN_ORDER] == null) {
            this.cachedData[WebSocketChannel.OPEN_ORDER] = {};
        }
        const msg = {
            type: WebSocketType.SUBSCRIBE,
            channel: WebSocketChannel.OPEN_ORDER,
        };

        this.client.send(JSON.stringify(msg));
    }
}
