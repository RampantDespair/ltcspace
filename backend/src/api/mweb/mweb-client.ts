import axios, { AxiosRequestConfig } from 'axios';
import config from '../../config';

class MwebClient {
  private get baseUrl(): string {
    return config.MWEB.API_URL.replace(/\/+$/, '');
  }

  private get timeout(): number {
    return config.MWEB.TIMEOUT_MS;
  }

  stream(path: string, params?: Record<string, string | number | undefined>, requestId?: string) {
    const url = this.baseUrl + path;
    const options: AxiosRequestConfig = {
      responseType: 'stream',
      timeout: this.timeout,
      params,
      validateStatus: () => true,
    };
    if (requestId) {
      options.headers = { 'X-Request-ID': requestId };
    }
    return axios.get(url, options);
  }
}

export default new MwebClient();
