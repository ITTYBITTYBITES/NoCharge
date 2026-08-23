# Mini Sudoku

Mini Sudoku is a 6×6 puzzle with 3×2 boxes and digits 1–6. A shuffled Latin-square solution is generated, then cells are removed only when the backtracking solver confirms a unique solution. Easy removes 12 cells, Medium 16, and Hard 20; these are cell-count labels, not time claims.

Fill, pencil-mark, check, reveal one cell, undo, and regenerate are all local. The solved count and optional current seed use `nocharge:sudoku:puzzles-solved` and `nocharge:sudoku:current-puzzle`; pencil preference uses `nocharge:pref:sudoku-pencil-marks`. Focus, keyboard digits, live actions, visible error cues, zoom, forced colors, and responsive controls support accessibility.

There is no timer, score, streak, leaderboard, or claim of brain training, cognitive benefit, optimal play, or a best solving approach.
