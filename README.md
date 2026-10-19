# evergreenbloom-demo

松櫻祭視覺風格確認用的純前端 demo（無建置、無依賴）。直接開 `index.html`，或：

```bash
python3 -m http.server 8000
```

- 四頁：主視覺 / 宣言 / 松 / 櫻
- 色票：`#DCB5FF` `#97CBFF` `#BBFFBB` `#FFFFB9` `#FFC1E0`（草地斜面 `#AEFFDC`、樹幹取自版面圖）
- 字體：目標為可畫「輕中宋」，demo 暫以 Google Fonts 的 Noto Serif TC 代替
- 噴漆粉霧質感：SVG `feTurbulence` 雜訊（插畫邊緣與白色粉塵）+ 整頁 soft-light 顆粒層
