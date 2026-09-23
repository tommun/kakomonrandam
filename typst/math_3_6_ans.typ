#set page(width: auto, height: auto, margin: (x: 12pt, y: 10pt), fill: rgb("#f8fafc"))
#set text(font: ("Noto Sans CJK JP", "Yu Gothic", "Meiryo", "Arial"), size: 11pt, fill: rgb("#1e293b"))

#text(weight: "bold", fill: rgb("#0284c7"))[(1) 隣接行列 $R$]
$
R = mat(
  0, 1, 1, 0, 0;
  1, 0, 0, 1, 0;
  1, 0, 0, 1, 0;
  0, 1, 1, 0, 1;
  0, 0, 0, 1, 0;
)
$

#v(4pt)
#text(weight: "bold", fill: rgb("#0284c7"))[(2) 各人の次数とランキング]
$
R vec(1, 1, 1, 1, 1) = vec(2, 2, 2, 3, 1)
$
#text(size: 10.5pt)[
  次数の大きい順に、\
  *次数 3* … D \
  *次数 2* … A, B, C \
  *次数 1* … E
]

#v(4pt)
#text(weight: "bold", fill: rgb("#0284c7"))[(3) 距離表と距離の総和によるランキング]
#table(
  columns: (32pt, 24pt, 24pt, 24pt, 24pt, 24pt, 36pt),
  align: center + horizon,
  stroke: 0.5pt + rgb("#cbd5e1"),
  fill: (x, y) => if y == 0 { rgb("#e0f2fe") } else { none },
  [], [A], [B], [C], [D], [E], [*合計*],
  [A], [0], [1], [1], [2], [3], [7],
  [B], [1], [0], [2], [1], [2], [6],
  [C], [1], [2], [0], [1], [2], [6],
  [D], [2], [1], [1], [0], [1], [*5*],
  [E], [3], [2], [2], [1], [0], [8],
)

#text(size: 10.5pt)[
  他メンバーへの距離の総和が小さい順に、\
  *距離の総和 5* … D （最も中心性が高い）\
  *距離の総和 6* … B, C \
  *距離の総和 7* … A \
  *距離の総和 8* … E
]
