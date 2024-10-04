export const WebSocketType = {
    AUTHORIZATION: 'authorization',
    SUBSCRIBE: 'subscribe',
    UNSUBSCRIBE: 'unsubscribe',
};

export const WebSocketChannel = {
    MARKET_DATA: 'marketdata',
    MY_BALANCE: 'balance',
    OPEN_ORDER: 'open_order',
} as const;

export type Channel = typeof WebSocketChannel[keyof typeof WebSocketChannel];

export type Side = 'buy' | 'sell';

export type MyDividedOrderBook = {
    [key: string]: string;
};

export type MyOrderBook = {
    side: Side;
    price: string;
    quantity: string;
};

type Balance = {
    available: string;
    total: string;
};

export type MyBalance = {
    [key: string]: Balance;
};

export type MyOpenOrder = {
    id: string;
    market_id: string;
    type: string;
    side: string;
    quantity: string;
    limit_price: string;
    time_in_force: string;
    filled_cost: string;
    filled_quantity: string;
    open_quantity: string;
    cancelled_quantity: string;
    status: string;
    time: string;
};

export type TickDirection = 'zero' | 'zeroup' | 'up' | 'zerodown' | 'down';

export type MyRecentTrade = {
    id: string;
    price: string;
    quantity: string;
    time: string;
    side: string;
    tick_direction: TickDirection;
};

export type MyTicker = {
    last: string;
    low: string;
    high: string;
    change: string;
    base_volume: string;
    quote_volume: string;
    market_id: string;
    time: string;
};

export const OrderBookType = ['order_books_l0', 'order_books_l1', 'order_books_l2', 'order_books_l3', 'order_books_l4'];

export type FilterObjectType = Record<string, any>;

export type FilterType =
    | 'ticker'
    | 'recent_trades'
    | 'order_books_l0'
    | 'order_books_l1'
    | 'order_books_l2'
    | 'order_books_l3'
    | 'order_books_l4';

export const INTERVAL = 500;
