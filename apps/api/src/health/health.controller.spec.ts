import { HealthController } from './health.controller';
describe('HealthController', () => {
  it('returns service status', () =>
    expect(new HealthController().check()).toEqual({ status: 'ok', service: 'contextos-api' }));
});
