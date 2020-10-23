'use strict';

const { registerAndLogin } = require('../../../../test/helpers/auth');
const createModelsUtils = require('../../../../test/helpers/models');
const { createAuthRequest } = require('../../../../test/helpers/request');
const createLockUtils = require('../../../../test/helpers/editing-lock');

let modelsUtils;
let lockUtils;
let rq;

describe('Test type decimal', () => {
  beforeAll(async () => {
    const token = await registerAndLogin();
    rq = createAuthRequest(token);

    modelsUtils = createModelsUtils({ rq });
    lockUtils = createLockUtils({ rq });

    await modelsUtils.createContentTypeWithType('withdecimal', 'decimal');
  }, 60000);

  afterAll(async () => {
    await modelsUtils.deleteContentType('withdecimal');
  }, 60000);

  test('Create entry with value input JSON', async () => {
    const inputValue = 12.31;
    const res = await rq.post(
      '/content-manager/collection-types/application::withdecimal.withdecimal',
      {
        body: {
          field: inputValue,
        },
      }
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      field: inputValue,
    });
  });

  test('Create entry with integer should convert to decimal', async () => {
    const inputValue = 1821;
    const res = await rq.post(
      '/content-manager/collection-types/application::withdecimal.withdecimal',
      {
        body: {
          field: inputValue,
        },
      }
    );

    expect(res.statusCode).toBe(200);
    expect(res.body).toMatchObject({
      field: 1821.0,
    });
  });

  test('Reading entry, returns correct value', async () => {
    const res = await rq.get(
      '/content-manager/collection-types/application::withdecimal.withdecimal'
    );

    expect(res.statusCode).toBe(200);
    expect(res.body.pagination).toBeDefined();
    expect(Array.isArray(res.body.results)).toBe(true);
    res.body.results.forEach(entry => {
      expect(entry.field).toEqual(expect.any(Number));
    });
  });

  test('Updating entry sets the right value and format', async () => {
    const res = await rq.post(
      '/content-manager/collection-types/application::withdecimal.withdecimal',
      {
        body: {
          field: 11.2,
        },
      }
    );

    const lockUid = await lockUtils.getLockUid('application::withdecimal.withdecimal', res.body.id);
    const updateRes = await rq.put(
      `/content-manager/collection-types/application::withdecimal.withdecimal/${res.body.id}`,
      {
        body: {
          field: 14,
        },
        qs: { uid: lockUid },
      }
    );

    expect(updateRes.statusCode).toBe(200);
    expect(updateRes.body).toMatchObject({
      id: res.body.id,
      field: 14.0,
    });
  });
});
