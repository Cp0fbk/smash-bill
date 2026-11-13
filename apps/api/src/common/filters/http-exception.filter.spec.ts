import { ArgumentsHost, BadRequestException, NotFoundException } from '@nestjs/common';
import { describe, expect, it, vi } from 'vitest';
import { HttpExceptionFilter } from './http-exception.filter';

function createMockHost(requestId = 'req-123') {
  const json = vi.fn();
  const status = vi.fn().mockReturnValue({ json });
  const host = {
    switchToHttp: () => ({
      getRequest: () => ({
        id: requestId,
        method: 'GET',
        url: '/api/v1/clubs/unknown',
        headers: {},
      }),
      getResponse: () => ({
        status,
      }),
    }),
  } as unknown as ArgumentsHost;

  return { host, status, json };
}

describe('HttpExceptionFilter', () => {
  it('formats NotFoundException as { code: NOT_FOUND, message, requestId }', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createMockHost('req-abc-404');

    filter.catch(new NotFoundException('Club not found'), host);

    expect(status).toHaveBeenCalledWith(404);
    expect(json).toHaveBeenCalledWith({
      code: 'NOT_FOUND',
      message: 'Club not found',
      requestId: 'req-abc-404',
    });
  });

  it('preserves custom domain error codes and validation details', () => {
    const filter = new HttpExceptionFilter();
    const { host, status, json } = createMockHost('req-400');

    filter.catch(
      new BadRequestException({
        code: 'NO_PARTICIPANTS',
        message: 'At least one present player is required',
        details: { matchId: 'm1' },
      }),
      host,
    );

    expect(status).toHaveBeenCalledWith(400);
    expect(json).toHaveBeenCalledWith({
      code: 'NO_PARTICIPANTS',
      message: 'At least one present player is required',
      details: { matchId: 'm1' },
      requestId: 'req-400',
    });
  });
});
