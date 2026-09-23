#set page(width: auto, height: auto, margin: (x: 10pt, y: 10pt), fill: rgb("#ffffff"))
#set text(font: ("Yu Gothic", "Meiryo", "Arial"), size: 11pt, fill: rgb("#1e293b"))

#grid(
  columns: (1fr, 1fr),
  column-gutter: 18pt,
  [
    (1)
    $
    cases(
      5x + 2y + z = 5,
      x + y + 2z = 1,
      2x + z = 1
    )
    $
  ],
  [
    (2)
    $
    mat(
      2, 3, 1;
      -1, 7, -3;
      3, 2, 2;
    )
    vec(x, y, z) = vec(0, 0, 1)
    $
  ]
)
