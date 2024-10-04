import axios, {AxiosResponse} from 'axios';
import {URL_AUTH_TOKEN} from '../library/url.constant';
import {AuthenticationInfo} from './authentication.type';

export class Authentication {
    private _accessToken: string | null = null;

    private constructor() {}

    static async createInstance(apiClientId: string, apiClientSecret: string): Promise<Authentication> {
        const authInstance = new Authentication();
        const token = await authInstance.generateToken(apiClientId, apiClientSecret);
        authInstance._accessToken = token.data.access_token;

        return authInstance;
    }

    get accessToken(): string {
        return this._accessToken;
    }

    private generateToken(
        apiClientId: string,
        apiClientSecret: string,
    ): Promise<AxiosResponse<AuthenticationInfo, any>> {
        try {
            const authKey = Buffer.from(apiClientId + ':' + apiClientSecret, 'utf-8').toString('base64');
            const authHeader = 'Basic ' + authKey;

            return axios({
                method: 'post',
                url: URL_AUTH_TOKEN,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: authHeader,
                },
                data: {
                    grant_type: 'client_credentials',
                },
            });
        } catch (error) {
            console.log('Failed Authentication');
            throw new Error(`Authentication Required - ${error.code} : ${error.message}`);
        }
    }
}
