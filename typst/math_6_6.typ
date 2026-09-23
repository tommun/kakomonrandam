#set page(width: auto, height: auto, margin: (x: 12pt, y: 10pt), fill: rgb("#f8fafc"))
#set text(font: ("Noto Sans CJK JP", "Yu Gothic", "Meiryo", "Arial"), size: 12pt, fill: rgb("#1e293b"))

#text(weight: "bold", fill: rgb("#0284c7"))[(1) 営業中・空き店舗の推移行列 $P$]
$
P = mat(
  0.85, 0.70;
  0.15, 0.30;
)
$

#v(6pt)
#text(weight: "bold", fill: rgb("#0284c7"))[(2) 固有値と固有ベクトルの確認]
$
P vec(14, 3) = mat(0.85, 0.70; 0.15, 0.30) vec(14, 3) = vec(14, 3) = 1 dot vec(14, 3)
$
$
P vec(-1, 1) = mat(0.85, 0.70; 0.15, 0.30) vec(-1, 1) = vec(-0.15, 0.15) = 0.15 dot vec(-1, 1)
$
#text(size: 10pt, fill: rgb("#64748b"))[※ それぞれ固有値 1 および 0.15 の固有ベクトルであることが確かめられる。]

#v(6pt)
#text(weight: "bold", fill: rgb("#0284c7"))[(3) 長期的な推移の予測]
$
vec(100, 70) = 10 vec(14, 3) + 40 vec(-1, 1)
$
$
P^n vec(100, 70) = 10 vec(14, 3) + 0.15^n dot 40 vec(-1, 1)
$
#text(size: 10.5pt, fill: rgb("#334155"))[
  $n$ を大きくすると $0.15^n arrow 0$ となるため、$P^n vec(100, 70) arrow 10 vec(14, 3) = vec(140, 30)$ となる。\
  したがって、長期的には*営業中の店舗数は 140、空き店舗数は 30* に近づく。
]
