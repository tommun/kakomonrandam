#set page(width: auto, height: auto, margin: (x: 10pt, y: 10pt), fill: rgb("#ffffff"))
#set text(font: ("Yu Gothic", "Meiryo", "Arial"), size: 11pt, fill: rgb("#1e293b"))

#grid(
  columns: (1fr, 1fr),
  row-gutter: 14pt,
  column-gutter: 16pt,
  [
    (1) $vec(1, 2, 3) + vec(2, -1, 1)$
  ],
  [
    (2) $2 vec(2, 1, 5) - 3 vec(1, 2, 3)$
  ],
  [
    (3) $mat(2, 3) vec(2, -1)$
  ],
  [
    (4) $mat(1, -1, 1) vec(1, 2, 1)$
  ],
  [
    (5) $mat(2, 1; 3, 2) vec(2, 5)$
  ],
  [
    (6) $mat(1, 3, 1; 2, 1, 2; 1, 1, 3) vec(1, 2, 3)$
  ],
  [
    (7) $mat(2, 1; 1, 3) mat(3, 1; 2, 5)$
  ],
  [
    (8) $mat(1, 0, 1; 2, 1, 1; 1, 1, 0) mat(1, 2, 2; 2, 1, 3; 3, 2, 1)$
  ],
  [
    (9) $mat(2, 1; 1, 1)^3$
  ],
  [
    (10) $mat(1, 1, 1; 2, 1, 1; 1, 2, 3)^2$
  ]
)
