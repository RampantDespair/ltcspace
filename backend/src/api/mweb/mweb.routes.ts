import { Application, Request, Response } from 'express';
import config from '../../config';
import logger from '../../logger';
import mwebClient from './mweb-client';

class MwebRoutes {
  public initRoutes(app: Application): void {
    const prefix = config.MEMPOOL.API_URL_PREFIX + 'mweb';
    app
      .get(prefix + '/healthz', this.proxy('/healthz', undefined, true))
      .get(prefix + '/sync/status', this.proxy('/sync/status'))
      .get(prefix + '/blocks/tip', this.proxy('/blocks/tip'))
      .get(prefix + '/blocks/by-height/:height', (req, res) =>
        this.proxy(`/blocks/by-height/${encodeURIComponent(req.params.height)}`)(req, res))
      .get(prefix + '/blocks/:hash/broadcasts', (req, res) =>
        this.proxy(`/blocks/${encodeURIComponent(req.params.hash)}/broadcasts`, ['cursor', 'limit'])(req, res))
      .get(prefix + '/blocks/:hash', (req, res) =>
        this.proxy(`/blocks/${encodeURIComponent(req.params.hash)}`)(req, res))
      .get(prefix + '/kernels/:kernel_id', (req, res) =>
        this.proxy(`/kernels/${encodeURIComponent(req.params.kernel_id)}`)(req, res))
      .get(prefix + '/outputs/:output_id', (req, res) =>
        this.proxy(`/outputs/${encodeURIComponent(req.params.output_id)}`)(req, res))
      .get(prefix + '/inputs/by-output/:output_id', (req, res) =>
        this.proxy(`/inputs/by-output/${encodeURIComponent(req.params.output_id)}`)(req, res))
      .get(prefix + '/inputs/:input_hash', (req, res) =>
        this.proxy(`/inputs/${encodeURIComponent(req.params.input_hash)}`)(req, res))
      .get(prefix + '/tx/:txid', (req, res) =>
        this.proxy(`/tx/${encodeURIComponent(req.params.txid)}`)(req, res))
      .get(prefix + '/pegins/:tx_hash/:vout_idx', (req, res) =>
        this.proxy(`/pegins/${encodeURIComponent(req.params.tx_hash)}/${encodeURIComponent(req.params.vout_idx)}`)(req, res))
      .get(prefix + '/pegins/', this.proxy('/pegins/', ['value', 'from_height', 'to_height']))
      .get(prefix + '/pegouts/:kernel_id/:pegout_idx', (req, res) =>
        this.proxy(`/pegouts/${encodeURIComponent(req.params.kernel_id)}/${encodeURIComponent(req.params.pegout_idx)}`)(req, res))
      .get(prefix + '/pegouts/', this.proxy('/pegouts/', ['address', 'cursor', 'limit']))
      .get(prefix + '/addresses/:address/pegouts', (req, res) =>
        this.proxy(`/addresses/${encodeURIComponent(req.params.address)}/pegouts`, ['cursor', 'limit'])(req, res))
      .get(prefix + '/addresses/:address/cluster', (req, res) =>
        this.proxy(`/addresses/${encodeURIComponent(req.params.address)}/cluster`)(req, res))
      .get(prefix + '/supply/current', this.proxy('/supply/current'))
      .get(prefix + '/supply/history', this.proxy('/supply/history', ['from', 'to']))
      .get(prefix + '/mempool/:mempool_tx_id', (req, res) =>
        this.proxy(`/mempool/${encodeURIComponent(req.params.mempool_tx_id)}`)(req, res))
      .get(prefix + '/mempool', this.proxy('/mempool', ['cursor', 'limit']))
      .get(prefix + '/heuristic/amount-match',
        this.proxy('/heuristic/amount-match', ['value', 'from_height', 'to_height']));
  }

  private proxy(upstreamPath: string, forwardParams?: string[], isHealthz = false) {
    return async (req: Request, res: Response): Promise<void> => {
      try {
        const params: Record<string, string> = {};
        if (forwardParams) {
          for (const key of forwardParams) {
            const v = req.query[key];
            if (typeof v === 'string' && v.length) {
              params[key] = v;
            }
          }
        }
        const requestId = (req.header('x-request-id') || '').slice(0, 128) || undefined;
        const path = isHealthz ? upstreamPath : (upstreamPath.startsWith('/') ? upstreamPath : '/' + upstreamPath);
        const response = await mwebClient.stream(path, params, requestId);

        res.status(response.status);
        const passthrough = ['content-type', 'cache-control', 'x-request-id'];
        for (const header of passthrough) {
          const val = response.headers[header];
          if (val) {
            res.setHeader(header, val as string);
          }
        }
        response.data.pipe(res);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        logger.debug(`MWEB proxy error for ${upstreamPath}: ${msg}`);
        if (!res.headersSent) {
          res.status(502).json({ error: { code: 'unavailable', message: 'mwebexplorer unreachable' } });
        }
      }
    };
  }
}

export default new MwebRoutes();
