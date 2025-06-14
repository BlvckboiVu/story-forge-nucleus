
import { describe, it, expect } from 'vitest';
import { OutlineValidation } from '../../utils/outline/outlineValidation';

describe('Outline Validation', () => {
  it('validates outline data correctly', () => {
    const invalidData = {
      title: 'x'.repeat(300), // Too long
    };

    expect(() => OutlineValidation.validateOutlineData(invalidData))
      .toThrow('Outline title must be less than 200 characters');
  });

  it('counts total scenes correctly', () => {
    const parts = [
      {
        id: 'part-1',
        title: 'Part I',
        order: 0,
        chapters: [
          {
            id: 'chapter-1',
            title: 'Chapter 1',
            order: 0,
            scenes: [
              { id: 'scene-1', title: 'Scene 1', order: 0, status: 'planned' },
              { id: 'scene-2', title: 'Scene 2', order: 1, status: 'draft' },
            ],
          },
        ],
      },
    ];

    const count = OutlineValidation.countTotalScenes(parts);
    expect(count).toBe(2);
  });

  it('validates scene count limits', () => {
    expect(OutlineValidation.validateSceneCount(99)).toBe(true);
    expect(OutlineValidation.validateSceneCount(100)).toBe(false);
    expect(OutlineValidation.validateSceneCount(50, 51)).toBe(false);
  });
});
