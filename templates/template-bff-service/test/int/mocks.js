// eslint-disable-next-line no-unused-vars
import * as sinon from 'sinon';

import * as utils from '../../src/utils';

// ==========================
// Mock dates, uuids, etc
// ==========================
sinon.stub(utils, 'now').returns(1722607600001); // TODO update when re-recording
