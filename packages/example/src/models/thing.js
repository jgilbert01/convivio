export const DISCRIMINATOR = 'thing';

class Model {
  constructor({
  }) {
  }

  async get(id) {
    return {
      id,
      discriminator: DISCRIMINATOR,
    }
  }

  async save(id, thing) {
    const timestamp = Date.now();
    return {
      id,
      discriminator: DISCRIMINATOR,
      timestamp,
      ...thing,
    };
  }
}

export default Model;
