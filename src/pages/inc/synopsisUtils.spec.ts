import { getTextForSynopsis } from './synopsisUtils';

describe('Synopsis Utils', () => {
  it.only('synopsis', () => {
    const test1 = getTextForSynopsis('ת"ל "מצות תאכל" - מצוה.');
    expect(test1).toBe('ת"ל מצות תאכל מצוה');
  });
});
