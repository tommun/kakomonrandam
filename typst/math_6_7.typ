#set page(width: auto, height: auto, margin: (x: 12pt, y: 10pt), fill: rgb("#f8fafc"))
#set text(font: ("Noto Sans CJK JP", "Yu Gothic", "Meiryo", "Arial"), size: 12pt, fill: rgb("#1e293b"))

#text(weight: "bold", fill: rgb("#0284c7"))[(1) 推移行列 $P$ の確認]
#text(size: 10.5pt, fill: rgb("#334155"))[
  表の比率より、推移行列は次式で与えられる：
]
$
P = mat(
  0.865, 0.365;
  0.135, 0.635;
)
$

#v(6pt)
#text(weight: "bold", fill: rgb("#0284c7"))[(2) 固有値と固有ベクトルの確認]
$
P vec(73, 27) = mat(0.865, 0.365; 0.135, 0.635) vec(73, 27) = vec(73, 27) = 1 dot vec(73, 27)
$
$
P vec(-1, 1) = mat(0.865, 0.365; 0.135, 0.635) vec(-1, 1) = vec(-0.5, 0.5) = 0.5 dot vec(-1, 1)
$
#text(size: 10pt, fill: rgb("#64748b"))[※ それぞれ固有値 1 および 0.5 の固有ベクトルであることが確かめられる。]

#v(6pt)
#text(weight: "bold", fill: rgb("#0284c7"))[(3) 将来予測（長期的な割合）]
$
vec(65, 35) = vec(73, 27) + 8 vec(-1, 1)
$
$
P^n vec(65, 35) = vec(73, 27) + 0.5^n dot 8 vec(-1, 1)
$
#text(size: 10.5pt, fill: rgb("#334155"))[
  $n$ を大きくすると $0.5^n arrow 0$ となるため、$P^n vec(65, 35) arrow vec(73, 27)$ となる。\
  したがって、将来的には*現在中心が 73%、未来中心が 27%* に近づく。
]
