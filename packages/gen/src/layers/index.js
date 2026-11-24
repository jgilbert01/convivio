import debug from 'debug';
import { mergeResources } from '../utils';
import layerVersion from './layer-version';

export { layerLogicalId } from './layer-version';

const log = debug('cvo:gen:layers');

export class LayerPlugin {
  constructor(options) {
    this.options = options;
  }

  apply(cvo) {
    cvo.hooks.generate.tapPromise(LayerPlugin.name, async (convivio) => {
      log('%j', { convivio });
      if (!convivio.yaml.layers) return;

      Object.values(convivio.yaml.layers).forEach((l) => {
        mergeResources(convivio.json, layerVersion(l, convivio));
      });
    });
  }
}
