import {ProBitSDK} from '../src';

async function main() {
    const secret = 'your-secret-key';
    const key = 'your-key';
    const sdk = await ProBitSDK.createInstance(key, secret);
    const connect = await sdk.connect();
    console.log(`connect: ${connect}`);

    await sdk.connectMarketData('BTC-USDT', ['order_books_l0', 'order_books_l4', 'recent_trades', 'ticker']);
    await sdk.connectMyBalance();
    await sdk.connectOpenOrder();

    // console.log('MarketData-order_books_l0: ' + JSON.stringify(sdk.getCachedData('marketdata', 'BTC-USDT', 'order_books_l0')));
    // console.log('MarketData-order_books_l4: ' + JSON.stringify(sdk.getCachedData(WebSocketChannel.MARKET_DATA, 'BTC-USDT', 'order_books_l4')));
    // console.log('MarketData-recent_trades: ' + JSON.stringify(sdk.getCachedData(WebSocketChannel.MARKET_DATA, 'BTC-USDT', 'recent_trades')));
    // console.log('MarketData-ticker: ' + JSON.stringify(sdk.getCachedData(WebSocketChannel.MARKET_DATA, 'BTC-USDT', 'ticker')));

    console.log('Balance : ' + JSON.stringify(sdk.getCachedData('balance')));
    console.log('Open Order : ' + JSON.stringify(sdk.getCachedData('open_order')));
}

main().catch((e) => {
    console.log(e);
});
