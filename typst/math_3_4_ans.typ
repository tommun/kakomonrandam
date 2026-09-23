#set page(width: auto, height: auto, margin: (x: 10pt, y: 10pt), fill: rgb("#ffffff"))
#set text(font: ("Yu Gothic", "Meiryo", "Arial"), size: 10.5pt, fill: rgb("#1e293b"))

#grid(
  columns: (1fr, 1fr),
  row-gutter: 12pt,
  column-gutter: 14pt,
  [
    (1) $vec(3, 1, 4)$
  ],
  [
    (2) $vec(1, -4, 1)$
  ],
  [
    (3) $1$
  ],
  [
    (4) $0$
  ],
  [
    (5) $vec(9, 16)$
  ],
  [
    (6) $vec(10, 10, 12)$
  ],
  [
    (7) $mat(8, 7; 9, 16)$
  ],
  [
    (8) $mat(4, 4, 3; 7, 7, 8; 3, 3, 5)$
  ],
  [
    (9) $mat(13, 8; 8, 5)$
  ],
  [
    (10) $mat(4, 4, 5; 5, 5, 6; 8, 9, 12)$
  ]
)
