# Beacon Lattice puzzle review

Development review only. Not an answer key. Generated from `PUZZLES`.

| # | ID | Size | Required | % | Void | Blocked | Types | Inventory | Candidates | Par | Smallest | Solutions | Components | Lesson | Note |
| --- | --- | --- | ---: | ---: | ---: | ---: | --- | --- | ---: | ---: | ---: | --- | ---: | --- | --- |
| 1 | `bl-01-first-plus` | 5×5 | 5 | 20 | 20 | 0 | cross | cross 1 | 5 | 1 | 1 | one | 1 | A Cross covers its cell and the four orthogonal neighbors. | Single verified solution. |
| 2 | `bl-02-long-plus` | 5×5 | 9 | 36 | 16 | 0 | cross | cross 4 | 9 | 4 | 4 | capped | 1 | A full-width plus cannot be covered by a single center Cross. | Multiple solutions exist. |
| 3 | `bl-03-tee` | 5×5 | 9 | 36 | 16 | 0 | cross | cross 4 | 9 | 4 | 4 | one | 1 | A T-shaped lattice forces Cross placements at the bar ends and stem. | Single verified solution. |
| 4 | `bl-04-ell` | 5×5 | 9 | 36 | 16 | 0 | cross | cross 3 | 9 | 3 | 3 | one | 1 | An L-shaped lattice is covered with fewer Cross beacons than a tee. | Single verified solution. |
| 5 | `bl-05-first-diamond` | 5×5 | 5 | 20 | 20 | 0 | diagonal | diagonal 1 | 5 | 1 | 1 | one | 1 | A Diagonal covers its cell and the four diagonal neighbors. | Single verified solution. |
| 6 | `bl-06-plus-or-diamond` | 5×5 | 9 | 36 | 16 | 0 | cross, diagonal | cross 4, diagonal 2 | 18 | 4 | 4 | capped | 1 | A Diagonal is available, but the long plus still closes with four Cross beacons. | Multiple solutions exist. |
| 7 | `bl-07-mixed-tee` | 5×5 | 9 | 36 | 16 | 0 | cross, diagonal | cross 3, diagonal 2 | 18 | 4 | 4 | capped | 1 | On a tee, mixing one Diagonal with Cross beacons can shorten the cover. | Multiple solutions exist. |
| 8 | `bl-08-mixed-ell` | 5×5 | 9 | 36 | 16 | 0 | cross, diagonal | cross 3, diagonal 2 | 18 | 3 | 3 | capped | 1 | Mixing types on an L changes which leftover gaps remain. | Multiple solutions exist. |
| 9 | `bl-09-across-the-row` | 5×5 | 5 | 20 | 20 | 0 | horizontal | horizontal 2 | 5 | 2 | 2 | capped | 1 | A Horizontal covers only three cells in its row. | Multiple solutions exist. |
| 10 | `bl-10-down-the-column` | 5×5 | 5 | 20 | 20 | 0 | vertical | vertical 2 | 5 | 2 | 2 | capped | 1 | A Vertical covers only three cells in its column. | Multiple solutions exist. |
| 11 | `bl-11-three-rows` | 5×5 | 15 | 60 | 10 | 0 | horizontal, vertical | horizontal 8, vertical 8 | 30 | 7 | 5 | capped | 1 | Horizontal and Vertical bars can share a band without a Cross. | Multiple solutions exist. |
| 12 | `bl-12-open-field` | 5×5 | 25 | 100 | 0 | 0 | horizontal, vertical | horizontal 8, vertical 8 | 50 | 11 | 11 | capped | 1 | A full 5×5 can be tiled with bars alone. | Multiple solutions exist. |
| 13 | `bl-13-hub-rule` | 5×5 | 9 | 36 | 16 | 0 | cross, diagonal | cross 4, diagonal 1 | 17 | 4 | 4 | capped | 1 | If you occupy the hub it must be a Diagonal, but a neighbor Cross can cover it instead. | Multiple solutions exist. |
| 14 | `bl-14-plus-and-base` | 5×5 | 10 | 40 | 15 | 0 | cross, horizontal | cross 2, horizontal 3 | 20 | 3 | 3 | capped | 1 | A connected plus-and-base can be finished with bars plus two Cross beacons. | Multiple solutions exist. |
| 15 | `bl-15-three-tools` | 5×5 | 9 | 36 | 16 | 0 | cross, horizontal, vertical | cross 1, horizontal 2, vertical 2 | 27 | 4 | 4 | capped | 1 | One Cross, two bars of each kind. Waste the Cross and the tee will not close. | Multiple solutions exist. |
| 16 | `bl-16-named-origins` | 5×5 | 15 | 60 | 10 | 0 | horizontal, vertical | horizontal 8, vertical 8 | 14 | 7 | 7 | one | 1 | Beacons may be placed only on the named origin cells. | Single verified solution. |
| 17 | `bl-17-locked-tip` | 5×5 | 9 | 36 | 16 | 0 | cross | cross 4 | 9 | 4 | 4 | capped | 1 | A locked Cross already covers its plus. Build around it. | Multiple solutions exist. |
| 18 | `bl-18-locked-corner` | 5×5 | 9 | 36 | 16 | 0 | cross, diagonal | cross 3, diagonal 2 | 18 | 4 | 4 | capped | 1 | A locked corner Cross changes which mix still fits the tee. | Multiple solutions exist. |
| 19 | `bl-19-blocked-lane` | 5×5 | 20 | 80 | 0 | 5 | horizontal, vertical | horizontal 5, vertical 4 | 40 | 9 | 9 | capped | 2 | A blocked column is an obstacle. Coverage skips it and continues beyond. | The blocked column splits the field into two halves that still share one inventory. |
| 20 | `bl-20-blocked-hub` | 5×5 | 24 | 96 | 0 | 1 | cross, horizontal, vertical | cross 3, horizontal 4, vertical 4 | 72 | 10 | 10 | capped | 1 | A single blocked hub splits what a center Cross could have done. | Multiple solutions exist. |
| 21 | `bl-21-seven-ring` | 7×7 | 40 | 82 | 9 | 0 | cross, horizontal, vertical | cross 6, horizontal 8, vertical 8 | 120 | 16 | 16 | capped | 1 | A thick 7×7 ring leaves a void courtyard, not blocked obstacles. | Multiple solutions exist. |
| 22 | `bl-22-seven-band` | 7×7 | 35 | 71 | 14 | 0 | horizontal, vertical, cross | horizontal 12, vertical 12, cross 6 | 105 | 16 | 16 | capped | 1 | A five-row 7×7 band is a large connected lattice. | Multiple solutions exist. |
| 23 | `bl-23-seven-field` | 7×7 | 49 | 100 | 0 | 0 | cross, diagonal, horizontal, vertical | cross 8, diagonal 8, horizontal 10, vertical 10 | 196 | 17 | 17 | capped | 1 | The full 7×7 uses every cell and every beacon type. | Multiple solutions exist. |
| 24 | `bl-24-seven-lock` | 7×7 | 48 | 98 | 0 | 1 | cross, diagonal, horizontal, vertical | cross 8, diagonal 8, horizontal 10, vertical 10 | 192 | 15 | 15 | capped | 1 | A locked corner plus a blocked hub is the late-game constraint pair. | Multiple solutions exist. |
