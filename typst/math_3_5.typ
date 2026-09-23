#set page(width: auto, height: auto, margin: (x: 10pt, y: 10pt), fill: rgb("#ffffff"))
#set text(font: ("Yu Gothic", "Meiryo", "Arial"), size: 11pt, fill: rgb("#1e293b"))

#grid(
  columns: (1fr, 1fr),
  column-gutter: 18pt,
  [
    (1)
    $
    mat(
      5, 2, 1;
      1, 1, 2;
      2, 0, 1;
    )
    vec(x, y, z) = vec(5, 1, 1)
    $
  ],
  [
    (2)
    $
    cases(
      2x + 3y + z = 0,
      -x + 7y - 3z = 0,
      3x + 2y + 2z = 1
    )
    $
  ]
)
