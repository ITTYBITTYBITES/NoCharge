import { writeFileSync } from 'node:fs';

import { describe, expect, test } from 'vitest';

import { computeCoverage, isExactCover, isRequired, isVoid, requiredSet } from './coverage';
import { createState, placeBeacon } from './engine';
import { PUZZLES } from './puzzles';
import {
  candidateThreshold,
  connectedComponents,
  duplicatePairs,
  legalCandidates,
  reviewRow,
} from './quality';
import { countSolutions, findSolutions } from './solver';

describe('independent puzzle geometry', () => {
  test('authors required cells or a full board instead of deriving a mask from the solution', () => {
    for (const puzzle of PUZZLES) {
      const required = requiredSet(puzzle).size;
      expect(required).toBeGreaterThan(0);
      const full = puzzle.width * puzzle.height - puzzle.blocked.length;
      if (!puzzle.required) expect(required).toBe(full);
      else expect(puzzle.required.length).toBe(required);
    }
  });

  test('void and blocked are distinct', () => {
    const intro = PUZZLES[0]!;
    expect(isVoid(intro, 0, 0)).toBe(true);
    expect(intro.blocked).toHaveLength(0);
    const blockedLane = PUZZLES.find((puzzle) => puzzle.id === 'bl-19-blocked-lane')!;
    expect(blockedLane.blocked.length).toBeGreaterThan(0);
    expect(isRequired(blockedLane, 2, 2)).toBe(false);
    expect(isVoid(blockedLane, 2, 2)).toBe(false);
  });

  test('no rotational or reflected duplicates', () => {
    expect(duplicatePairs(PUZZLES)).toEqual([]);
  });

  test('candidate counts meet the review threshold', () => {
    PUZZLES.forEach((puzzle, index) => {
      expect(legalCandidates(puzzle).length, puzzle.id).toBeGreaterThanOrEqual(candidateThreshold(index, puzzle.par));
    });
  });

  test('connected components are documented when disconnected', () => {
    for (const puzzle of PUZZLES) {
      if (connectedComponents(puzzle) > 1) expect(puzzle.componentNote, puzzle.id).toBeTruthy();
    }
  });

  test.each(PUZZLES)('$id solution is independently legal and exact', (puzzle) => {
    expect(puzzle.par).toBe(puzzle.solution.length);
    expect(isExactCover(puzzle, computeCoverage(puzzle, puzzle.solution))).toBe(true);
    const state = createState(puzzle);
    for (const placement of puzzle.solution) {
      if (placement.locked) continue;
      const result = placeBeacon(state, puzzle, placement, placement.type);
      expect(result.ok, result.announcement).toBe(true);
    }
    expect(state.complete).toBe(true);
    expect(countSolutions(puzzle, 1)).toBeGreaterThan(0);
  });

  test.each(PUZZLES.filter((puzzle) => puzzle.width <= 5 && puzzle.par <= 5))(
    '$id has no smaller cover than par',
    (puzzle) => {
      if (puzzle.par <= 1) return;
      expect(findSolutions(puzzle, { limit: 1, maxBeacons: puzzle.par - 1 }), puzzle.id).toEqual([]);
    },
  );

  test.each(PUZZLES.filter((puzzle) => puzzle.unique))('$id uniqueness holds', (puzzle) => {
    expect(countSolutions(puzzle, 2)).toBe(1);
  });

  test('writes the review artifact from live data', () => {
    const rows = PUZZLES.map((puzzle, index) => reviewRow(puzzle, index));
    const lines = [
      '# Beacon Lattice puzzle review',
      '',
      'Development review only. Not an answer key. Generated from `PUZZLES`.',
      '',
      '| # | ID | Size | Required | % | Void | Blocked | Types | Inventory | Candidates | Par | Smallest | Solutions | Components | Lesson | Note |',
      '| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | --- | ---: | --- | --- |',
      ...rows.map(
        (row) =>
          `| ${row.number} | \`${row.id}\` | ${row.dimensions} | ${row.required} | ${row.requiredPercent} | ${row.voidCells} | ${row.blocked} | ${row.types} | ${row.inventory} | ${row.candidates} | ${row.par} | ${row.smallest ?? '—'} | ${row.solutions} | ${row.components} | ${row.lesson} | ${row.note} |`,
      ),
      '',
    ];
    writeFileSync(new URL('../../../docs/BEACON_LATTICE_PUZZLE_REVIEW.md', import.meta.url), lines.join('\n'));
    expect(rows).toHaveLength(24);
  });
});
