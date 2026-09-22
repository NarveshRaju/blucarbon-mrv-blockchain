import apiClient from './api';
import { getProjects, getMyProjects } from './projectService';

jest.mock('./api', () => ({ get: jest.fn() }));

test.each(['<!doctype html><html></html>', { error: 'Unavailable' }, null])('rejects non-list API data: %p', async data => {
  apiClient.get.mockResolvedValue({ data });
  await expect(getProjects()).rejects.toThrow('invalid project list');
  await expect(getMyProjects('0x123')).rejects.toThrow('invalid project list');
});

test('returns valid project arrays including an empty list', async () => {
  apiClient.get.mockResolvedValue({ data: [] });
  await expect(getProjects()).resolves.toEqual([]);
});
